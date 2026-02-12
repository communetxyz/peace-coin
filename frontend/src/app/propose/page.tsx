'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';

interface Milestone {
  description: string;
  amount: string;
}

export default function ProposePage() {
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([{ description: '', amount: '' }]);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const totalAmount = milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);

  const addMilestone = () => setMilestones([...milestones, { description: '', amount: '' }]);
  const updateMilestone = (i: number, field: keyof Milestone, value: string) => {
    const updated = [...milestones];
    updated[i][field] = value;
    setMilestones(updated);
  };

  const handleSubmit = () => {
    writeContract({
      ...CONTRACTS.PeaceTreasury,
      functionName: 'propose',
      args: [
        recipient as `0x${string}`,
        description,
        location,
        parseEther(totalAmount.toString()),
        milestones.map((m) => m.description),
        milestones.map((m) => parseEther(m.amount || '0')),
      ],
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-green-900">📝 Propose Peace Initiative</h1>
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>New Proposal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-green-700 mb-1 block">Recipient Address</label>
            <Input placeholder="0x..." value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-green-700 mb-1 block">Description</label>
            <Textarea
              placeholder="Describe the peace initiative..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-green-700 mb-1 block">Location</label>
            <Input placeholder="e.g. Nairobi, Kenya" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-3">
            <label className="text-sm text-green-700 font-medium">Milestones</label>
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-3">
                <Input
                  placeholder="Milestone description"
                  value={m.description}
                  onChange={(e) => updateMilestone(i, 'description', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="ETH"
                  value={m.amount}
                  onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                  className="w-32"
                />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addMilestone}>
              + Add Milestone
            </Button>
          </div>

          <p className="text-sm text-green-600">Total: {totalAmount} ETH</p>

          <Button
            onClick={handleSubmit}
            disabled={isPending || isConfirming}
            className="w-full bg-green-700 hover:bg-green-800"
          >
            {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Submit Proposal'}
          </Button>
          {isSuccess && (
            <p className="text-green-600 text-center">✅ Proposal submitted successfully!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
