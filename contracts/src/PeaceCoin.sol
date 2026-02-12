// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title PeaceCoin — ERC20 governance token for peace-building initiatives
contract PeaceCoin is ERC20, ERC20Permit, ERC20Votes, Ownable {
    address public treasury;

    error OnlyTreasury();

    modifier onlyTreasury() {
        if (msg.sender != treasury) revert OnlyTreasury();
        _;
    }

    constructor(address _owner)
        ERC20("Peace Coin", "PEACE")
        ERC20Permit("Peace Coin")
        Ownable(_owner)
    {}

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function mint(address to, uint256 amount) external onlyTreasury {
        _mint(to, amount);
    }

    // Required overrides
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
