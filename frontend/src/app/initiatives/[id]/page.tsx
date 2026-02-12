'use client';

import { use, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';

function MilestoneCard({ proposalId, index }: { proposalId: number; index: number }) {
  const { data: milestone } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'milestones',
    args: [BigInt(proposalId), BigInt(index)],
  });

  if (!milestone) return null;
  const [description, amount, released] = milestone as unknown[];

  return (
    <Card className={`border-green-100 ${released ? 'bg-green-50' : ''}`}>
      <CardContent className="pt-6 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-medium text-green-900">Milestone #{index + 1}</h4>
            <p className="text-sm text-green-700 mt-1">{String(description)}</p>
          </div>
          <Badge variant={released ? 'default' : 'outline'}>
            {released ? 'Released ✅' : 'Pending'}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-green-600">Amount:</span>
          <span className="font-medium">{formatEther(amount as bigint)} ETH</span>
        </div>
        
        {Boolean(released) && (
          <div className="pt-2 border-t border-green-200">
            <p className="text-xs text-green-600">
              ✅ Funds released to project team
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContributeToInitiative({ proposalId }: { proposalId: number }) {
  const [amount, setAmount] = useState('');
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleContribute = () => {
    if (!amount) return;
    writeContract({
      ...CONTRACTS.PeaceTreasury,
      functionName: 'donate',
      value: parseEther(amount),
    });
  };

  return (
    <Card className="border-green-100">
      <CardHeader>
        <CardTitle className="text-lg">Support This Initiative</CardTitle>
        <CardDescription>
          Donate ETH to strengthen the treasury and support more peace initiatives
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-green-700 mb-1 block">Contribution Amount (ETH)</label>
          <Input
            type="number"
            step="0.001"
            placeholder="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {amount && (
            <p className="text-sm text-green-600 mt-1">
              You will receive {(parseFloat(amount) * 1000).toLocaleString()} $PEACE tokens
            </p>
          )}
        </div>

        <Button
          onClick={handleContribute}
          disabled={isPending || isConfirming || !amount}
          className="w-full bg-green-700 hover:bg-green-800"
        >
          {isPending ? 'Contributing...' : isConfirming ? 'Processing...' : 'Contribute'}
        </Button>
        
        {error && <p className="text-red-600 text-sm">Error: {error.message}</p>}
        {isSuccess && (
          <p className="text-green-600 text-sm text-center">
            ✅ Thank you for supporting peace initiatives!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function InitiativeMetrics({ proposalId }: { proposalId: number }) {
  const { data: proposal } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'proposals',
    args: [BigInt(proposalId)],
  });

  const { data: milestoneCount } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'getMilestoneCount',
    args: [BigInt(proposalId)],
  });

  if (!proposal) return null;
  const [, , , , , , totalAmount, votesFor, votesAgainst] = proposal as unknown[];
  const totalMilestones = Number(milestoneCount || 0);
  const totalVotes = Number(votesFor) + Number(votesAgainst);
  const supportRate = totalVotes > 0 ? (Number(votesFor) / totalVotes * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-green-100">
        <CardContent className="pt-6 text-center">
          <p className="text-2xl font-bold text-green-900">{formatEther(totalAmount as bigint)}</p>
          <p className="text-sm text-green-600">ETH Allocated</p>
        </CardContent>
      </Card>
      <Card className="border-green-100">
        <CardContent className="pt-6 text-center">
          <p className="text-2xl font-bold text-green-900">{totalMilestones}</p>
          <p className="text-sm text-green-600">Milestones</p>
        </CardContent>
      </Card>
      <Card className="border-green-100">
        <CardContent className="pt-6 text-center">
          <p className="text-2xl font-bold text-green-900">{supportRate}%</p>
          <p className="text-sm text-green-600">Community Support</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InitiativeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tokenId = BigInt(id);

  const { data: initiative } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'initiatives',
    args: [tokenId],
  });

  const { data: owner } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'ownerOf',
    args: [tokenId],
  });

  const proposalIdFromInit = initiative ? Number((initiative as unknown[])[4]) : 0;
  
  const { data: milestoneCount } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'getMilestoneCount',
    args: [BigInt(proposalIdFromInit)],
  });

  if (!initiative) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <p className="text-green-600">Loading initiative details...</p>
      </div>
    );
  }

  const init = initiative as unknown[];
  const [description, location, fundingAmount, status, proposalId] = init;
  const totalMilestones = Number(milestoneCount || 0);
  
  // Calculate progress based on status and milestones
  const progress = status === 'Completed' ? 100 : status === 'Funded' ? 60 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-3xl font-bold text-green-900">Initiative #{id}</h1>
          <Badge className={`${status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
            {String(status)}
          </Badge>
        </div>
        <p className="text-green-600">Proposal #{String(proposalId)}</p>
      </div>

      {/* Key Info Card */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle className="text-xl">{String(description)}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>📍</span>
            <span>{String(location)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700 mb-1">Total Funding</p>
              <p className="text-2xl font-bold text-green-900">
                {formatEther(fundingAmount as bigint)} ETH
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700 mb-1">Project Owner</p>
              <p className="font-mono text-sm">
                {String(owner).slice(0, 12)}...
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-700">Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <InitiativeMetrics proposalId={Number(proposalId)} />

      {/* Tabs for detailed view */}
      <Tabs defaultValue="milestones" className="w-full">
        <TabsList>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="contribute">Contribute</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-green-900 mb-4">
              Project Milestones ({totalMilestones})
            </h2>
            {totalMilestones === 0 ? (
              <Card className="border-green-100">
                <CardContent className="pt-6 text-center text-green-600">
                  No milestones defined for this initiative.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {Array.from({ length: totalMilestones }, (_, i) => (
                  <MilestoneCard
                    key={i}
                    proposalId={Number(proposalId)}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contribute" className="space-y-6">
          <ContributeToInitiative proposalId={Number(proposalId)} />
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle>Initiative Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-green-900 mb-2">Basic Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-700">NFT Token ID:</span>
                      <span>#{id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Proposal ID:</span>
                      <span>#{String(proposalId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Status:</span>
                      <span>{String(status)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-green-900 mb-2">Funding Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-700">Amount:</span>
                      <span>{formatEther(fundingAmount as bigint)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Milestones:</span>
                      <span>{totalMilestones}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Owner:</span>
                      <span className="font-mono text-xs">
                        {String(owner).slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-green-100">
                <h4 className="font-medium text-green-900 mb-2">About This Initiative</h4>
                <p className="text-green-700 text-sm leading-relaxed">
                  {String(description)}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
