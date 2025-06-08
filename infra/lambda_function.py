import json
import boto3
import os
from urllib.parse import parse_qs

ses = boto3.client('ses')

def lambda_handler(event, context):
    body = event.get('body', '')
    if event.get('isBase64Encoded', False):
        import base64
        body = base64.b64decode(body).decode('utf-8')

    data = parse_qs(body)

    name = data.get('name', [''])[0]
    email = data.get('email', [''])[0]
    phone = data.get('phone', [''])[0]
    message = data.get('message', [''])[0]

    ses_address = os.environ.get('SES_ADDRESS')
    
    ses.send_email( Source=ses_address,
        Destination={ 'ToAddresses': [ses_address] }, 
        Message={ 'Subject': {'Data': 'Positron Contact Form'},
            'Body': {'Text': {'Data': f"""
            Sender: {name}
            Email: {email}
            Phone: {phone}
            
            Message:
            {message}
            """}}
        }
    )
    
    return {
        "statusCode": 200,
        "text": 'OK'
    }
