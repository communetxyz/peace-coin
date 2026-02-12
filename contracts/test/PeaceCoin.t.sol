// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PeaceCoin.sol";
import "../src/PeaceTreasury.sol";
import "../src/PeaceInitiativeNFT.sol";
import "../src/PeaceBond.sol";

contract PeaceCoinTest is Test {
    PeaceCoin peace;
    PeaceTreasury treasury;
    PeaceInitiativeNFT nft;
    PeaceBond bond;

    address owner = address(1);
    address alice = address(2);
    address bob = address(3);
    address charlie = address(4);
    address recipient = address(5);

    function setUp() public {
        vm.startPrank(owner);
        peace = new PeaceCoin(owner);
        nft = new PeaceInitiativeNFT(owner);
        treasury = new PeaceTreasury(owner, address(peace), address(nft));
        bond = new PeaceBond(owner, address(peace));

        peace.setTreasury(address(treasury));
        nft.setTreasury(address(treasury));
        vm.stopPrank();

        // Fund alice and bob via donation
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(charlie, 10 ether);

        vm.prank(alice);
        treasury.donate{value: 5 ether}();

        vm.prank(bob);
        treasury.donate{value: 3 ether}();
    }

    function test_donation_mints_peace() public view {
        assertEq(peace.balanceOf(alice), 5000e18);
        assertEq(peace.balanceOf(bob), 3000e18);
    }

    function test_treasury_balance() public view {
        assertEq(address(treasury).balance, 8 ether);
    }

    function test_only_treasury_can_mint() public {
        vm.prank(alice);
        vm.expectRevert(PeaceCoin.OnlyTreasury.selector);
        peace.mint(alice, 1000e18);
    }

    function test_propose_and_vote_and_finalize() public {
        // Create proposal
        string[] memory mDescs = new string[](2);
        mDescs[0] = "Phase 1";
        mDescs[1] = "Phase 2";
        uint256[] memory mAmounts = new uint256[](2);
        mAmounts[0] = 1 ether;
        mAmounts[1] = 1 ether;

        vm.prank(alice);
        uint256 pid = treasury.propose(recipient, "Build school", "Uganda", 2 ether, mDescs, mAmounts);
        assertEq(pid, 0);

        // Vote
        vm.prank(alice);
        treasury.vote(pid, true);

        vm.prank(bob);
        treasury.vote(pid, true);

        // Warp past voting period
        vm.warp(block.timestamp + 3 days + 1);

        // Finalize
        treasury.finalize(pid);

        PeaceTreasury.ProposalState state = treasury.getProposalState(pid);
        assertEq(uint256(state), uint256(PeaceTreasury.ProposalState.Funded));

        // NFT minted
        assertEq(nft.balanceOf(recipient), 1);
    }

    function test_milestone_release() public {
        string[] memory mDescs = new string[](1);
        mDescs[0] = "Full delivery";
        uint256[] memory mAmounts = new uint256[](1);
        mAmounts[0] = 1 ether;

        vm.prank(alice);
        uint256 pid = treasury.propose(recipient, "Water well", "Somalia", 1 ether, mDescs, mAmounts);

        vm.prank(alice);
        treasury.vote(pid, true);
        vm.prank(bob);
        treasury.vote(pid, true);

        vm.warp(block.timestamp + 3 days + 1);
        treasury.finalize(pid);

        uint256 recipientBefore = recipient.balance;
        vm.prank(owner);
        treasury.releaseMilestone(pid, 0);
        assertEq(recipient.balance - recipientBefore, 1 ether);
    }

    function test_proposal_rejected() public {
        string[] memory mDescs = new string[](1);
        mDescs[0] = "Phase 1";
        uint256[] memory mAmounts = new uint256[](1);
        mAmounts[0] = 1 ether;

        vm.prank(alice);
        uint256 pid = treasury.propose(recipient, "Bad idea", "Nowhere", 1 ether, mDescs, mAmounts);

        vm.prank(alice);
        treasury.vote(pid, false);
        vm.prank(bob);
        treasury.vote(pid, false);

        vm.warp(block.timestamp + 3 days + 1);
        treasury.finalize(pid);

        PeaceTreasury.ProposalState state = treasury.getProposalState(pid);
        assertEq(uint256(state), uint256(PeaceTreasury.ProposalState.Rejected));
    }

    function test_double_vote_reverts() public {
        string[] memory mDescs = new string[](1);
        mDescs[0] = "Phase 1";
        uint256[] memory mAmounts = new uint256[](1);
        mAmounts[0] = 1 ether;

        vm.prank(alice);
        uint256 pid = treasury.propose(recipient, "Test", "Here", 1 ether, mDescs, mAmounts);

        vm.prank(alice);
        treasury.vote(pid, true);

        vm.prank(alice);
        vm.expectRevert(PeaceTreasury.AlreadyVoted.selector);
        treasury.vote(pid, true);
    }

    function test_peace_bond_mediation() public {
        // Give charlie tokens too
        vm.prank(charlie);
        treasury.donate{value: 2 ether}();

        // Register charlie as mediator
        vm.startPrank(charlie);
        peace.approve(address(bond), 500e18);
        bond.registerMediator(500e18);
        vm.stopPrank();

        // Alice creates dispute with Bob
        vm.startPrank(alice);
        peace.approve(address(bond), 100e18);
        uint256 did = bond.createDispute(bob, "Land dispute", 100e18);
        vm.stopPrank();

        // Bob joins
        vm.startPrank(bob);
        peace.approve(address(bond), 100e18);
        bond.joinDispute(did, 100e18);
        vm.stopPrank();

        // Charlie mediates
        vm.prank(charlie);
        bond.assignMediator(did);

        // Resolve in favor of Alice
        uint256 aliceBefore = peace.balanceOf(alice);
        vm.prank(charlie);
        bond.resolve(did, true);

        // Alice gets her 100 + 50 from Bob's stake
        assertEq(peace.balanceOf(alice) - aliceBefore, 150e18);
    }

    function test_settle_dispute() public {
        vm.startPrank(alice);
        peace.approve(address(bond), 100e18);
        uint256 did = bond.createDispute(bob, "Minor issue", 100e18);
        vm.stopPrank();

        uint256 aliceBefore = peace.balanceOf(alice);
        vm.prank(alice);
        bond.settle(did);

        assertEq(peace.balanceOf(alice) - aliceBefore, 100e18);
    }

    function test_nft_token_uri() public {
        string[] memory mDescs = new string[](1);
        mDescs[0] = "Full delivery";
        uint256[] memory mAmounts = new uint256[](1);
        mAmounts[0] = 1 ether;

        vm.prank(alice);
        treasury.propose(recipient, "School", "Kenya", 1 ether, mDescs, mAmounts);

        vm.prank(alice);
        treasury.vote(0, true);
        vm.prank(bob);
        treasury.vote(0, true);

        vm.warp(block.timestamp + 3 days + 1);
        treasury.finalize(0);

        string memory uri = nft.tokenURI(0);
        assertTrue(bytes(uri).length > 0);
    }

    function test_receive_ether_donates() public {
        vm.prank(charlie);
        (bool ok,) = address(treasury).call{value: 1 ether}("");
        assertTrue(ok);
        assertEq(peace.balanceOf(charlie), 1000e18);
    }
}
