'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { CONTRACTS, DISPUTE_STATES } from '@/lib/contracts';

function DisputeCard({ id }: { id: number }) {
  const { data: dispute } = useReadContract({
    ...CONTRACTS.PeaceBond,
    functionName: 'disputes',
    args: [BigInt(id)],
  });

  const { writeContract: resolve, data: resolveHash, isPending: isResolving } = useWriteContract();
  const { writeContract: settle, data: settleHash, isPending: isSettling } = useWriteContract();
  const { isLoading: isConfirmingResolve } = useWaitForTransactionReceipt({ hash: resolveHash });
  const { isLoading: isConfirmingSettle } = useWaitForTransactionReceipt({ hash: settleHash });

  const { address } = useAccount();

  if (!dispute) return null;
  const [disputeId, partyA, partyB, mediator, stakeA, stakeB, description, state] = dispute as unknown[];
  const stateNum = Number(state);
  const isMediator = address && mediator === address;
  const isParty = address && (partyA === address || partyB === address);

  return (
    <Card className="border-green-100">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">Dispute #{id}</CardTitle>
          <Badge>{DISPUTE_STATES[stateNum] || 'Unknown'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-green-700">{String(description)}</p>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Party A Stake:</span>
            <span className="font-medium">{formatEther(stakeA as bigint)} PEACE</span>
          </div>
          <div className="flex justify-between">
            <span>Party B Stake:</span>
            <span className="font-medium">{stakeB ? formatEther(stakeB as bigint) : '0'} PEACE</span>
          </div>
          {Boolean(mediator && String(mediator) !== '0x0000000000000000000000000000000000000000') && (
            <div className="flex justify-between">
              <span>Mediator:</span>
              <span className="font-mono text-xs">{String(mediator).slice(0, 10)}...</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {stateNum === 1 && isMediator && (
          <div className="flex gap-2 pt-3">
            <Button
              size="sm"
              onClick={() => resolve({ ...CONTRACTS.PeaceBond, functionName: 'resolve', args: [BigInt(id), true] })}
              disabled={isResolving || isConfirmingResolve}
              className="bg-green-700 hover:bg-green-800"
            >
              Favor Party A
            </Button>
            <Button
              size="sm"
              onClick={() => resolve({ ...CONTRACTS.PeaceBond, functionName: 'resolve', args: [BigInt(id), false] })}
              disabled={isResolving || isConfirmingResolve}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Favor Party B
            </Button>
          </div>
        )}
        
        {(stateNum === 0 || stateNum === 1) && isParty && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => settle({ ...CONTRACTS.PeaceBond, functionName: 'settle', args: [BigInt(id)] })}
            disabled={isSettling || isConfirmingSettle}
            className="w-full"
          >
            Propose Settlement
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function MediatorProfile({ address: mediatorAddress }: { address: string }) {
  const { data: mediator } = useReadContract({
    ...CONTRACTS.PeaceBond,
    functionName: 'mediators',
    args: [mediatorAddress as `0x${string}`],
  });

  if (!mediator || !(mediator as unknown[])[0]) return null;
  const [registered, staked, resolved, reputation] = mediator as unknown[];

  return (
    <Card className="border-green-100">
      <CardHeader>
        <CardTitle className="text-lg">Mediator Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span>Address:</span>
            <span className="font-mono text-xs">{mediatorAddress.slice(0, 12)}...</span>
          </div>
          <div className="flex justify-between">
            <span>Stake:</span>
            <span className="font-medium">{formatEther(staked as bigint)} PEACE</span>
          </div>
          <div className="flex justify-between">
            <span>Cases Resolved:</span>
            <span className="font-medium">{String(resolved)}</span>
          </div>
          <div className="flex justify-between">
            <span>Reputation:</span>
            <span className="font-medium">{String(reputation)}/100</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MediationPage() {
  const { address } = useAccount();
  const [partyB, setPartyB] = useState('');
  const [description, setDescription] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [mediatorStake, setMediatorStake] = useState('');
  const [disputeId, setDisputeId] = useState('');
  const [joinStake, setJoinStake] = useState('');
  const [selectedTab, setSelectedTab] = useState('browse');

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: disputeCount } = useReadContract({
    ...CONTRACTS.PeaceBond,
    functionName: 'disputeCount',
  });

  const { data: mediator } = useReadContract({
    ...CONTRACTS.PeaceBond,
    functionName: 'mediators',
    args: address ? [address] : undefined,
  });

  const isMediator = mediator ? (mediator as unknown[])[0] : false;
  const totalDisputes = Number(disputeCount || 0);

  const handleApproveAndAction = (action: () => void, amount: string) => {
    if (!amount) return;
    writeContract({
      ...CONTRACTS.PeaceCoin,
      functionName: 'approve',
      args: [CONTRACTS.PeaceBond.address, parseEther(amount)],
    });
    // Note: In production, should wait for approval then call action
    setTimeout(action, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-900">⚖️ Peace Bond Mediation</h1>
        <p className="text-green-700 max-w-2xl mx-auto">
          Resolve conflicts through community mediation. Stake $PEACE tokens to participate in transparent dispute resolution.
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="browse">Browse Disputes</TabsTrigger>
          <TabsTrigger value="create">Create Dispute</TabsTrigger>
          <TabsTrigger value="join">Join Dispute</TabsTrigger>
          <TabsTrigger value="mediator">Mediator</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-green-900">Active Disputes</h2>
            <Badge variant="outline">{totalDisputes} total disputes</Badge>
          </div>
          {totalDisputes === 0 ? (
            <Card className="border-green-100">
              <CardContent className="pt-6 text-center text-green-600">
                No disputes yet. The community is peaceful! 🕊️
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {Array.from({ length: totalDisputes }, (_, i) => (
                <DisputeCard key={i} id={i} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle>Create a Dispute</CardTitle>
              <CardDescription>Stake $PEACE tokens to initiate conflict resolution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-green-700 mb-1 block">Other Party Address</label>
                <Input 
                  placeholder="0x..." 
                  value={partyB} 
                  onChange={(e) => setPartyB(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-green-700 mb-1 block">Dispute Description</label>
                <Textarea 
                  placeholder="Describe the dispute clearly..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm text-green-700 mb-1 block">Stake Amount (PEACE)</label>
                <Input 
                  type="number" 
                  placeholder="Minimum 100 PEACE" 
                  value={stakeAmount} 
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
              </div>

              <Button
                onClick={() => handleApproveAndAction(() => {
                  writeContract({
                    ...CONTRACTS.PeaceBond,
                    functionName: 'createDispute',
                    args: [partyB as `0x${string}`, description, parseEther(stakeAmount || '0')],
                  });
                }, stakeAmount)}
                disabled={isPending || isConfirming || !partyB || !description || !stakeAmount}
                className="w-full bg-green-700 hover:bg-green-800"
              >
                {isPending ? 'Approving...' : isConfirming ? 'Creating...' : 'Create Dispute'}
              </Button>
              
              {error && (
                <p className="text-red-600 text-sm">Error: {error.message}</p>
              )}
              {isSuccess && (
                <p className="text-green-600 text-sm">✅ Dispute created successfully!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="join">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle>Join a Dispute</CardTitle>
              <CardDescription>Stake $PEACE to join an existing dispute</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-green-700 mb-1 block">Dispute ID</label>
                <Input 
                  placeholder="Enter dispute ID" 
                  value={disputeId} 
                  onChange={(e) => setDisputeId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-green-700 mb-1 block">Stake Amount (PEACE)</label>
                <Input 
                  type="number" 
                  placeholder="Minimum 100 PEACE" 
                  value={joinStake} 
                  onChange={(e) => setJoinStake(e.target.value)}
                />
              </div>
              
              <Button
                onClick={() => handleApproveAndAction(() => {
                  writeContract({
                    ...CONTRACTS.PeaceBond,
                    functionName: 'joinDispute',
                    args: [BigInt(disputeId || '0'), parseEther(joinStake || '0')],
                  });
                }, joinStake)}
                disabled={isPending || isConfirming || !disputeId || !joinStake}
                className="w-full bg-green-700 hover:bg-green-800"
              >
                {isPending ? 'Approving...' : isConfirming ? 'Joining...' : 'Join Dispute'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mediator" className="space-y-6">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle>Mediator Dashboard</CardTitle>
              <CardDescription>
                {isMediator ? '✅ You are a registered mediator' : 'Become a community mediator'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isMediator ? (
                <>
                  <div>
                    <label className="text-sm text-green-700 mb-1 block">Stake Amount (min 500 PEACE)</label>
                    <Input 
                      type="number" 
                      placeholder="500" 
                      value={mediatorStake} 
                      onChange={(e) => setMediatorStake(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => handleApproveAndAction(() => {
                      writeContract({
                        ...CONTRACTS.PeaceBond,
                        functionName: 'registerMediator',
                        args: [parseEther(mediatorStake || '0')],
                      });
                    }, mediatorStake)}
                    disabled={isPending || isConfirming || !mediatorStake}
                    className="w-full bg-green-700 hover:bg-green-800"
                  >
                    {isPending ? 'Approving...' : isConfirming ? 'Registering...' : 'Register as Mediator'}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-green-700 mb-1 block">Assign to Dispute</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Dispute ID" 
                        value={disputeId} 
                        onChange={(e) => setDisputeId(e.target.value)}
                      />
                      <Button
                        onClick={() => writeContract({
                          ...CONTRACTS.PeaceBond,
                          functionName: 'assignMediator',
                          args: [BigInt(disputeId || '0')],
                        })}
                        disabled={isPending || isConfirming || !disputeId}
                        className="bg-green-700 hover:bg-green-800"
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isMediator && address && <MediatorProfile address={address} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
