import PeaceCoinABI from './abi/PeaceCoin.json';
import PeaceTreasuryABI from './abi/PeaceTreasury.json';
import PeaceBondABI from './abi/PeaceBond.json';
import PeaceInitiativeNFTABI from './abi/PeaceInitiativeNFT.json';

export const CONTRACTS = {
  PeaceCoin: {
    address: '0x5E0f5b63Bade49Ab2A54C676b0cceFE3d8e71e5b' as `0x${string}`,
    abi: PeaceCoinABI,
  },
  PeaceTreasury: {
    address: '0xCe1B6a0AcE36eFC29cBCd0508100Dc8626a5C066' as `0x${string}`,
    abi: PeaceTreasuryABI,
  },
  PeaceBond: {
    address: '0xd47e95bbA9cC0f059B51F205BE3fe3FB191eeD84' as `0x${string}`,
    abi: PeaceBondABI,
  },
  PeaceInitiativeNFT: {
    address: '0x97f0e2e7150Af4879051891c832f3621b5EE2747' as `0x${string}`,
    abi: PeaceInitiativeNFTABI,
  },
} as const;

export const PROPOSAL_STATES = ['Active', 'Passed', 'Rejected', 'Funded', 'Completed'] as const;
export const DISPUTE_STATES = ['Open', 'Mediation', 'ResolvedA', 'ResolvedB', 'Settled', 'Cancelled'] as const;
