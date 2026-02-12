'use client';

import { use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';

export default function InitiativeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tokenId = BigInt(id);

  const { data: initiative } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'initiatives',
    args: [tokenId],
  });

  const { data: tokenURI } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'tokenURI',
    args: [tokenId],
  });

  if (!initiative) return <p className="text-green-600">Loading initiative...</p>;
  const init = initiative as unknown[];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-green-900">Initiative #{id}</h1>
      <Card className="border-green-100">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{String(init[0])}</CardTitle>
            <Badge>{String(init[3])}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-green-600">📍 {String(init[1])}</p>
          <p className="text-lg font-medium text-green-900">{formatEther(init[2] as bigint)} ETH funded</p>
          <div>
            <p className="text-sm text-green-600 mb-1">Funding Progress</p>
            <Progress value={String(init[3]) === 'Completed' ? 100 : 50} className="h-3" />
          </div>
          <div>
            <p className="text-sm text-green-600 mb-1">Proposal ID: {String(init[4])}</p>
          </div>
          {tokenURI ? (
            <details className="text-xs">
              <summary className="cursor-pointer text-green-600">NFT Metadata</summary>
              <pre className="mt-2 p-2 bg-green-50 rounded overflow-auto">{String(tokenURI as string)}</pre>
            </details>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
