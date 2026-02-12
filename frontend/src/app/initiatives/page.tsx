'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

function InitiativeCard({ id, showContribute = false }: { id: number; showContribute?: boolean }) {
  const { data } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'initiatives',
    args: [BigInt(id)],
  });

  const [contributeAmount, setContributeAmount] = useState('');
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!data) return null;
  const init = data as unknown[];
  const proposalId = Number(init[4]);
  const status = String(init[3]);
  const funding = formatEther(init[2] as bigint);
  
  // Calculate progress based on status
  const progress = status === 'Completed' ? 100 : status === 'Funded' ? 75 : 50;

  const handleContribute = () => {
    if (!contributeAmount) return;
    writeContract({
      ...CONTRACTS.PeaceTreasury,
      functionName: 'donate',
      value: parseEther(contributeAmount),
    });
  };

  return (
    <Card className="border-green-100 hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Initiative #{id}</CardTitle>
            <p className="text-sm text-green-600 mt-1">Proposal #{proposalId}</p>
          </div>
          <Badge variant={status === 'Completed' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-green-700 line-clamp-2">{String(init[0])}</p>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <span>📍</span>
          <span>{String(init[1])}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-700">Funding</span>
            <span className="font-medium">{funding} ETH</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-green-600">
            {progress}% Complete
          </div>
        </div>

        {showContribute && (
          <div className="pt-3 border-t border-green-100 space-y-3">
            <h4 className="text-sm font-medium text-green-900">Support this initiative</h4>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="ETH"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                className="flex-1"
              />
              <Button 
                size="sm"
                onClick={handleContribute}
                disabled={isPending || isConfirming || !contributeAmount}
                className="bg-green-700 hover:bg-green-800"
              >
                {isPending ? 'Contributing...' : 'Contribute'}
              </Button>
            </div>
            {isSuccess && (
              <p className="text-green-600 text-xs">✅ Contribution successful!</p>
            )}
          </div>
        )}

        <div className="pt-2">
          <Link href={`/initiatives/${id}`}>
            <Button variant="outline" size="sm" className="w-full">
              View Details →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateInitiativeCard() {
  return (
    <Link href="/propose">
      <Card className="border-dashed border-2 border-green-200 hover:border-green-300 transition-colors cursor-pointer h-full">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-2xl">➕</span>
          </div>
          <div className="text-center">
            <h3 className="font-medium text-green-900">Create New Initiative</h3>
            <p className="text-sm text-green-600 mt-1">
              Propose a peace-building project for community funding
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function InitiativeStats() {
  const { data: totalMinted } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'totalMinted',
  });
  const { data: treasuryBalance } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'treasuryBalance',
  });
  const { data: proposalCount } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'proposalCount',
  });

  const fundedCount = Number(totalMinted || 0);
  const totalProposals = Number(proposalCount || 0);
  const balance = treasuryBalance ? formatEther(treasuryBalance as bigint) : '0';
  
  const successRate = totalProposals > 0 ? (fundedCount / totalProposals * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-green-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-900">{fundedCount}</p>
            <p className="text-sm text-green-600">Funded Initiatives</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-green-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-900">{balance}</p>
            <p className="text-sm text-green-600">ETH Available</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-green-100">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-900">{successRate}%</p>
            <p className="text-sm text-green-600">Success Rate</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InitiativesPage() {
  const { data: total } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'totalMinted',
  });
  const count = Number(total ?? 0);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('grid');

  // Filter initiatives
  const filteredInitiatives = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-900">🌍 Peace Initiatives</h1>
        <p className="text-green-700 max-w-2xl mx-auto">
          Discover and support peace-building projects around the world. 
          Every contribution helps build a more peaceful future.
        </p>
      </div>

      <InitiativeStats />

      <Tabs value={view} onValueChange={setView} className="w-full">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="funded">Funded</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="grid" className="space-y-6">
          {count === 0 ? (
            <div className="text-center py-12 space-y-6">
              <p className="text-green-600">No initiatives funded yet.</p>
              <CreateInitiativeCard />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <CreateInitiativeCard />
              {filteredInitiatives.map((i) => (
                <InitiativeCard key={i} id={i} showContribute />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="map">
          <MapView />
          {count > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">All Initiatives</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredInitiatives.map((i) => (
                  <InitiativeCard key={i} id={i} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
