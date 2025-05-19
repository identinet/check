# Build with NIXPKGS_ALLOW_UNFREE=1 nix-build -E 'with import <nixpkgs> {}; callPackage ./default.nix {}'
{
  pkgs ? import <nixpkgs> { },
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
  manifest = (pkgs.lib.importTOML ./Cargo.toml).package;
in
pkgs.rustPlatform.buildRustPackage {
  pname = manifest.name;
  version = manifest.version;
  cargoLock.lockFile = ./Cargo.lock;
  cargoLock.outputHashes = {
    # INFO: sometimes the hash is missing for some packages, not sure why.
    # Enable the fake hash to get the value that's required here
    # "did-ethr-0.3.1" = pkgs.lib.fakeSha256;
    "did-ethr-0.3.1" = "sha256-a0xbvelrc6Rv+8hyDOuzT6deInTwhU6JGM3dpJLjOGw=";
    # "openid4vp-0.1.0" = pkgs.lib.fakeSha256;
    "openid4vp-0.1.0" = "sha256-Fv+1QP/vTGqoUzpSDIo1H8XvzU3g5GE8KCY38lyJjpY=";
  };
  src = pkgs.lib.sources.cleanSourceWith {
    src = gitignoreSource ./.;
    filter = path: type: !(baseNameOf path == "target");
  };
  buildInputs = with pkgs; [
    openssl
  ];
  nativeBuildInputs = with pkgs; [
    cargo
    clippy
    pkg-config
    openssl.dev
    rust-analyzer
    rustc
    rustfmt
  ];
  meta = with pkgs.lib; {
    description = manifest.description;
    homepage = manifest.homepage;
    license = with licenses; [ apsl20 ];
    maintainers = with maintainers; [ jceb ];
  };
}
