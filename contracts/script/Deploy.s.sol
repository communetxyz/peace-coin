// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PeaceCoin.sol";
import "../src/PeaceTreasury.sol";
import "../src/PeaceInitiativeNFT.sol";
import "../src/PeaceBond.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        PeaceCoin peace = new PeaceCoin(deployer);
        PeaceInitiativeNFT nft = new PeaceInitiativeNFT(deployer);
        PeaceTreasury treasury = new PeaceTreasury(deployer, address(peace), address(nft));
        PeaceBond bond = new PeaceBond(deployer, address(peace));

        peace.setTreasury(address(treasury));
        nft.setTreasury(address(treasury));

        vm.stopBroadcast();

        console.log("PeaceCoin:", address(peace));
        console.log("PeaceInitiativeNFT:", address(nft));
        console.log("PeaceTreasury:", address(treasury));
        console.log("PeaceBond:", address(bond));
    }
}
