# Documentation: https://nixos.wiki/wiki/Flakes
# Documentation: https://yuanwang.ca/posts/getting-started-with-flakes.html
{
  description = "NixOS docker image";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-24.11";
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
        pkgs = nixpkgs.legacyPackages.${system};
        unstable = nixpkgs-unstable.legacyPackages.${system};
        default_pkg = pkgs.callPackage ./default.nix {
          inherit pkgs;
          nodejs = pkgs.nodejs_22;
        };
        manifest = pkgs.lib.importJSON ./manifest.json;
        version = manifest.version;

      in
      rec {
        # Development environment: nix develop
        devShells.default = pkgs.mkShell {
          name = manifest.name;
          nativeBuildInputs = with pkgs; [
            deno
            nodejs_22
            gh
            git-cliff
            just
            unstable.cargo-watch
            unstable.nushell
            unstable.skopeo
            # default_pkg.nativeBuildInputs
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

        packages.docker = pkgs.dockerTools.streamLayeredImage {
          # Documentation: https://ryantm.github.io/nixpkgs/builders/images/dockertools/
          name = "${manifest.registry.name}/${manifest.name}";
          tag = version;
          # created = "now";
          # author = "not yet supported";
          # maxLayers = 125;
          contents = with pkgs; [
            dockerTools.usrBinEnv
            dockerTools.binSh
            dockerTools.caCertificates
            # dockerTools.fakeNss
            # busybox
            # nix
            # coreutils
            # gnutar
            # gzip
            # gnugrep
            # which
            # curl
            # less
            # findutils
            default_pkg
          ];
          enableFakechroot = true;
          fakeRootCommands = ''
            set -exuo pipefail
            mkdir -p /run/app
            chown 65534:65534 /run/app
            # mkdir /tmp
            # chmod 1777 /tmp
          '';
          config = {
            # Valid values, see: https://github.com/moby/docker-image-spec
            # and https://oci-playground.github.io/specs-latest/
            ExposedPorts = {
              "3000/tcp" = { };
            };
            Entrypoint = [
              "${pkgs.tini}/bin/tini"
              "--"
            ];
            Cmd = [ "${default_pkg}/bin/serve" ];
            Env = [ "DENO_DIR=/run/app" ];
            WorkingDir = "/run/verification-service";
            # User 'nobody' and group 'nogroup'
            User = "65534";
            Group = "65534";
            Labels = {
              # Well-known annotations: https://github.com/opencontainers/image-spec/blob/main/annotations.md
              "org.opencontainers.image.ref.name" =
                "${manifest.registry.name}/${manifest.name}:${manifest.version}";
              "org.opencontainers.image.licenses" = manifest.license;
              "org.opencontainers.image.description" = manifest.description;
              "org.opencontainers.image.documentation" = manifest.registry.url;
              "org.opencontainers.image.version" = manifest.version;
              "org.opencontainers.image.vendor" = manifest.author;
              "org.opencontainers.image.authors" = builtins.elemAt manifest.contributors 0;
              "org.opencontainers.image.url" = manifest.homepage;
              "org.opencontainers.image.source" = manifest.repository.url;
              "org.opencontainers.image.revision" = manifest.version;
              # "org.opencontainers.image.base.name" =
              #   "${manifest.registry.name}/${manifest.name}/${manifest.version}";
            };
          };
        };

        # The default package when a specific package name isn't specified: nix build
        packages.default = packages.docker;
      }
    );
}
