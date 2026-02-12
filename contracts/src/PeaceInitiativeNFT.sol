// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/// @title PeaceInitiativeNFT — on-chain proof of funded peace initiatives
contract PeaceInitiativeNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;
    address public treasury;

    struct Initiative {
        string description;
        string location;
        uint256 fundingAmount;
        string status;
        uint256 proposalId;
    }

    mapping(uint256 => Initiative) public initiatives;

    error OnlyTreasury();

    modifier onlyTreasury() {
        if (msg.sender != treasury) revert OnlyTreasury();
        _;
    }

    constructor(address _owner)
        ERC721("Peace Initiative", "PEACE-NFT")
        Ownable(_owner)
    {}

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function mint(
        address to,
        string calldata description,
        string calldata location,
        uint256 fundingAmount,
        uint256 proposalId
    ) external onlyTreasury returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);
        initiatives[tokenId] = Initiative({
            description: description,
            location: location,
            fundingAmount: fundingAmount,
            status: "Funded",
            proposalId: proposalId
        });
        return tokenId;
    }

    function updateStatus(uint256 tokenId, string calldata status) external onlyTreasury {
        initiatives[tokenId].status = status;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Initiative memory init = initiatives[tokenId];
        string memory json = string(abi.encodePacked(
            '{"name":"Peace Initiative #', tokenId.toString(),
            '","description":"', init.description,
            '","attributes":[{"trait_type":"Location","value":"', init.location,
            '"},{"trait_type":"Funding","value":"', init.fundingAmount.toString(),
            '"},{"trait_type":"Status","value":"', init.status,
            '"},{"trait_type":"Proposal","value":"', init.proposalId.toString(),
            '"}]}'
        ));
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }
}
