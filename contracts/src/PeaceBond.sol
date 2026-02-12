// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PeaceCoin.sol";

/// @title PeaceBond — stake PEACE for conflict resolution & mediation
contract PeaceBond is Ownable {
    PeaceCoin public peace;

    uint256 public minStake = 100e18;
    uint256 public mediatorMinStake = 500e18;
    uint256 public disputeCount;

    struct Mediator {
        bool registered;
        uint256 staked;
        uint256 resolved;
        uint256 reputation; // 0-100
    }

    enum DisputeState { Open, Mediation, ResolvedA, ResolvedB, Settled, Cancelled }

    struct Dispute {
        uint256 id;
        address partyA;
        address partyB;
        address mediator;
        uint256 stakeA;
        uint256 stakeB;
        string description;
        DisputeState state;
    }

    mapping(address => Mediator) public mediators;
    mapping(uint256 => Dispute) public disputes;

    event MediatorRegistered(address indexed mediator, uint256 staked);
    event MediatorUnregistered(address indexed mediator);
    event DisputeCreated(uint256 indexed id, address partyA, address partyB);
    event DisputeJoined(uint256 indexed id, address partyB);
    event MediatorAssigned(uint256 indexed id, address mediator);
    event DisputeResolved(uint256 indexed id, DisputeState outcome);

    error InsufficientStake();
    error NotMediator();
    error InvalidState();
    error NotParty();
    error AlreadyRegistered();

    constructor(address _owner, address _peace) Ownable(_owner) {
        peace = PeaceCoin(_peace);
    }

    /// @notice Register as a mediator by staking PEACE
    function registerMediator(uint256 amount) external {
        if (mediators[msg.sender].registered) revert AlreadyRegistered();
        if (amount < mediatorMinStake) revert InsufficientStake();

        peace.transferFrom(msg.sender, address(this), amount);
        mediators[msg.sender] = Mediator({
            registered: true,
            staked: amount,
            resolved: 0,
            reputation: 50
        });

        emit MediatorRegistered(msg.sender, amount);
    }

    /// @notice Unregister mediator and return stake
    function unregisterMediator() external {
        Mediator storage m = mediators[msg.sender];
        if (!m.registered) revert NotMediator();

        uint256 staked = m.staked;
        delete mediators[msg.sender];
        peace.transfer(msg.sender, staked);

        emit MediatorUnregistered(msg.sender);
    }

    /// @notice Create a dispute, staking PEACE
    function createDispute(address partyB, string calldata description, uint256 stakeAmount) external returns (uint256) {
        if (stakeAmount < minStake) revert InsufficientStake();

        peace.transferFrom(msg.sender, address(this), stakeAmount);

        uint256 id = disputeCount++;
        disputes[id] = Dispute({
            id: id,
            partyA: msg.sender,
            partyB: partyB,
            mediator: address(0),
            stakeA: stakeAmount,
            stakeB: 0,
            description: description,
            state: DisputeState.Open
        });

        emit DisputeCreated(id, msg.sender, partyB);
        return id;
    }

    /// @notice Party B joins the dispute by staking
    function joinDispute(uint256 disputeId, uint256 stakeAmount) external {
        Dispute storage d = disputes[disputeId];
        if (d.state != DisputeState.Open) revert InvalidState();
        if (msg.sender != d.partyB) revert NotParty();
        if (stakeAmount < minStake) revert InsufficientStake();

        peace.transferFrom(msg.sender, address(this), stakeAmount);
        d.stakeB = stakeAmount;

        emit DisputeJoined(disputeId, msg.sender);
    }

    /// @notice Assign a mediator to a dispute
    function assignMediator(uint256 disputeId) external {
        Dispute storage d = disputes[disputeId];
        if (d.state != DisputeState.Open) revert InvalidState();
        if (!mediators[msg.sender].registered) revert NotMediator();
        require(d.stakeB > 0, "partyB hasn't joined");

        d.mediator = msg.sender;
        d.state = DisputeState.Mediation;

        emit MediatorAssigned(disputeId, msg.sender);
    }

    /// @notice Mediator resolves dispute — favor party A or B
    function resolve(uint256 disputeId, bool favorA) external {
        Dispute storage d = disputes[disputeId];
        if (d.state != DisputeState.Mediation) revert InvalidState();
        if (msg.sender != d.mediator) revert NotMediator();

        if (favorA) {
            d.state = DisputeState.ResolvedA;
            // Return A's stake + half of B's
            peace.transfer(d.partyA, d.stakeA + d.stakeB / 2);
            // Mediator gets remainder
            peace.transfer(d.mediator, d.stakeB - d.stakeB / 2);
        } else {
            d.state = DisputeState.ResolvedB;
            peace.transfer(d.partyB, d.stakeB + d.stakeA / 2);
            peace.transfer(d.mediator, d.stakeA - d.stakeA / 2);
        }

        Mediator storage m = mediators[msg.sender];
        m.resolved++;
        if (m.reputation < 100) m.reputation += 1;

        emit DisputeResolved(disputeId, d.state);
    }

    /// @notice Parties can settle before mediation completes
    function settle(uint256 disputeId) external {
        Dispute storage d = disputes[disputeId];
        if (d.state != DisputeState.Open && d.state != DisputeState.Mediation) revert InvalidState();
        if (msg.sender != d.partyA && msg.sender != d.partyB) revert NotParty();

        d.state = DisputeState.Settled;
        peace.transfer(d.partyA, d.stakeA);
        if (d.stakeB > 0) {
            peace.transfer(d.partyB, d.stakeB);
        }

        emit DisputeResolved(disputeId, DisputeState.Settled);
    }

    /// @notice Cancel open dispute (only partyA, before partyB joins)
    function cancelDispute(uint256 disputeId) external {
        Dispute storage d = disputes[disputeId];
        if (d.state != DisputeState.Open) revert InvalidState();
        if (msg.sender != d.partyA) revert NotParty();
        if (d.stakeB > 0) revert InvalidState(); // can't cancel after B joined

        d.state = DisputeState.Cancelled;
        peace.transfer(d.partyA, d.stakeA);

        emit DisputeResolved(disputeId, DisputeState.Cancelled);
    }

    function setMinStake(uint256 _min) external onlyOwner {
        minStake = _min;
    }

    function setMediatorMinStake(uint256 _min) external onlyOwner {
        mediatorMinStake = _min;
    }
}
