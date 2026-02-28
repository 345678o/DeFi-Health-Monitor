'use client';

import { Web3Dashboard } from '@/components/web3-dashboard';

export default function DashboardPage() {
  return (
    <div className="flex-1 overflow-auto bg-background p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">LiquidGuard Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your DeFi positions and protect against liquidation risks in real-time
        </p>
      </div>
      
      <Web3Dashboard />
    </div>
  );
}