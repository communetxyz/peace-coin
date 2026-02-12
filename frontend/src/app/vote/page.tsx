'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS, PROPOSAL_STATES } from '@/lib/contracts';

function ProposalCard({ id, showFinalize = false }: { id: number; showFinalize?: boolean }) {
  const { data } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'proposals',
    args: [BigInt(id)],
  });

  const { data: state } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'getProposalState',
    args: [BigInt(id)],
  });

  const { data: totalSupply } = useReadContract({
    ...CONTRACTS.PeaceCoin,
    functionName: 'totalSupply',
  });

  const { data: quadratic } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'quadraticVoting',
  });

  const { data: balance } = useReadContract({
    ...CONTRACTS.PeaceCoin,
    functionName: 'balanceOf',
    args: [useAccount().address as `0x${string}`],
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!data) return null;
  const proposal = data as unknown[];
  const stateNum = Number(state ?? 0);
  const isActive = stateNum === 0;
  
  const votesFor = Number(proposal[7]);
  const votesAgainst = Number(proposal[8]);
  const totalVotes = votesFor + votesAgainst;
  const deadline = Number(proposal[9]) * 1000;
  const isExpired = Date.now() > deadline;
  
  // Calculate quorum
  const supply = totalSupply ? Number(totalSupply) : 0;
  const quorum = quadratic ? Math.sqrt(supply) * 0.1 : supply * 0.1;
  const quorumMet = totalVotes >= quorum;
  
  // Calculate vote percentages
  const forPercentage = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (votesAgainst / totalVotes) * 100 : 0;
  
  // User's voting power
  const userBalance = Number(balance || 0);
  const votingPower = quadratic ? Math.sqrt(userBalance) : userBalance;

  const canFinalize = isActive && isExpired && showFinalize;

  return (
    <Card className="border-green-100">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Proposal #{id}</CardTitle>
            <CardDescription className="mt-1">{String(proposal[1])}</CardDescription>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {PROPOSAL_STATES[stateNum] ?? 'Unknown'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-green-700">{String(proposal[4])}</p>
        <p className="text-sm text-green-600">📍 {String(proposal[5])}</p>
        <p className="text-sm font-medium">Funding: {formatEther(proposal[6] as bigint)} ETH</p>
        
        {isActive && (
          <div className="space-y-3">
            <div className="text-xs text-green-600">
              Deadline: {new Date(deadline).toLocaleString()}
              {isExpired && <span className="text-red-600 ml-2">⚠️ Expired</span>}
            </div>
            
            {/* Voting Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">For ({votesFor})</span>
                <span className="text-red-600">Against ({votesAgainst})</span>
              </div>
              <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500" 
                  style={{ width: `${forPercentage}%` }}
                />
                <div 
                  className="bg-red-500" 
                  style={{ width: `${againstPercentage}%` }}
                />
              </div>
              <div className="text-xs text-green-600">
                Quorum: {totalVotes.toLocaleString()} / {quorum.toLocaleString()} 
                {quorumMet ? ' ✅' : ' ⏳'}
              </div>
            </div>
          </div>
        )}
        
        {/* Voting buttons */}
        {isActive && !isExpired && userBalance > 0 && (
          <div className="space-y-3 pt-3 border-t border-green-100">
            <div className="text-sm text-green-600">
              Your voting power: {votingPower.toLocaleString()} 
              {quadratic ? ' (√ of balance)' : null}
            </div>
            <div className="flex gap-3">
              <Button
                size="sm"
                className="bg-green-700 hover:bg-green-800 flex-1"
                onClick={() => writeContract({ 
                  ...CONTRACTS.PeaceTreasury, 
                  functionName: 'vote', 
                  args: [BigInt(id), true] 
                })}
                disabled={isPending || isConfirming}
              >
                👍 Vote For
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                onClick={() => writeContract({ 
                  ...CONTRACTS.PeaceTreasury, 
                  functionName: 'vote', 
                  args: [BigInt(id), false] 
                })}
                disabled={isPending || isConfirming}
              >
                👎 Vote Against
              </Button>
            </div>
          </div>
        )}

        {/* Finalize button */}
        {canFinalize && (
          <Button
            onClick={() => writeContract({ 
              ...CONTRACTS.PeaceTreasury, 
              functionName: 'finalize', 
              args: [BigInt(id)] 
            })}
            disabled={isPending || isConfirming}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            Finalize Proposal
          </Button>
        )}
        
        {/* Status messages */}
        {error && (
          <p className="text-red-600 text-sm">Error: {error.message}</p>
        )}
        {isSuccess && (
          <p className="text-green-600 text-sm">✅ Transaction successful!</p>
        )}
        
        {isActive && !isExpired && userBalance === 0 && (
          <p className="text-amber-600 text-sm">
            💡 Get $PEACE tokens to participate in governance
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function GovernanceStats() {
  const { data: totalSupply } = useReadContract({
    ...CONTRACTS.PeaceCoin,
    functionName: 'totalSupply',
  });
  const { data: proposalCount } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'proposalCount',
  });
  const { data: balance } = useReadContract({
    ...CONTRACTS.PeaceCoin,
    functionName: 'balanceOf',
    args: [useAccount().address as `0x${string}`],
  });
  const { data: quadratic } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'quadraticVoting',
  });

  const userBalance = Number(balance || 0);
  const supply = totalSupply ? Number(formatEther(totalSupply as bigint)) : 0;
  const votingShare = supply > 0 ? (userBalance / supply * 100).toFixed(2) : '0.00';
  const votingPower = quadratic ? Math.sqrt(userBalance) : userBalance;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-green-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-900">{Number(proposalCount || 0)}</p>
            <p className="text-sm text-green-600">Total Proposals</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-green-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-900">{(userBalance / 1e18).toLocaleString()}</p>
            <p className="text-sm text-green-600">Your $PEACE Balance</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-green-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-900">{votingShare}%</p>
            <p className="text-sm text-green-600">Voting Share</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VotePage() {
  const { data: count } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'proposalCount',
  });
  const { address } = useAccount();

  const proposalCount = Number(count ?? 0);
  const [activeTab, setActiveTab] = useState('active');

  // Filter proposals by status
  const allProposals = Array.from({ length: proposalCount }, (_, i) => proposalCount - 1 - i); // Most recent first

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-900">🗳️ Governance & Voting</h1>
        <p className="text-green-700 max-w-2xl mx-auto">
          Shape the future of peace initiatives through community governance. 
          Every $PEACE token holder can vote on funding proposals.
        </p>
      </div>

      <GovernanceStats />

      {!address ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 text-center">
            <p className="text-amber-700">Connect your wallet to participate in governance</p>
          </CardContent>
        </Card>
      ) : proposalCount === 0 ? (
        <Card className="border-green-100">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-green-600">No proposals yet. Be the first to propose a peace initiative!</p>
            <Button asChild className="bg-green-700 hover:bg-green-800">
              <a href="/propose">Create First Proposal</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">Active Proposals</TabsTrigger>
            <TabsTrigger value="finalized">Finalized</TabsTrigger>
            <TabsTrigger value="all">All Proposals</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <div className="grid gap-6">
              {allProposals
                .slice(0, 10) // Show latest 10 for active
                .map((i) => (
                  <ProposalCard key={i} id={i} showFinalize />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="finalized" className="space-y-6">
            <div className="grid gap-6">
              {allProposals.map((i) => (
                <ProposalCard key={i} id={i} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6">
              {allProposals.map((i) => (
                <ProposalCard key={i} id={i} showFinalize />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
