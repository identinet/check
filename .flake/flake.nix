{
  description = "Dependencies";

  inputs.nixpkgs_unstable.url = "github:NixOS/nixpkgs/nixos-unstable";
  # inputs.nixpkgs.url = "github.com/identinet/nixpkgs/identinet";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs =
    {
      self,
      nixpkgs,
      nixpkgs_unstable,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        unstable = nixpkgs_unstable.legacyPackages.${system};
        allOsPackages = with pkgs; [
          bashInteractive # bash used in scripts
          caddy # HTTP server https://caddyserver.com/
          just # Simple make replacement https://just.systems/
          mkcert # Locally trusted development certificates https://github.com/FiloSottile/mkcert
          unstable.nushell # Nu Shell https://www.nushell.sh/
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
