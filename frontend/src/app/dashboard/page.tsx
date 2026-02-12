'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';

function GlobalImpactMetrics() {
  const { data: treasuryBalance } = useReadContract({
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
  
  const { data: initiativesCount } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'totalMinted',
  });
  
  const { data: disputeCount } = useReadContract({
    ...CONTRACTS.PeaceBond,
    functionName: 'disputeCount',
  });

  const balance = treasuryBalance ? parseFloat(formatEther(treasuryBalance as bigint)) : 0;
  const supply = totalSupply ? parseFloat(formatEther(totalSupply as bigint)) : 0;
  const proposals = Number(proposalCount || 0);
  const initiatives = Number(initiativesCount || 0);
  const disputes = Number(disputeCount || 0);
  
  // Calculate metrics
  const successRate = proposals > 0 ? (initiatives / proposals * 100).toFixed(1) : '0';
  const averageFunding = initiatives > 0 ? (balance / initiatives).toFixed(3) : '0';
  const communityGrowth = supply > 0 ? ((supply / 10000) * 100).toFixed(1) : '0'; // Assuming 10k target
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-green-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-green-600">💰 Treasury Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-900">{balance.toFixed(3)}</p>
          <p className="text-sm text-green-600">ETH Available</p>
        </CardContent>
      </Card>

      <Card className="border-green-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-green-600">🕊️ Peace Initiatives</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-900">{initiatives}</p>
          <p className="text-sm text-green-600">Funded Projects</p>
        </CardContent>
      </Card>

      <Card className="border-green-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-green-600">👥 Community</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-900">{supply.toLocaleString()}</p>
          <p className="text-sm text-green-600">$PEACE Holders</p>
        </CardContent>
      </Card>

      <Card className="border-green-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-green-600">⚖️ Mediation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-900">{disputes}</p>
          <p className="text-sm text-green-600">Disputes Resolved</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ImpactProgress() {
  const { data: treasuryBalance } = useReadContract({
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
  
  const { data: initiativesCount } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'totalMinted',
  });

  const balance = treasuryBalance ? parseFloat(formatEther(treasuryBalance as bigint)) : 0;
  const supply = totalSupply ? parseFloat(formatEther(totalSupply as bigint)) : 0;
  const proposals = Number(proposalCount || 0);
  const initiatives = Number(initiativesCount || 0);
  
  const targets = {
    treasury: 10, // 10 ETH target
    community: 10000, // 10k token holders target
    initiatives: 50, // 50 initiatives target
    proposals: 100, // 100 proposals target
  };
  
  const progress = {
    treasury: Math.min((balance / targets.treasury) * 100, 100),
    community: Math.min((supply / targets.community) * 100, 100),
    initiatives: Math.min((initiatives / targets.initiatives) * 100, 100),
    proposals: Math.min((proposals / targets.proposals) * 100, 100),
  };

  return (
    <Card className="border-green-100">
      <CardHeader>
        <CardTitle className="text-xl">Global Peace Goals Progress</CardTitle>
        <CardDescription>Track our collective impact toward building lasting peace</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-green-900">Treasury Growth</span>
              <span className="text-sm text-green-600">
                {balance.toFixed(1)} / {targets.treasury} ETH
              </span>
            </div>
            <Progress value={progress.treasury} className="h-3" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-green-900">Community Building</span>
              <span className="text-sm text-green-600">
                {supply.toLocaleString()} / {targets.community.toLocaleString()} holders
              </span>
            </div>
            <Progress value={progress.community} className="h-3" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-green-900">Peace Initiatives</span>
              <span className="text-sm text-green-600">
                {initiatives} / {targets.initiatives} funded
              </span>
            </div>
            <Progress value={progress.initiatives} className="h-3" />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-green-900">Community Proposals</span>
              <span className="text-sm text-green-600">
                {proposals} / {targets.proposals} submitted
              </span>
            </div>
            <Progress value={progress.proposals} className="h-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity() {
  const { data: proposalCount } = useReadContract({
    ...CONTRACTS.PeaceTreasury,
    functionName: 'proposalCount',
  });
  
  const { data: initiativesCount } = useReadContract({
    ...CONTRACTS.PeaceInitiativeNFT,
    functionName: 'totalMinted',
  });

  const recentActivities = [
    {
      type: 'proposal',
      title: 'New Peace Initiative Proposed',
      description: 'Community education program in Kenya',
      time: '2 hours ago',
      badge: 'New',
    },
    {
      type: 'funding',
      title: 'Initiative Successfully Funded',
      description: 'School reconstruction project approved',
      time: '1 day ago',
      badge: 'Funded',
    },
    {
      type: 'donation',
      title: 'Major Donation Received',
      description: '5 ETH contributed to treasury',
      time: '2 days ago',
      badge: 'Donation',
    },
    {
      type: 'milestone',
      title: 'Project Milestone Completed',
      description: 'Water well construction finished',
      time: '3 days ago',
      badge: 'Complete',
    },
  ];

  return (
    <Card className="border-green-100">
      <CardHeader>
        <CardTitle className="text-xl">Recent Activity</CardTitle>
        <CardDescription>Latest developments in the Peace ecosystem</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-green-900 text-sm">{activity.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {activity.badge}
                  </Badge>
                </div>
                <p className="text-sm text-green-700">{activity.description}</p>
                <p className="text-xs text-green-600 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function GlobalImpactMap() {
  return (
    <Card className="border-green-100">
      <CardHeader>
        <CardTitle className="text-xl">Global Peace Impact</CardTitle>
        <CardDescription>Peace initiatives funded worldwide</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <div className="text-4xl">🌍</div>
            <h3 className="text-xl font-bold text-green-900">Building Peace Globally</h3>
            <p className="text-green-700">
              Our initiatives span across continents, bringing communities together 
              and fostering lasting peace through education, mediation, and support.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">12</div>
                <div className="text-sm text-green-600">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">45</div>
                <div className="text-sm text-green-600">Communities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">1.2K</div>
                <div className="text-sm text-green-600">People Helped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900">8</div>
                <div className="text-sm text-green-600">Active Projects</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-green-900">🕊️ Peace Impact Dashboard</h1>
        <p className="text-green-700 max-w-2xl mx-auto">
          Track the global impact of peace initiatives, community growth, and collective progress
          toward building a more peaceful world.
        </p>
      </div>

      <GlobalImpactMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ImpactProgress />
        <RecentActivity />
      </div>

      <GlobalImpactMap />
    </div>
  );
}