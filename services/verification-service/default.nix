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
  # cargoLock.outputHashes = {
  # "did-jwk-0.1.1" = pkgs.lib.fakeSha256;
  # "did-jwk-0.1.1" = "sha256-byxaWQDR35ioADSjWqGX/h8ht4FjXNh+mdtfD0LW8Sk=";
  # };
  src = pkgs.lib.sources.cleanSourceWith {
    src = gitignoreSource ./.;
    filter = path: type: !(baseNameOf path == "target");
  };
  nativeBuildInputs = with pkgs; [
    rustc
    rust-analyzer
    cargo
    clippy
    rustfmt
  ];
  meta = with pkgs.lib; {
    description = manifest.description;
    homepage = manifest.homepage;
    license = with licenses; [ apsl20 ];
    maintainers = with maintainers; [ jceb ];
  };
}
