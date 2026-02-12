'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useReadContract, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS, PROPOSAL_STATES } from '@/lib/contracts';

function ProposalAllocationCard({ id }: { id: number }) {
  const { data } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'proposals',
    args: [BigInt(id)],
  });

  const { data: milestoneCount } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'getMilestoneCount',
    args: [BigInt(id)],
  });

  const { data: state } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'getProposalState',
    args: [BigInt(id)],
  });

  if (!data) return null;
  const proposal = data as unknown[];
  const stateNum = Number(state ?? 0);
  const totalMilestones = Number(milestoneCount || 0);
  
  // Calculate allocation status
  const isAllocated = stateNum >= 3; // Funded or Completed
  const amount = formatEther(proposal[6] as bigint);
  
  return (
    <Card className="border-green-100">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Proposal #{id}</CardTitle>
            <CardDescription className="mt-1">{String(proposal[4])}</CardDescription>
          </div>
          <Badge variant={isAllocated ? 'default' : 'secondary'}>
            {PROPOSAL_STATES[stateNum] || 'Unknown'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-green-700">Amount:</span>
          <span className="font-semibold">{amount} ETH</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-green-700">Location:</span>
          <span className="text-sm">{String(proposal[5])}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-green-700">Milestones:</span>
          <span className="text-sm">{totalMilestones}</span>
        </div>
        {isAllocated && (
          <div className="pt-2">
            <div className="flex justify-between text-xs text-green-600 mb-1">
              <span>Allocation Progress</span>
              <span>{stateNum === 4 ? '100%' : '0%'}</span>
            </div>
            <Progress value={stateNum === 4 ? 100 : 0} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AllocationSummary() {
  const { data: proposalCount } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'proposalCount',
  });

  const totalProposals = Number(proposalCount || 0);
  
  // Get all proposals to calculate allocations
  const proposalIds = Array.from({ length: totalProposals }, (_, i) => i);
  
  // This is a simplified calculation - in production you'd batch these calls
  const totalAllocated = 0; // Would calculate from active proposals
  const pendingAllocations = 0; // Would calculate from funded proposals

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-amber-700">Total Allocated</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-amber-900">{totalAllocated} ETH</p>
          <p className="text-xs text-amber-600 mt-1">Across {totalProposals} proposals</p>
        </CardContent>
      </Card>
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-blue-700">Pending Release</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-900">{pendingAllocations} ETH</p>
          <p className="text-xs text-blue-600 mt-1">Awaiting milestone completion</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TreasuryPage() {
  const { data: balance } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'treasuryBalance',
  });
  const { data: totalSupply } = useReadContract({
    ...CONTRACTS.PeaceCoin,
    functionName: 'totalSupply',
  });
  const { data: proposalCount } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'proposalCount',
  });
  const { data: quadratic } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'quadraticVoting',
  });
  const { data: votingPeriod } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'votingPeriod',
  });
  const { data: nftCount } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'totalMinted',
  });

  const { address } = useAccount();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const totalProposals = Number(proposalCount || 0);
  const fundedInitiatives = Number(nftCount || 0);
  
  // Calculate treasury utilization
  const currentBalance = balance ? parseFloat(formatEther(balance as bigint)) : 0;
  const utilizationRate = currentBalance > 0 ? Math.min(fundedInitiatives * 0.1 / currentBalance * 100, 100) : 0;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-900">🏦 Treasury Dashboard</h1>
        <p className="text-green-700 max-w-2xl mx-auto">
          Monitor treasury balance, allocations, and peace initiative funding in real-time.
        </p>
      </div>

      {/* Live Balance Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-green-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-600 flex items-center gap-2">
              💰 ETH Balance
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => setRefreshKey(prev => prev + 1)}
              >
                ↻
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900" key={refreshKey}>
              {balance ? formatEther(balance as bigint) : '—'} ETH
            </p>
            <p className="text-xs text-green-600 mt-1">Live balance</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-600">🪙 $PEACE Supply</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">
              {totalSupply ? Number(formatEther(totalSupply as bigint)).toLocaleString() : '—'}
            </p>
            <p className="text-xs text-green-600 mt-1">Total minted tokens</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-600">📊 Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">{totalProposals}</p>
            <p className="text-xs text-green-600 mt-1">{fundedInitiatives} funded</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-600">📈 Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">{utilizationRate.toFixed(1)}%</p>
            <Progress value={utilizationRate} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Allocation Summary */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-green-900">Fund Allocations</h2>
        <AllocationSummary />
      </div>

      {/* Proposal Allocations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-green-900">Recent Proposals</h2>
        {totalProposals === 0 ? (
          <Card className="border-green-100">
            <CardContent className="pt-6 text-center text-green-600">
              No proposals yet. Submit the first peace initiative proposal!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: Math.min(totalProposals, 6) }, (_, i) => (
              <ProposalAllocationCard key={i} id={totalProposals - 1 - i} />
            ))}
          </div>
        )}
      </div>

      {/* Treasury Configuration */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Treasury Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-green-700">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Voting Period:</span>
              <span>{votingPeriod ? `${Number(votingPeriod) / 86400} days` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Quadratic Voting:</span>
              <span>{quadratic !== undefined ? (quadratic ? 'Enabled ✅' : 'Disabled') : '—'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Mint Rate:</span>
              <span>1,000 $PEACE per ETH</span>
            </div>
            <div className="flex justify-between">
              <span>Quorum:</span>
              <span>10% of supply</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
