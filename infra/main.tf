terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "2.7.1"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "bucket" {
  bucket = "positronweb.ca"
}

resource "aws_s3_bucket_website_configuration" "static_site" {
  bucket = aws_s3_bucket.bucket.bucket
  error_document {
    key = "index.html"
  }
  index_document {
    suffix = "index.html"
  }
}

locals {
  contact_email      = "nilueps+positronweb.ca@gmail.com"
  contact_route_path = "/contact"
}

# 
# GitHub OIDC
#

module "github_oidc_provider" {
  source       = "terraform-module/github-oidc-provider/aws"
  version      = "2.2.1"
  role_name    = "PositronGitHubRole"
  repositories = ["sqwxl/positronweb.ca"]
}

data "aws_iam_policy_document" "github_oidc_permissions" {
  statement {
    sid       = "CloudFrontInvalidate"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [aws_cloudfront_distribution.s3_distribution.arn]
  }

  statement {
    sid       = "S3ObjectOps"
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:ListBucket", "s3:DeleteObject"]
    resources = [aws_s3_bucket.bucket.arn, "${aws_s3_bucket.bucket.arn}/*"]
  }
}

resource "aws_iam_role_policy" "github_oidc_permissions" {
  name = "PositronGitHubRoleAccess"
  role = split("/", module.github_oidc_provider.oidc_role)[1]

  policy = data.aws_iam_policy_document.github_oidc_permissions.json
}

# 
# SES
#

resource "aws_ses_email_identity" "contact" {
  email = local.contact_email
}

#
# Lambda
#

resource "aws_iam_role" "lambda_role" {
  name = "lambda_exec_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_attach_exec" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "send_email" {
  statement {
    effect    = "Allow"
    actions   = ["ses:SendEmail"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "allow_ses_sendemail" {
  name   = "AllowSESSendEmail"
  policy = data.aws_iam_policy_document.send_email.json
}

resource "aws_iam_role_policy_attachment" "lambda_attach_ses_sendemail" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.allow_ses_sendemail.arn
}

data "archive_file" "lambda_fn" {
  type             = "zip"
  source_file      = "${path.module}/lambda_function.py"
  output_file_mode = "0644"
  output_path      = "${path.module}/PositronContactFormHandler.zip"
}

resource "aws_lambda_function" "function" {
  function_name    = "PositronContactFormHandler"
  filename         = data.archive_file.lambda_fn.output_path
  source_code_hash = data.archive_file.lambda_fn.output_base64sha256
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.13"
  role             = aws_iam_role.lambda_role.arn
  environment {
    variables = {
      SES_ADDRESS = local.contact_email
    }
  }
}

#
# API Gateway
#

resource "aws_apigatewayv2_api" "api" {
  api_key_selection_expression = "$request.header.x-api-key"
  ip_address_type              = "ipv4"
  name                         = "PositronGateway"
  protocol_type                = "HTTP"
  route_selection_expression   = "$request.method $request.path"
  cors_configuration {
    allow_origins = ["https://positronweb.ca", "https://www.positronweb.ca"]
  }
}

resource "aws_apigatewayv2_integration" "integration" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_method     = "POST"
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.function.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "contact" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "POST ${local.contact_route_path}"
  target    = "integrations/${aws_apigatewayv2_integration.integration.id}"
}

resource "aws_lambda_permission" "apigw_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_stage" "stage" {
  api_id      = aws_apigatewayv2_api.api.id
  auto_deploy = true
  name        = "prod"
}

locals {
  cf_origin_name = "positronweb.ca-prod"
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.static_site.website_domain
    origin_id   = local.cf_origin_name
    custom_origin_config {
      http_port                = 80
      https_port               = 443
      origin_keepalive_timeout = 5
      origin_protocol_policy   = "http-only"
      origin_read_timeout      = 30
      origin_ssl_protocols     = ["SSLv3", "TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }

  aliases             = ["positronweb.ca", "www.positronweb.ca"]
  default_root_object = "index.html"
  enabled             = true

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "redirect-to-https"
    target_origin_id       = local.cf_origin_name

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.append_html_extension.arn
    }

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method       = "sni-only"
  }

}


resource "aws_cloudfront_function" "append_html_extension" {
  code    = file("${path.module}/cf_function.js")
  name    = "AppendHTMLExtension"
  runtime = "cloudfront-js-2.0"
}


resource "aws_acm_certificate" "cert" {
  domain_name               = "positronweb.ca"
  subject_alternative_names = ["*.positronweb.ca", "positronweb.ca"]
  validation_method         = "DNS"
  options {
    certificate_transparency_logging_preference = "ENABLED"
  }
}

resource "aws_route53_zone" "primary" {
  name = "positronweb.ca"
}

resource "aws_route53_record" "a" {
  name    = "positronweb.ca"
  type    = "A"
  zone_id = aws_route53_zone.primary.zone_id
  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
  }
}

resource "aws_route53_record" "www" {
  name    = "www.positronweb.ca"
  type    = "A"
  zone_id = aws_route53_zone.primary.zone_id
  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.s3_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = aws_route53_zone.primary.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]

  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "validation" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]

  depends_on = [aws_route53_record.cert_validation]
}

output "contact_form_endpoint" {
  value = "${aws_apigatewayv2_api.api.api_endpoint}/${aws_apigatewayv2_stage.stage.name}${local.contact_route_path}"
}

output "github_role" {
  value = module.github_oidc_provider.oidc_role
}

output "distribution_id" {
  value = aws_cloudfront_distribution.s3_distribution.id
}
