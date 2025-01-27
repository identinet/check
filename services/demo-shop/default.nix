# Build with NIXPKGS_ALLOW_UNFREE=1 nix-build -E 'with import <nixpkgs> {}; callPackage ./default.nix {}'
{
  pkgs ? import <nixpkgs> { },
  nodejs ? pkgs.nodejs_22,
}:
let
  gitignoreSrc = pkgs.fetchFromGitHub {
    # Documentation: https://github.com/hercules-ci/gitignore.nix
    owner = "hercules-ci";
    repo = "gitignore.nix";
    rev = "637db329424fd7e46cf4185293b9cc8c88c95394";
    # use what nix suggests in the mismatch message here:
    sha256 = "sha256-HG2cCnktfHsKV0s4XW83gU3F57gaTljL9KNSuG6bnQs=";
  };
  inherit (import gitignoreSrc { inherit (pkgs) lib; }) gitignoreSource;
  pkgs_with_overlay = import pkgs.path {
    inherit (pkgs) system;
    overlays = pkgs.overlays ++ [
      (import (
        (builtins.fetchGit {
          # url = "https://github.com/nekowinston/nix-deno.git";
          url = "https://github.com/identinet/nix-deno.git";
          # ref = "main";
          rev = "890e958e0d7ab974c1557a0107e2f191ab5c7b52";
        })
        + "/nix"
      ))
    ];
  };
  manifest = pkgs.lib.importJSON ./manifest.json;
in
pkgs_with_overlay.denoPlatform.mkDenoDerivation {
  pname = manifest.name;
  version = manifest.version;
  src = gitignoreSource ./.;
  nativeBuildInputs = [
    nodejs
  ];
  buildPhase = ''
    # FIXME: apparently deno install doesn't fill the node_modules/.bin directory, so subsequent commands fail
    # See https://github.com/nekowinston/nix-deno/pull/19
    mkdir -p node_modules/.bin
    ln -s ../vinxi/bin/cli.mjs node_modules/.bin/vinxi
    deno install --frozen --lock
    deno task build
  '';
  installPhase = ''
    mkdir -p $out/bin
    cp -r .output/* $out
    cat > $out/bin/serve << EOF
    #!/bin/sh
    cd $out
    exec ${pkgs.deno}/bin/deno run --allow-read=./ -E -N server/index.mjs
    EOF
    chmod +x $out/bin/serve
  '';
  meta = with pkgs.lib; {
    description = manifest.description;
    homepage = manifest.homepage;
    license = with licenses; [ apsl20 ];
    maintainers = with maintainers; [ jceb ];
  };
}
