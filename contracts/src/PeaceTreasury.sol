// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./PeaceCoin.sol";
import "./PeaceInitiativeNFT.sol";

/// @title PeaceTreasury — community treasury with proposal & voting system
contract PeaceTreasury is Ownable {
    using Math for uint256;

    PeaceCoin public peace;
    PeaceInitiativeNFT public nft;

    uint256 public proposalCount;
    uint256 public votingPeriod = 3 days;
    uint256 public quorumBps = 1000; // 10%
    bool public quadraticVoting = true;

    uint256 public constant MINT_PER_ETH = 1000e18; // 1000 PEACE per ETH donated

    enum ProposalState { Active, Passed, Rejected, Funded, Completed }

    struct Milestone {
        string description;
        uint256 amount;
        bool released;
    }

    struct Proposal {
        uint256 id;
        address proposer;
        address recipient;
        string description;
        string location;
        uint256 totalAmount;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        ProposalState state;
        uint256 nftTokenId;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => Milestone[]) public milestones;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event Donated(address indexed donor, uint256 ethAmount, uint256 peaceAmount);
    event ProposalCreated(uint256 indexed id, address proposer, uint256 amount);
    event Voted(uint256 indexed proposalId, address voter, bool support, uint256 weight);
    event ProposalFinalized(uint256 indexed id, ProposalState state);
    event MilestoneReleased(uint256 indexed proposalId, uint256 milestoneIndex, uint256 amount);

    error ProposalNotActive();
    error AlreadyVoted();
    error VotingNotEnded();
    error VotingEnded();
    error InvalidState();
    error NoMilestones();
    error MilestoneAlreadyReleased();
    error TransferFailed();

    constructor(address _owner, address _peace, address _nft)
        Ownable(_owner)
    {
        peace = PeaceCoin(_peace);
        nft = PeaceInitiativeNFT(_nft);
    }

    /// @notice Donate ETH to treasury, receive PEACE tokens
    function donate() external payable {
        uint256 peaceAmount = msg.value * MINT_PER_ETH / 1 ether;
        if (peaceAmount > 0) {
            peace.mint(msg.sender, peaceAmount);
        }
        emit Donated(msg.sender, msg.value, peaceAmount);
    }

    receive() external payable {
        uint256 peaceAmount = msg.value * MINT_PER_ETH / 1 ether;
        if (peaceAmount > 0) {
            peace.mint(msg.sender, peaceAmount);
        }
        emit Donated(msg.sender, msg.value, peaceAmount);
    }

    /// @notice Create a peace initiative proposal with milestones
    function propose(
        address recipient,
        string calldata description,
        string calldata location,
        uint256 totalAmount,
        string[] calldata milestoneDescs,
        uint256[] calldata milestoneAmounts
    ) external returns (uint256) {
        if (milestoneDescs.length == 0) revert NoMilestones();
        require(milestoneDescs.length == milestoneAmounts.length, "length mismatch");

        uint256 sumAmounts;
        for (uint256 i; i < milestoneAmounts.length; i++) {
            sumAmounts += milestoneAmounts[i];
        }
        require(sumAmounts == totalAmount, "amounts mismatch");

        uint256 id = proposalCount++;
        proposals[id] = Proposal({
            id: id,
            proposer: msg.sender,
            recipient: recipient,
            description: description,
            location: location,
            totalAmount: totalAmount,
            votesFor: 0,
            votesAgainst: 0,
            deadline: block.timestamp + votingPeriod,
            state: ProposalState.Active,
            nftTokenId: 0
        });

        for (uint256 i; i < milestoneDescs.length; i++) {
            milestones[id].push(Milestone({
                description: milestoneDescs[i],
                amount: milestoneAmounts[i],
                released: false
            }));
        }

        emit ProposalCreated(id, msg.sender, totalAmount);
        return id;
    }

    /// @notice Vote on an active proposal
    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        if (p.state != ProposalState.Active) revert ProposalNotActive();
        if (block.timestamp >= p.deadline) revert VotingEnded();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        uint256 voterBalance = peace.balanceOf(msg.sender);
        require(voterBalance > 0, "no PEACE tokens");

        uint256 weight = quadraticVoting ? Math.sqrt(voterBalance) : voterBalance;
        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);
    }

    /// @notice Finalize a proposal after voting ends
    function finalize(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        if (p.state != ProposalState.Active) revert InvalidState();
        if (block.timestamp < p.deadline) revert VotingNotEnded();

        uint256 totalSupply = peace.totalSupply();
        uint256 quorum = quadraticVoting
            ? Math.sqrt(totalSupply) * quorumBps / 10000
            : totalSupply * quorumBps / 10000;
        uint256 totalVotes = p.votesFor + p.votesAgainst;

        if (totalVotes >= quorum && p.votesFor > p.votesAgainst) {
            p.state = ProposalState.Funded;
            uint256 tokenId = nft.mint(
                p.recipient,
                p.description,
                p.location,
                p.totalAmount,
                proposalId
            );
            p.nftTokenId = tokenId;
            emit ProposalFinalized(proposalId, ProposalState.Funded);
        } else {
            p.state = ProposalState.Rejected;
            emit ProposalFinalized(proposalId, ProposalState.Rejected);
        }
    }

    /// @notice Release a milestone payment
    function releaseMilestone(uint256 proposalId, uint256 milestoneIndex) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        if (p.state != ProposalState.Funded && p.state != ProposalState.Completed) revert InvalidState();

        Milestone storage m = milestones[proposalId][milestoneIndex];
        if (m.released) revert MilestoneAlreadyReleased();

        m.released = true;
        (bool ok,) = p.recipient.call{value: m.amount}("");
        if (!ok) revert TransferFailed();

        // Check if all milestones released
        bool allReleased = true;
        for (uint256 i; i < milestones[proposalId].length; i++) {
            if (!milestones[proposalId][i].released) {
                allReleased = false;
                break;
            }
        }
        if (allReleased) {
            p.state = ProposalState.Completed;
            nft.updateStatus(p.nftTokenId, "Completed");
        }

        emit MilestoneReleased(proposalId, milestoneIndex, m.amount);
    }

    /// @notice Get proposal state
    function getProposalState(uint256 proposalId) external view returns (ProposalState) {
        return proposals[proposalId].state;
    }

    /// @notice Set voting period
    function setVotingPeriod(uint256 _period) external onlyOwner {
        votingPeriod = _period;
    }

    /// @notice Toggle quadratic voting
    function setQuadraticVoting(bool _enabled) external onlyOwner {
        quadraticVoting = _enabled;
    }

    /// @notice Get milestone count for a proposal
    function getMilestoneCount(uint256 proposalId) external view returns (uint256) {
        return milestones[proposalId].length;
    }

    /// @notice Get treasury ETH balance
    function treasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
