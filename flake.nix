{
  description = "Flake to install tools needed for development.";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/097339b6a0f839036f77770a0781f2b88a541755";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }: flake-utils.lib.eachDefaultSystem (system:
    let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.default = pkgs.mkShell {
        packages = with pkgs; [ just nodejs ];
      };
    }
  );
}
