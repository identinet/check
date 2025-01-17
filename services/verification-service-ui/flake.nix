# Documentation: https://nixos.wiki/wiki/Flakes
# Documentation: https://yuanwang.ca/posts/getting-started-with-flakes.html
{
  description = "NixOS docker image";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-24.11";
    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs, nixpkgs-unstable, flake-utils, }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        unstable = nixpkgs-unstable.legacyPackages.${system};
        manifest = pkgs.lib.importJSON ./manifest.json;

      in rec {
        # Development environment: nix develop
        devShells.default = pkgs.mkShell {
          name = manifest.name;
          nativeBuildInputs = with pkgs; [
            # nodejs_22
            deno
            gh
            git-cliff
            just
            unstable.cargo-watch
            unstable.nushell
            unstable.skopeo
          ];
        };

        devShells.ci = pkgs.mkShell {
          name = manifest.name;
          nativeBuildInputs = with pkgs; [
            just
            unstable.nushell
            unstable.skopeo
          ];
        };
      });
}
