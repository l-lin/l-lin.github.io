{
  description = "A nix flake with Hugo";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/93fbfcd45e966ea1cff043d48bd45d1285082770";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [ pkgs.hugo ];
        };
      });
}
