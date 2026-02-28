'use client';

import { useEffect, useState } from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { MetricCard } from '@/components/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Activity, RefreshCw, Shield, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { SUPPORTED_PROTOCOLS } from '@/lib/web3Config';

interface PositionData {
  protocol: string;
  totalCollateralUSD: number;
  totalDebtUSD: number;
  healthFactor: number;
  liquidationThreshold: number;
  ltv: number;
  availableBorrowsUSD: number;
}

interface HealthData {
  isAtRisk: boolean;
  riskLevel: 'safe' | 'warning' | 'danger' | 'critical';
  recommendations: string[];
}

export function Web3Dashboard() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const chainId = useChainId();
  
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Check network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch position data with error handling
  const fetchPositions = async () => {
    if (!address || !isOnline) return;
    
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      const response = await fetch(`/api/positions?address=${address}&protocol=aave`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (data.data.position) {
          setPositions([data.data.position]);
        }
        if (data.data.health) {
          setHealthData(data.data.health);
        }
        setLastUpdate(new Date());
        setConnectionError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch position data');
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setConnectionError('Request timeout - please check your connection');
        } else if (error.message.includes('Failed to fetch')) {
          setConnectionError('Network error - please check your internet connection');
        } else {
          setConnectionError(error.message);
        }
      } else {
        setConnectionError('Unknown error occurred');
      }
      
      // Set mock data for demo purposes when there's an error
      setPositions([{
        protocol: 'Demo Mode',
        totalCollateralUSD: 150000,
        totalDebtUSD: 85000,
        healthFactor: 1.76,
        liquidationThreshold: 0.8,
        ltv: 0.65,
        availableBorrowsUSD: 32000
      }]);
      
      setHealthData({
        isAtRisk: false,
        riskLevel: 'safe',
        recommendations: ['Demo mode - connect to see real data']
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh positions when wallet connects
  useEffect(() => {
    if (isConnected && address && isOnline) {
      fetchPositions();
      
      // Set up periodic refresh with error handling
      const interval = setInterval(() => {
        if (isOnline) {
          fetchPositions();
        }
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isConnected, address, isOnline]);

  // Get risk color
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'safe': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'warning': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'danger': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  // Get network name
  const getNetworkName = (chainId: number) => {
    const networks: Record<number, string> = {
      1: 'Ethereum',
      5: 'Goerli',
      11155111: 'Sepolia',
      137: 'Polygon',
      80001: 'Mumbai',
      42161: 'Arbitrum',
      10: 'Optimism',
    };
    return networks[chainId] || `Chain ${chainId}`;
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground">
            Connect your Web3 wallet to view your DeFi positions and risk metrics
          </p>
        </div>
      </div>
    );
  }

  const position = positions[0];
  const netExposure = position ? position.totalCollateralUSD - position.totalDebtUSD : 0;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {!isOnline && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <WifiOff className="w-5 h-5 text-red-500" />
              <div>
                <h4 className="font-semibold text-red-500">No Internet Connection</h4>
                <p className="text-sm text-muted-foreground">
                  Please check your internet connection to fetch real-time data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Error */}
      {connectionError && isOnline && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-500 mb-1">Connection Issue</h4>
                <p className="text-sm text-muted-foreground mb-2">{connectionError}</p>
                <p className="text-xs text-muted-foreground">
                  Showing demo data. Click refresh to try again.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchPositions}
                disabled={isLoading}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Wallet Overview
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-mono text-sm">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Network</p>
              <p className="text-sm font-semibold">{getNetworkName(chainId)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-sm font-semibold">
                {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Update</p>
              <div className="flex items-center gap-2">
                <p className="text-sm">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchPositions}
                  disabled={isLoading || !isOnline}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Alert */}
      {healthData?.isAtRisk && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-500 mb-2">Position at Risk</h4>
                <div className="space-y-1">
                  {healthData.recommendations.map((rec, index) => (
                    <p key={index} className="text-sm text-muted-foreground">• {rec}</p>
                  ))}
                </div>
              </div>
              <Badge className={getRiskColor(healthData.riskLevel)}>
                {healthData.riskLevel.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Position Metrics */}
      {position && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard 
            label="Total Collateral" 
            value={`$${(position.totalCollateralUSD / 1000).toFixed(1)}K`}
            change={2.5} 
            status="positive" 
            subtext={connectionError ? "Demo data" : "USD value"} 
          />
          <MetricCard 
            label="Total Debt" 
            value={`$${(position.totalDebtUSD / 1000).toFixed(1)}K`}
            change={-1.2} 
            status="negative" 
            subtext={connectionError ? "Demo data" : "USD value"} 
          />
          <MetricCard 
            label="Net Exposure" 
            value={`$${(netExposure / 1000).toFixed(1)}K`}
            change={5.8} 
            status="positive" 
            subtext={`${((netExposure / position.totalCollateralUSD) * 100).toFixed(1)}% equity`}
          />
          <MetricCard 
            label="Health Factor" 
            value={position.healthFactor.toFixed(3)}
            badge={
              <Badge className={getRiskColor(healthData?.riskLevel || 'safe')}>
                {healthData?.riskLevel?.toUpperCase() || 'SAFE'}
              </Badge>
            }
            subtext="Min: 1.000" 
          />
          <MetricCard 
            label="LTV Ratio" 
            value={`${(position.ltv * 100).toFixed(1)}%`}
            subtext={`Max: ${(position.liquidationThreshold * 100).toFixed(0)}%`}
          />
        </div>
      )}

      {/* Supported Protocols */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Supported DeFi Protocols
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SUPPORTED_PROTOCOLS.map((protocol) => (
              <div key={protocol.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{protocol.name}</h4>
                  <Badge variant="secondary">{protocol.tvl}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {protocol.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {protocol.chains.map((chain) => (
                    <Badge key={chain} variant="outline" className="text-xs">
                      {getNetworkName(chain)}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* No Position State */}
      {!position && !isLoading && !connectionError && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No DeFi Positions Found</h3>
              <p className="text-muted-foreground mb-4">
                Start using supported DeFi protocols to see your positions here
              </p>
              <Button onClick={fetchPositions} disabled={isLoading || !isOnline}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Positions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}