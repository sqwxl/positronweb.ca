{ pkgs, ... }:

{
  name = "positron.dev";

  packages = [
    pkgs.dart-sass
    pkgs.djlint
    pkgs.eslint_d
    pkgs.gettext
    pkgs.just
    pkgs.marksman
    pkgs.pyright
    pkgs.ruff
    pkgs.ruff-lsp
  ];

  languages.python.enable = true;
  languages.python.venv.enable = true;
  languages.python.venv.requirements = "-r ${./requirements.txt}";

  difftastic.enable = true;

  pre-commit = {
    excludes = [
      ".*/migrations/.*"
    ];
    hooks = {
      nixpkgs-fmt.enable = true;
      ruff.enable = true;
      djlint = {
        enable = true;
        name = "djlint-reformat-django";
        files = ".*/templates/.*\.html$";
        entry = "${pkgs.djlint}/bin/djlint --reformat --profile django --configuration ${./pyproject.toml}";
      };
    };
  };
}
