'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACTS } from '@/lib/contracts';

export default function DonatePage() {
  const [amount, setAmount] = useState('');
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleDonate = () => {
    if (!amount) return;
    writeContract({
      ...CONTRACTS.PeaceTreasury,
      functionName: 'donate',
      value: parseEther(amount),
    });
  };

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-green-900">💚 Donate to Peace</h1>
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Contribute ETH</CardTitle>
          <CardDescription>
            Donate ETH to the Peace Treasury and receive 1,000 $PEACE tokens per ETH.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-green-700 mb-1 block">Amount (ETH)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {amount && (
              <p className="text-sm text-green-600 mt-1">
                You will receive {(parseFloat(amount) * 1000).toLocaleString()} $PEACE
              </p>
            )}
          </div>
          <Button
            onClick={handleDonate}
            disabled={isPending || isConfirming || !amount}
            className="w-full bg-green-700 hover:bg-green-800"
          >
            {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Donate'}
          </Button>
          {isSuccess && (
            <p className="text-green-600 text-center font-medium">
              ✅ Donation successful! Thank you for supporting peace.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
