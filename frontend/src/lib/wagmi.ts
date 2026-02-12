import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Peace Coin',
  projectId: 'peace-coin-demo', // WalletConnect project ID placeholder
  chains: [sepolia],
  ssr: true,
});
