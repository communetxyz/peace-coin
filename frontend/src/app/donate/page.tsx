'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract, useWatchContractEvent } from 'wagmi';
import { usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';

interface DonationEvent {
  id: string;
  donor: string;
  ethAmount: bigint;
  peaceAmount: bigint;
  timestamp: number;
  txHash?: string;
}

function DonationReceiptCard({ donation }: { donation: DonationEvent }) {
  return (
    <Card className="border-green-100">
      <CardContent className="pt-6 space-y-3">
        <div className="flex justify-between items-center">
          <Badge className="bg-green-100 text-green-800">Donation Receipt</Badge>
          <span className="text-xs text-green-600">
            {new Date(donation.timestamp).toLocaleString()}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-green-700">ETH Donated:</span>
            <span className="font-medium">{formatEther(donation.ethAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-green-700">$PEACE Received:</span>
            <span className="font-medium">{formatEther(donation.peaceAmount)}</span>
          </div>
          {donation.txHash && (
            <div className="flex justify-between">
              <span className="text-sm text-green-700">Transaction:</span>
              <span className="font-mono text-xs">
                {donation.txHash.slice(0, 10)}...
              </span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-green-100 text-center">
          <p className="text-sm text-green-600">
            🕊️ Thank you for supporting peace initiatives!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DonationHistory() {
  const { address } = useAccount();
  const [donations, setDonations] = useState<DonationEvent[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const publicClient = usePublicClient();

  // Watch for new donation events
  useWatchContractEvent({
    ...CONTRACTS.PeaceTreasury,
    eventName: 'Donated',
    onLogs: (logs) => {
      const newDonations = logs.map((log: any) => ({
        id: `${log.blockHash}-${log.logIndex}`,
        donor: log.args?.donor as string,
        ethAmount: log.args?.ethAmount as bigint,
        peaceAmount: log.args?.peaceAmount as bigint,
        timestamp: Date.now(),
        txHash: log.transactionHash,
      })).filter(d => d.donor?.toLowerCase() === address?.toLowerCase());
      
      setDonations(prev => [...newDonations, ...prev]);
    },
  });

  // Load historical donation events from blockchain
  useEffect(() => {
    async function loadHistoricalDonations() {
      if (!address || !publicClient) return;
      
      setIsLoadingHistory(true);
      try {
        // Get logs from contract deployment (using reasonable fromBlock to avoid huge queries)
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > BigInt(1000) ? currentBlock - BigInt(1000) : BigInt(0); // Last ~1000 blocks
        
        const logs = await publicClient.getLogs({
          address: CONTRACTS.PeaceTreasury.address,
          event: {
            type: 'event',
            name: 'Donated',
            inputs: [
              { name: 'donor', type: 'address', indexed: true },
              { name: 'ethAmount', type: 'uint256', indexed: false },
              { name: 'peaceAmount', type: 'uint256', indexed: false }
            ]
          },
          args: {
            donor: address,
          },
          fromBlock,
          toBlock: 'latest'
        });

        const historicalDonations = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({ blockHash: log.blockHash! });
            return {
              id: `${log.blockHash}-${log.logIndex}`,
              donor: log.args.donor as string,
              ethAmount: log.args.ethAmount as bigint,
              peaceAmount: log.args.peaceAmount as bigint,
              timestamp: Number(block.timestamp) * 1000,
              txHash: log.transactionHash,
            };
          })
        );

        setDonations(historicalDonations.reverse()); // Most recent first
      } catch (error) {
        console.error('Failed to load historical donations:', error);
        setDonations([]); // Fallback to empty array
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadHistoricalDonations();
  }, [address, publicClient]);

  if (!address) {
    return (
      <Card className="border-amber-100 bg-amber-50/50">
        <CardContent className="pt-6 text-center text-amber-700">
          Connect your wallet to view donation history
        </CardContent>
      </Card>
    );
  }

  if (isLoadingHistory) {
    return (
      <Card className="border-green-100">
        <CardContent className="pt-6 text-center text-green-600">
          Loading donation history... ⌛
        </CardContent>
      </Card>
    );
  }

  if (donations.length === 0) {
    return (
      <Card className="border-green-100">
        <CardContent className="pt-6 text-center text-green-600">
          No donations yet. Make your first contribution to peace! 🕊️
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-green-900">
        Your Contributions ({donations.length})
      </h3>
      <div className="space-y-3">
        {donations.map((donation) => (
          <DonationReceiptCard key={donation.id} donation={donation} />
        ))}
      </div>
    </div>
  );
}

function ImpactSummary() {
  const { address } = useAccount();
  const { data: userBalance } = useReadContract({
    ...CONTRACTS.PeaceCoin,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });
  
  const { data: totalSupply } = useReadContract({
    ...CONTRACTS.PeaceCoin,
    functionName: 'totalSupply',
  });

  const balance = userBalance ? formatEther(userBalance as bigint) : '0';
  const supply = totalSupply ? formatEther(totalSupply as bigint) : '1';
  const sharePercentage = ((parseFloat(balance) / parseFloat(supply)) * 100).toFixed(3);

  return (
    <Card className="border-green-100">
      <CardHeader>
        <CardTitle className="text-lg">Your Peace Impact</CardTitle>
        <CardDescription>Your contribution to the global peace movement</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-900">
              {parseFloat(balance).toLocaleString()}
            </p>
            <p className="text-sm text-green-600">$PEACE Tokens</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-900">{sharePercentage}%</p>
            <p className="text-sm text-green-600">Of Total Supply</p>
          </div>
        </div>
        
        <div className="pt-4 border-t border-green-100">
          <h4 className="font-medium text-green-900 mb-2">Governance Rights</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Vote on peace initiative proposals</li>
            <li>• Participate in treasury decisions</li>
            <li>• Shape the future of peace funding</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DonatePage() {
  const [amount, setAmount] = useState('');
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { address } = useAccount();

  const [activeTab, setActiveTab] = useState('donate');

  // Preset donation amounts
  const presetAmounts = ['0.01', '0.05', '0.1', '0.5'];

  const handleDonate = () => {
    if (!amount) return;
    writeContract({
      ...CONTRACTS.PeaceTreasury,
      functionName: 'donate',
      value: parseEther(amount),
    });
  };

  const peaceReceived = amount ? (parseFloat(amount) * 1000).toLocaleString() : '0';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-900">💚 Donate to Peace</h1>
        <p className="text-green-700 max-w-2xl mx-auto">
          Fund global peace initiatives and receive $PEACE governance tokens. 
          Every contribution helps build a more peaceful world.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="donate">Donate</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="donate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle>Contribute ETH</CardTitle>
                <CardDescription>
                  Donate ETH to the Peace Treasury and receive 1,000 $PEACE tokens per ETH.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-green-700 mb-2 block">Select Amount</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {presetAmounts.map((preset) => (
                      <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        onClick={() => setAmount(preset)}
                        className={amount === preset ? 'border-green-500 bg-green-50' : ''}
                      >
                        {preset} ETH
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-green-700 mb-1 block">Custom Amount (ETH)</label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                {amount && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700 mb-1">You will receive:</p>
                    <p className="text-lg font-bold text-green-900">
                      {peaceReceived} $PEACE tokens
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Plus voting rights in governance
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleDonate}
                  disabled={isPending || isConfirming || !amount || !address}
                  className="w-full bg-green-700 hover:bg-green-800"
                >
                  {!address ? 'Connect Wallet First' :
                   isPending ? 'Confirming...' : 
                   isConfirming ? 'Processing...' : 
                   'Donate for Peace'}
                </Button>
                
                {error && (
                  <p className="text-red-600 text-sm">Error: {error.message}</p>
                )}
                {isSuccess && (
                  <div className="text-center space-y-2">
                    <p className="text-green-600 font-medium">
                      ✅ Donation successful!
                    </p>
                    <p className="text-sm text-green-600">
                      Thank you for supporting peace initiatives! 🕊️
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <ImpactSummary />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <DonationHistory />
        </TabsContent>

        <TabsContent value="impact">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ImpactSummary />
            
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle className="text-lg">Community Impact</CardTitle>
                <CardDescription>How your donations help</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-green-700">Fund peace education programs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-green-700">Support conflict mediation services</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-green-700">Build community reconciliation centers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-green-700">Provide emergency aid in conflict zones</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-green-100 text-center">
                  <p className="text-sm text-green-600">
                    Every contribution, no matter the size, makes a difference in building lasting peace.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
