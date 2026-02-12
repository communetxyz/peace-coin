'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

function InitiativeCard({ id }: { id: number }) {
  const { data } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'initiatives',
    args: [BigInt(id)],
  });

  if (!data) return null;
  const init = data as unknown[];

  return (
    <Link href={`/initiatives/${id}`}>
      <Card className="border-green-100 hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle className="text-lg">Initiative #{id}</CardTitle>
            <Badge>{String(init[3])}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-green-700">{String(init[0])}</p>
          <p className="text-sm text-green-600">📍 {String(init[1])}</p>
          <p className="text-sm font-medium">{formatEther(init[2] as bigint)} ETH funded</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function InitiativesPage() {
  const { data: total } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'totalMinted',
  });
  const count = Number(total ?? 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-green-900">🌍 Peace Initiatives</h1>
      <MapView />
      {count === 0 ? (
        <p className="text-green-600">No initiatives funded yet. Propose one!</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: count }, (_, i) => (
            <InitiativeCard key={i} id={i} />
          ))}
        </div>
      )}
    </div>
  );
}
