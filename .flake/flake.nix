{
  description = "Dependencies";

  inputs = {
    # nixpkgs.url = "github.com/identinet/nixpkgs/identinet";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
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
        allOsPackages = with pkgs; [
          bashInteractive # bash used in scripts
          caddy # HTTP server https://caddyserver.com/
          cloudflared # Cloudflare Tunnel daemon https://www.cloudflare.com/products/tunnel
          just # Simple make replacement https://just.systems/
          mkcert # Locally trusted development certificates https://github.com/FiloSottile/mkcert
          unstable.nushell # Nu Shell https://www.nushell.sh/
          # performance testing
          vegeta
          uroboros
        ];
        linuxOnlyPackages = [
          # datree # kubernetes configuration validation and verification https://datree.io/
        ];
      in
      {
        devShell = pkgs.mkShell {
          nativeBuildInputs =
            if pkgs.system == "x86_64-linux" then allOsPackages ++ linuxOnlyPackages else allOsPackages;
          buildInputs = [ ];
        };
      }
    );
}
