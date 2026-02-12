'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';

export default function MediationPage() {
  const { address } = useAccount();
  const [partyB, setPartyB] = useState('');
  const [description, setDescription] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [mediatorStake, setMediatorStake] = useState('');
  const [disputeId, setDisputeId] = useState('');
  const [joinStake, setJoinStake] = useState('');

  const { writeContract: createDispute, data: createHash } = useWriteContract();
  const { writeContract: registerMed, data: regHash } = useWriteContract();
  const { writeContract: joinDisp, data: joinHash } = useWriteContract();
  const { writeContract: assignMed, data: assignHash } = useWriteContract();

  useWaitForTransactionReceipt({ hash: createHash });
  useWaitForTransactionReceipt({ hash: regHash });
  useWaitForTransactionReceipt({ hash: joinHash });
  useWaitForTransactionReceipt({ hash: assignHash });

  const { data: mediator } = useReadContract({
    ...CONTRACTS.PeaceBond,
    functionName: 'mediators',
    args: address ? [address] : undefined,
  });

  const isMediator = mediator ? (mediator as unknown[])[0] : false;

  const handleApproveAndCreate = () => {
    createDispute({
      ...CONTRACTS.PeaceCoin,
      functionName: 'approve',
      args: [CONTRACTS.PeaceBond.address, parseEther(stakeAmount || '0')],
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-green-900">⚖️ Peace Bond Mediation</h1>

      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">Create Dispute</TabsTrigger>
          <TabsTrigger value="join">Join Dispute</TabsTrigger>
          <TabsTrigger value="mediator">Mediator</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle>Create a Dispute</CardTitle>
              <CardDescription>Stake $PEACE tokens to initiate conflict resolution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Other party address (0x...)" value={partyB} onChange={(e) => setPartyB(e.target.value)} />
              <Textarea placeholder="Describe the dispute..." value={description} onChange={(e) => setDescription(e.target.value)} />
              <Input type="number" placeholder="Stake amount (PEACE)" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
              <div className="flex gap-3">
                <Button onClick={handleApproveAndCreate} className="bg-amber-600 hover:bg-amber-700">
                  1. Approve $PEACE
                </Button>
                <Button
                  onClick={() => createDispute({
                    ...CONTRACTS.PeaceBond,
                    functionName: 'createDispute',
                    args: [partyB as `0x${string}`, description, parseEther(stakeAmount || '0')],
                  })}
                  className="bg-green-700 hover:bg-green-800"
                >
                  2. Create Dispute
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="join">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle>Join a Dispute</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Dispute ID" value={disputeId} onChange={(e) => setDisputeId(e.target.value)} />
              <Input type="number" placeholder="Stake amount (PEACE)" value={joinStake} onChange={(e) => setJoinStake(e.target.value)} />
              <div className="flex gap-3">
                <Button
                  onClick={() => joinDisp({
                    ...CONTRACTS.PeaceCoin,
                    functionName: 'approve',
                    args: [CONTRACTS.PeaceBond.address, parseEther(joinStake || '0')],
                  })}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  1. Approve
                </Button>
                <Button
                  onClick={() => joinDisp({
                    ...CONTRACTS.PeaceBond,
                    functionName: 'joinDispute',
                    args: [BigInt(disputeId || '0'), parseEther(joinStake || '0')],
                  })}
                  className="bg-green-700 hover:bg-green-800"
                >
                  2. Join
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mediator">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle>Mediator Registration</CardTitle>
              <CardDescription>
                {isMediator ? '✅ You are a registered mediator' : 'Stake $PEACE to become a mediator'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isMediator && (
                <>
                  <Input type="number" placeholder="Stake amount (min 500 PEACE)" value={mediatorStake} onChange={(e) => setMediatorStake(e.target.value)} />
                  <div className="flex gap-3">
                    <Button
                      onClick={() => registerMed({
                        ...CONTRACTS.PeaceCoin,
                        functionName: 'approve',
                        args: [CONTRACTS.PeaceBond.address, parseEther(mediatorStake || '0')],
                      })}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      1. Approve
                    </Button>
                    <Button
                      onClick={() => registerMed({
                        ...CONTRACTS.PeaceBond,
                        functionName: 'registerMediator',
                        args: [parseEther(mediatorStake || '0')],
                      })}
                      className="bg-green-700 hover:bg-green-800"
                    >
                      2. Register
                    </Button>
                  </div>
                </>
              )}
              {isMediator ? (
                <div className="space-y-2">
                  <Input placeholder="Dispute ID to mediate" value={disputeId} onChange={(e) => setDisputeId(e.target.value)} />
                  <Button
                    onClick={() => assignMed({
                      ...CONTRACTS.PeaceBond,
                      functionName: 'assignMediator',
                      args: [BigInt(disputeId || '0')],
                    })}
                    className="bg-green-700 hover:bg-green-800"
                  >
                    Assign Myself as Mediator
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
