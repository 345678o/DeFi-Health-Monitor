import { NextRequest, NextResponse } from 'next/server';

// Mock data for when blockchain calls fail
const MOCK_POSITION_DATA = {
  protocol: 'Demo Mode',
  totalCollateralUSD: 150000,
  totalDebtUSD: 85000,
  healthFactor: 1.76,
  liquidationThreshold: 0.8,
  ltv: 0.65,
  availableBorrowsUSD: 32000,
  assets: [
    {
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000',
      balance: 50,
      balanceUSD: 150000,
      isCollateral: true,
      isDebt: false,
      apy: 3.2,
      liquidationThreshold: 0.8
    }
  ]
};

const MOCK_HEALTH_DATA = {
  isAtRisk: false,
  riskLevel: 'safe' as const,
  recommendations: [
    'Demo mode active - connect wallet for real data',
    'Your position appears healthy',
    'Consider diversifying across protocols'
  ]
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const protocol = searchParams.get('protocol') || 'aave';

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // For now, return mock data since blockchain calls might fail
    // In production, you would uncomment the blockchain service calls below
    
    /*
    let positionData = null;
    let tokenBalances = [];
    let healthData = null;

    try {
      // Fetch position data based on protocol
      switch (protocol.toLowerCase()) {
        case 'aave':
          positionData = await fetchAavePosition(address);
          break;
        default:
          return NextResponse.json(
            { error: 'Unsupported protocol' },
            { status: 400 }
          );
      }

      // Fetch token balances
      const tokenAddresses = Object.values(PROTOCOL_ADDRESSES.TOKENS);
      tokenBalances = await fetchTokenBalances(address, tokenAddresses);

      // Monitor position health
      healthData = await monitorPositionHealth(address);

    } catch (blockchainError) {
      console.error('Blockchain query error:', blockchainError);
      // Fall back to mock data
      positionData = MOCK_POSITION_DATA;
      healthData = MOCK_HEALTH_DATA;
    }
    */

    // Return mock data for demo
    const response = {
      success: true,
      data: {
        address,
        protocol,
        position: MOCK_POSITION_DATA,
        tokenBalances: MOCK_POSITION_DATA.assets,
        health: MOCK_HEALTH_DATA,
        timestamp: new Date().toISOString(),
        isDemo: true,
        message: 'Demo data - blockchain integration available in production'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Positions API error:', error);
    
    // Return mock data even on error for better UX
    return NextResponse.json({
      success: true,
      data: {
        address: 'demo',
        protocol: 'demo',
        position: MOCK_POSITION_DATA,
        tokenBalances: MOCK_POSITION_DATA.assets,
        health: MOCK_HEALTH_DATA,
        timestamp: new Date().toISOString(),
        isDemo: true,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Showing demo data due to connection issues'
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, action, protocol = 'aave' } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'refresh':
        // Return refreshed mock data
        return NextResponse.json({
          success: true,
          data: MOCK_POSITION_DATA,
          timestamp: new Date().toISOString(),
          isDemo: true,
          message: 'Demo data refreshed'
        });

      case 'monitor':
        // Return monitoring status
        return NextResponse.json({
          success: true,
          message: 'Monitoring enabled (demo mode)',
          data: MOCK_HEALTH_DATA,
          timestamp: new Date().toISOString(),
          isDemo: true
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Positions POST API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}