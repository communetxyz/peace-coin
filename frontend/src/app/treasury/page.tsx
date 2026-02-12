'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';

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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-green-900">🏦 Treasury Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-100">
          <CardHeader><CardTitle className="text-sm text-green-600">ETH Balance</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">
              {balance ? formatEther(balance as bigint) : '—'} ETH
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardHeader><CardTitle className="text-sm text-green-600">$PEACE Supply</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">
              {totalSupply ? Number(formatEther(totalSupply as bigint)).toLocaleString() : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardHeader><CardTitle className="text-sm text-green-600">Total Proposals</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">{proposalCount !== undefined ? String(Number(proposalCount)) : '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-green-100">
        <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-green-700">
          <p>Voting Period: {votingPeriod ? `${Number(votingPeriod) / 86400} days` : '—'}</p>
          <p>Quadratic Voting: {quadratic !== undefined ? (quadratic ? 'Enabled ✅' : 'Disabled') : '—'}</p>
          <p>Mint Rate: 1,000 $PEACE per 1 ETH</p>
          <p>Quorum: 10% of supply</p>
        </CardContent>
      </Card>
    </div>
  );
}
