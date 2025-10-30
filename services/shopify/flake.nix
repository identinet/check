# Documentation: https://nixos.wiki/wiki/Flakes
# Documentation: https://yuanwang.ca/posts/getting-started-with-flakes.html
{
  description = "NixOS docker image";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      nixpkgs-unstable,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [
            (self: super: {
              unstable = import nixpkgs-unstable {
                inherit system;
                # config.allowUnfree = true;
              };
            })
          ];
        };
        default_pkg = pkgs.callPackage ./default.nix {
          inherit pkgs;
          nodejs = pkgs.nodejs_24;
        };

      in
      rec {
        # Development environment: nix develop
        devShells.default = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [
            nodejs_24
            shopify-cli
          ];
        };
      }
    );
}
