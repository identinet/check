# Documentation: https://nixos.wiki/wiki/Flakes
# Documentation: https://yuanwang.ca/posts/getting-started-with-flakes.html
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixos-unstable";
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
      in
      rec {
        # Development environment: nix develop
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # required for installing the sharp dependency
            # https://sharp.pixelplumbing.com/
            gcc
            glib
            pkg-config
            vips
          ];
          nativeBuildInputs = with pkgs; [
            deno
            nodejs_24
            just
            unstable.nushell
          ];
        };
        env = {
          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
            pkgs.vips
            pkgs.glib
          ];
        };
      }
    );
}
