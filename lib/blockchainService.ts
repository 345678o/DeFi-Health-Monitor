import { ethers } from 'ethers'
import { readContract, readContracts } from '@wagmi/core'
import { config, PROTOCOL_ADDRESSES } from './web3Config'
import { formatUnits, parseUnits } from 'viem'

// Aave V3 Pool ABI (simplified)
const AAVE_POOL_ABI = [
  'function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
  'function getReserveData(address asset) external view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))',
] as const

// ERC20 ABI (simplified)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
] as const

export interface UserPosition {
  protocol: string
  totalCollateralUSD: number
  totalDebtUSD: number
  healthFactor: number
  liquidationThreshold: number
  ltv: number
  availableBorrowsUSD: number
  assets: PositionAsset[]
}

export interface PositionAsset {
  symbol: string
  address: string
  balance: number
  balanceUSD: number
  isCollateral: boolean
  isDebt: boolean
  apy: number
  liquidationThreshold: number
}

export interface TokenPrice {
  address: string
  symbol: string
  price: number
  change24h: number
  marketCap: number
}

/**
 * Fetch user's DeFi positions from Aave V3
 */
export async function fetchAavePosition(userAddress: string): Promise<UserPosition | null> {
  try {
    const accountData = await readContract(config, {
      address: PROTOCOL_ADDRESSES.AAVE_V3_POOL as `0x${string}`,
      abi: AAVE_POOL_ABI,
      functionName: 'getUserAccountData',
      args: [userAddress as `0x${string}`],
    }) as readonly [bigint, bigint, bigint, bigint, bigint, bigint]

    if (!accountData || !Array.isArray(accountData)) return null

    const [
      totalCollateralBase,
      totalDebtBase,
      availableBorrowsBase,
      currentLiquidationThreshold,
      ltv,
      healthFactor
    ] = accountData

    return {
      protocol: 'Aave V3',
      totalCollateralUSD: parseFloat(formatUnits(totalCollateralBase, 8)),
      totalDebtUSD: parseFloat(formatUnits(totalDebtBase, 8)),
      healthFactor: parseFloat(formatUnits(healthFactor, 18)),
      liquidationThreshold: parseFloat(formatUnits(currentLiquidationThreshold, 4)),
      ltv: parseFloat(formatUnits(ltv, 4)),
      availableBorrowsUSD: parseFloat(formatUnits(availableBorrowsBase, 8)),
      assets: [] // Will be populated by fetchUserAssets
    }
  } catch (error) {
    console.error('Error fetching Aave position:', error)
    return null
  }
}

/**
 * Fetch token balances for a user
 */
export async function fetchTokenBalances(
  userAddress: string, 
  tokenAddresses: string[]
): Promise<PositionAsset[]> {
  try {
    const contracts = tokenAddresses.flatMap(address => [
      {
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      },
      {
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol',
        args: [],
      },
      {
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
        args: [],
      }
    ]) as any

    const results = await readContracts(config, { contracts })
    
    const assets: PositionAsset[] = []
    
    for (let i = 0; i < tokenAddresses.length; i++) {
      const balanceResult = results[i * 3]
      const symbolResult = results[i * 3 + 1]
      const decimalsResult = results[i * 3 + 2]
      
      if (balanceResult.status === 'success' && 
          symbolResult.status === 'success' && 
          decimalsResult.status === 'success') {
        
        const balance = parseFloat(formatUnits(balanceResult.result as bigint, decimalsResult.result as number))
        
        if (balance > 0) {
          assets.push({
            symbol: symbolResult.result as string,
            address: tokenAddresses[i],
            balance,
            balanceUSD: balance * await getTokenPrice(tokenAddresses[i]), // Mock price for now
            isCollateral: false,
            isDebt: false,
            apy: 0,
            liquidationThreshold: 0.8
          })
        }
      }
    }
    
    return assets
  } catch (error) {
    console.error('Error fetching token balances:', error)
    return []
  }
}

/**
 * Get token price (mock implementation - in production use Chainlink, CoinGecko, etc.)
 */
export async function getTokenPrice(tokenAddress: string): Promise<number> {
  // Mock prices for demo - replace with real price feeds
  const mockPrices: Record<string, number> = {
    [PROTOCOL_ADDRESSES.TOKENS.USDC]: 1.00,
    [PROTOCOL_ADDRESSES.TOKENS.USDT]: 1.00,
    [PROTOCOL_ADDRESSES.TOKENS.DAI]: 1.00,
    [PROTOCOL_ADDRESSES.TOKENS.WETH]: 3000,
    [PROTOCOL_ADDRESSES.TOKENS.WBTC]: 45000,
  }
  
  return mockPrices[tokenAddress] || 1
}

/**
 * Calculate liquidation price for a position
 */
export function calculateLiquidationPrice(
  collateralAmount: number,
  collateralPrice: number,
  debtAmount: number,
  liquidationThreshold: number
): number {
  // Liquidation occurs when: (collateralAmount * newPrice * liquidationThreshold) = debtAmount
  // Solving for newPrice: newPrice = debtAmount / (collateralAmount * liquidationThreshold)
  
  if (collateralAmount === 0 || liquidationThreshold === 0) return 0
  
  return debtAmount / (collateralAmount * liquidationThreshold)
}

/**
 * Monitor position health and trigger alerts
 */
export async function monitorPositionHealth(userAddress: string): Promise<{
  isAtRisk: boolean
  riskLevel: 'safe' | 'warning' | 'danger' | 'critical'
  recommendations: string[]
}> {
  const position = await fetchAavePosition(userAddress)
  
  if (!position) {
    return {
      isAtRisk: false,
      riskLevel: 'safe',
      recommendations: []
    }
  }
  
  const { healthFactor } = position
  
  let riskLevel: 'safe' | 'warning' | 'danger' | 'critical'
  let recommendations: string[] = []
  
  if (healthFactor >= 2.0) {
    riskLevel = 'safe'
    recommendations = ['Your position is healthy', 'Consider increasing your position size']
  } else if (healthFactor >= 1.5) {
    riskLevel = 'warning'
    recommendations = ['Monitor your position closely', 'Consider adding more collateral']
  } else if (healthFactor >= 1.1) {
    riskLevel = 'danger'
    recommendations = ['Add collateral immediately', 'Consider reducing debt', 'Enable auto-protection']
  } else {
    riskLevel = 'critical'
    recommendations = ['URGENT: Add collateral now', 'Liquidation imminent', 'Reduce debt immediately']
  }
  
  return {
    isAtRisk: healthFactor < 1.5,
    riskLevel,
    recommendations
  }
}

/**
 * Execute emergency protection (add collateral or repay debt)
 */
export async function executeEmergencyProtection(
  userAddress: string,
  action: 'addCollateral' | 'repayDebt',
  amount: string,
  tokenAddress: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // This would integrate with the user's wallet to execute transactions
    // For now, return a mock response
    
    console.log(`Executing ${action} for ${amount} tokens at ${tokenAddress}`)
    
    // In a real implementation, you would:
    // 1. Prepare the transaction
    // 2. Request user approval
    // 3. Execute the transaction
    // 4. Monitor for confirmation
    
    return {
      success: true,
      txHash: '0x' + Math.random().toString(16).substr(2, 64)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get real-time DeFi protocol data
 */
export async function getProtocolData() {
  // Mock data - replace with real protocol APIs
  return {
    aave: {
      tvl: 10200000000,
      totalBorrowed: 6800000000,
      utilizationRate: 66.7,
      averageAPY: 4.2
    },
    compound: {
      tvl: 2800000000,
      totalBorrowed: 1900000000,
      utilizationRate: 67.9,
      averageAPY: 3.8
    },
    maker: {
      tvl: 5100000000,
      totalBorrowed: 4200000000,
      utilizationRate: 82.4,
      averageAPY: 5.1
    }
  }
}