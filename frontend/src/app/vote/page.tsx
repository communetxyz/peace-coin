'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS, PROPOSAL_STATES } from '@/lib/contracts';

function ProposalCard({ id }: { id: number }) {
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

  const { writeContract: voteFor, data: hashFor } = useWriteContract();
  const { writeContract: voteAgainst, data: hashAgainst } = useWriteContract();
  useWaitForTransactionReceipt({ hash: hashFor });
  useWaitForTransactionReceipt({ hash: hashAgainst });

  if (!data) return null;
  const proposal = data as unknown[];
  const stateNum = Number(state ?? 0);
  const isActive = stateNum === 0;

  return (
    <Card className="border-green-100">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">Proposal #{id}</CardTitle>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {PROPOSAL_STATES[stateNum] ?? 'Unknown'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-green-700">{String(proposal[4])}</p>
        <p className="text-sm text-green-600">📍 {String(proposal[5])}</p>
        <p className="text-sm">Funding: {formatEther(proposal[6] as bigint)} ETH</p>
        <div className="flex gap-2 text-sm">
          <span className="text-green-700">For: {String(proposal[7])}</span>
          <span className="text-red-600">Against: {String(proposal[8])}</span>
        </div>
        {isActive && (
          <div className="flex gap-3 pt-2">
            <Button
              size="sm"
              className="bg-green-700 hover:bg-green-800"
              onClick={() => voteFor({ ...CONTRACTS.PeaceTreasury, functionName: 'vote', args: [BigInt(id), true] })}
            >
              👍 Vote For
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600"
              onClick={() => voteAgainst({ ...CONTRACTS.PeaceTreasury, functionName: 'vote', args: [BigInt(id), false] })}
            >
              👎 Vote Against
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VotePage() {
  const { data: count } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'proposalCount',
  });

  const proposalCount = Number(count ?? 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-green-900">🗳️ Vote on Proposals</h1>
      {proposalCount === 0 ? (
        <p className="text-green-600">No proposals yet. Be the first to propose a peace initiative!</p>
      ) : (
        <div className="grid gap-6">
          {Array.from({ length: proposalCount }, (_, i) => (
            <ProposalCard key={i} id={i} />
          ))}
        </div>
      )}
    </div>
  );
}
