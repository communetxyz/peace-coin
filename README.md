# 🕊️ Peace Coin

Decentralized peace-building token. $PEACE funds peace initiatives globally through community governance.

## Architecture

- **$PEACE Token** (ERC20 + ERC20Votes) — governance token, minted via donations
- **PeaceTreasury** — proposal system with quadratic voting, milestone-based fund release
- **PeaceBond** — stake $PEACE for on-chain conflict resolution & mediation
- **PeaceInitiativeNFT** (ERC721) — on-chain proof of funded peace initiatives

## Sepolia Deployment

| Contract | Address |
|----------|---------|
| PeaceCoin | `0x5E0f5b63Bade49Ab2A54C676b0cceFE3d8e71e5b` |
| PeaceInitiativeNFT | `0x97f0e2e7150Af4879051891c832f3621b5EE2747` |
| PeaceTreasury | `0xCe1B6a0AcE36eFC29cBCd0508100Dc8626a5C066` |
| PeaceBond | `0xd47e95bbA9cC0f059B51F205BE3fe3FB191eeD84` |

## Development

### Contracts
```bash
cd contracts
forge build
forge test
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## How It Works

1. **Donate** ETH → receive 1,000 $PEACE per ETH
2. **Propose** peace initiatives with milestone-based funding
3. **Vote** with quadratic voting weight (√balance)
4. **Fund** approved proposals, releasing ETH per milestone
5. **Mediate** disputes via Peace Bonds — stake, resolve, earn reputation
