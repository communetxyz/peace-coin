'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';
import { formatEther } from 'viem';

export default function Home() {
  const { data: totalSupply } = useReadContract({
    ...CONTRACTS.PeaceCoin,
    functionName: 'totalSupply',
  });
  const { data: treasuryBalance } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'treasuryBalance',
  });
  const { data: proposalCount } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'proposalCount',
  });
  const { data: totalNFTs } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'totalMinted',
  });

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-20 space-y-6">
        <h1 className="text-5xl font-bold text-green-900 tracking-tight">
          Building Peace,{' '}
          <span className="text-amber-600">One Block at a Time</span>
        </h1>
        <p className="text-xl text-green-700 max-w-2xl mx-auto leading-relaxed">
          $PEACE is a decentralized token funding peace-building initiatives globally.
          Community-governed, transparent, and impactful.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/donate">
            <Button size="lg" className="bg-green-700 hover:bg-green-800 text-lg px-8">
              Donate & Get $PEACE
            </Button>
          </Link>
          <Link href="/propose">
            <Button size="lg" variant="outline" className="border-green-700 text-green-700 text-lg px-8">
              Propose Initiative
            </Button>
          </Link>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="$PEACE Supply"
          value={totalSupply ? `${Number(formatEther(totalSupply as bigint)).toLocaleString()}` : '—'}
          icon="🪙"
        />
        <MetricCard
          title="Treasury"
          value={treasuryBalance ? `${formatEther(treasuryBalance as bigint)} ETH` : '—'}
          icon="🏦"
        />
        <MetricCard
          title="Proposals"
          value={proposalCount !== undefined ? String(Number(proposalCount)) : '—'}
          icon="📋"
        />
        <MetricCard
          title="Funded Initiatives"
          value={totalNFTs !== undefined ? String(Number(totalNFTs)) : '—'}
          icon="🕊️"
        />
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-green-900 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepCard step="1" title="Donate" desc="Send ETH to the treasury and receive $PEACE governance tokens." />
          <StepCard step="2" title="Propose & Vote" desc="Anyone can propose peace initiatives. $PEACE holders vote on funding." />
          <StepCard step="3" title="Fund & Track" desc="Approved initiatives receive milestone-based funding with full on-chain transparency." />
        </div>
      </section>

      {/* Peace Bond */}
      <section className="bg-white rounded-2xl p-12 text-center space-y-4 border border-green-100">
        <h2 className="text-3xl font-bold text-green-900">⚖️ Peace Bonds</h2>
        <p className="text-green-700 max-w-xl mx-auto">
          Stake $PEACE to participate in on-chain conflict resolution.
          Mediators help resolve disputes, earning reputation and rewards.
        </p>
        <Link href="/mediation">
          <Button variant="outline" className="border-amber-600 text-amber-700">
            Learn About Mediation
          </Button>
        </Link>
      </section>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <Card className="bg-white border-green-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-green-600 font-medium">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-green-900">{value}</p>
      </CardContent>
    </Card>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <Card className="bg-white border-green-100">
      <CardContent className="pt-6 space-y-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold">
          {step}
        </div>
        <h3 className="text-xl font-semibold text-green-900">{title}</h3>
        <p className="text-green-700">{desc}</p>
      </CardContent>
    </Card>
  );
}
