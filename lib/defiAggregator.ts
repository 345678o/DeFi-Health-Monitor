import { readContract } from '@wagmi/core'
import { config } from './web3Config'
import { formatUnits } from 'viem'

// Protocol interfaces
export interface ProtocolRate {
  protocol: string
  asset: string
  supplyAPY: number
  borrowAPY: number
  totalSupply: number
  totalBorrow: number
  utilizationRate: number
  liquidationThreshold: number
  collateralFactor: number
}

export interface BestRateResult {
  supply: ProtocolRate[]
  borrow: ProtocolRate[]
  bestSupply: ProtocolRate
  bestBorrow: ProtocolRate
}

export interface ProtocolTVL {
  protocol: string
  tvl: number
  change24h: number
  chains: string[]
  topAssets: Array<{
    symbol: string
    tvl: number
    apy: number
  }>
}

// Aave V3 Data Provider ABI
const AAVE_DATA_PROVIDER_ABI = [
  'function getReserveData(address asset) view returns (uint256 availableLiquidity, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)',
  'function getReserveConfigurationData(address asset) view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)',
] as const

// Compound V3 ABI
const COMPOUND_V3_ABI = [
  'function getSupplyRate(uint utilization) view returns (uint64)',
  'function getBorrowRate(uint utilization) view returns (uint64)',
  'function getUtilization() view returns (uint)',
  'function totalSupply() view returns (uint256)',
  'function totalBorrow() view returns (uint256)',
] as const

/**
 * Get rates from Aave V3
 */
export async function getAaveRates(assets: string[]): Promise<ProtocolRate[]> {
  try {
    const rates: ProtocolRate[] = []
    
    for (const asset of assets) {
      try {
        // Get reserve data
        const reserveData = await readContract(config, {
          address: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3' as `0x${string}`, // Aave V3 Data Provider
          abi: AAVE_DATA_PROVIDER_ABI,
          functionName: 'getReserveData',
          args: [asset as `0x${string}`],
        }) as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, number]

        // Get configuration data
        const configData = await readContract(config, {
          address: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3' as `0x${string}`,
          abi: AAVE_DATA_PROVIDER_ABI,
          functionName: 'getReserveConfigurationData',
          args: [asset as `0x${string}`],
        }) as readonly [bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean, boolean, boolean]

        const [
          availableLiquidity,
          totalStableDebt,
          totalVariableDebt,
          liquidityRate,
          variableBorrowRate,
          stableBorrowRate
        ] = reserveData

        const [
          decimals,
          ltv,
          liquidationThreshold
        ] = configData

        const totalSupply = Number(formatUnits(availableLiquidity + totalStableDebt + totalVariableDebt, Number(decimals)))
        const totalBorrow = Number(formatUnits(totalStableDebt + totalVariableDebt, Number(decimals)))
        const utilizationRate = totalSupply > 0 ? (totalBorrow / totalSupply) * 100 : 0

        rates.push({
          protocol: 'Aave V3',
          asset,
          supplyAPY: Number(formatUnits(liquidityRate, 25)), // Ray format (27 decimals) to percentage
          borrowAPY: Number(formatUnits(variableBorrowRate, 25)),
          totalSupply,
          totalBorrow,
          utilizationRate,
          liquidationThreshold: Number(formatUnits(liquidationThreshold, 4)),
          collateralFactor: Number(formatUnits(ltv, 4))
        })
      } catch (error) {
        console.error(`Failed to get Aave rates for ${asset}:`, error)
      }
    }
    
    return rates
  } catch (error) {
    console.error('Failed to get Aave rates:', error)
    return []
  }
}

/**
 * Get rates from Compound V3
 */
export async function getCompoundRates(markets: string[]): Promise<ProtocolRate[]> {
  try {
    const rates: ProtocolRate[] = []
    
    for (const market of markets) {
      try {
        const [utilization, totalSupply, totalBorrow] = await Promise.all([
          readContract(config, {
            address: market as `0x${string}`,
            abi: COMPOUND_V3_ABI,
            functionName: 'getUtilization',
          }) as Promise<bigint>,
          readContract(config, {
            address: market as `0x${string}`,
            abi: COMPOUND_V3_ABI,
            functionName: 'totalSupply',
          }) as Promise<bigint>,
          readContract(config, {
            address: market as `0x${string}`,
            abi: COMPOUND_V3_ABI,
            functionName: 'totalBorrow',
          }) as Promise<bigint>
        ])

        const supplyRate = await readContract(config, {
          address: market as `0x${string}`,
          abi: COMPOUND_V3_ABI,
          functionName: 'getSupplyRate',
          args: [utilization],
        }) as bigint

        const borrowRate = await readContract(config, {
          address: market as `0x${string}`,
          abi: COMPOUND_V3_ABI,
          functionName: 'getBorrowRate',
          args: [utilization],
        }) as bigint

        rates.push({
          protocol: 'Compound V3',
          asset: market,
          supplyAPY: Number(formatUnits(supplyRate, 16)), // Convert to percentage
          borrowAPY: Number(formatUnits(borrowRate, 16)),
          totalSupply: Number(formatUnits(totalSupply, 18)),
          totalBorrow: Number(formatUnits(totalBorrow, 18)),
          utilizationRate: Number(formatUnits(utilization, 16)),
          liquidationThreshold: 0.8, // Default for Compound
          collateralFactor: 0.75
        })
      } catch (error) {
        console.error(`Failed to get Compound rates for ${market}:`, error)
      }
    }
    
    return rates
  } catch (error) {
    console.error('Failed to get Compound rates:', error)
    return []
  }
}

/**
 * Get best rates across all protocols
 */
export async function getBestRates(assets: string[]): Promise<BestRateResult> {
  try {
    // Get rates from all protocols
    const [aaveRates, compoundRates] = await Promise.all([
      getAaveRates(assets),
      getCompoundRates(['0xc3d688B66703497DAA19211EEdff47f25384cdc3']) // Compound V3 USDC market
    ])

    const allRates = [...aaveRates, ...compoundRates]
    
    // Sort by supply APY (highest first)
    const bestSupplyRates = allRates
      .filter(rate => rate.supplyAPY > 0)
      .sort((a, b) => b.supplyAPY - a.supplyAPY)
    
    // Sort by borrow APY (lowest first)
    const bestBorrowRates = allRates
      .filter(rate => rate.borrowAPY > 0)
      .sort((a, b) => a.borrowAPY - b.borrowAPY)

    return {
      supply: bestSupplyRates,
      borrow: bestBorrowRates,
      bestSupply: bestSupplyRates[0] || allRates[0],
      bestBorrow: bestBorrowRates[0] || allRates[0]
    }
  } catch (error) {
    console.error('Failed to get best rates:', error)
    return {
      supply: [],
      borrow: [],
      bestSupply: {} as ProtocolRate,
      bestBorrow: {} as ProtocolRate
    }
  }
}

/**
 * Get protocol TVL data
 */
export async function getProtocolTVL(): Promise<ProtocolTVL[]> {
  try {
    // In a real implementation, this would fetch from DeFiLlama API or similar
    // For now, return mock data
    return [
      {
        protocol: 'Aave V3',
        tvl: 10200000000,
        change24h: 2.5,
        chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'],
        topAssets: [
          { symbol: 'USDC', tvl: 3200000000, apy: 4.2 },
          { symbol: 'WETH', tvl: 2800000000, apy: 3.8 },
          { symbol: 'USDT', tvl: 1900000000, apy: 4.1 }
        ]
      },
      {
        protocol: 'Compound V3',
        tvl: 2800000000,
        change24h: -1.2,
        chains: ['Ethereum', 'Polygon', 'Arbitrum'],
        topAssets: [
          { symbol: 'USDC', tvl: 1800000000, apy: 3.9 },
          { symbol: 'WETH', tvl: 800000000, apy: 3.5 },
          { symbol: 'WBTC', tvl: 200000000, apy: 2.8 }
        ]
      },
      {
        protocol: 'MakerDAO',
        tvl: 5100000000,
        change24h: 0.8,
        chains: ['Ethereum'],
        topAssets: [
          { symbol: 'ETH', tvl: 3200000000, apy: 5.1 },
          { symbol: 'WBTC', tvl: 1200000000, apy: 4.8 },
          { symbol: 'USDC', tvl: 700000000, apy: 3.2 }
        ]
      }
    ]
  } catch (error) {
    console.error('Failed to get protocol TVL:', error)
    return []
  }
}

/**
 * Calculate optimal strategy for yield farming
 */
export async function calculateOptimalStrategy(
  amount: number,
  asset: string,
  riskTolerance: 'low' | 'medium' | 'high'
): Promise<{
  strategy: string
  expectedAPY: number
  riskScore: number
  steps: string[]
  protocols: string[]
}> {
  try {
    const rates = await getBestRates([asset])
    
    // Simple strategy calculation based on risk tolerance
    let strategy: string
    let expectedAPY: number
    let riskScore: number
    let steps: string[]
    let protocols: string[]

    switch (riskTolerance) {
      case 'low':
        strategy = 'Conservative Supply'
        expectedAPY = rates.bestSupply?.supplyAPY || 3.5
        riskScore = 2
        steps = [
          'Supply assets to highest APY protocol',
          'Monitor health factor daily',
          'Set conservative liquidation threshold'
        ]
        protocols = [rates.bestSupply?.protocol || 'Aave V3']
        break
      
      case 'medium':
        strategy = 'Leveraged Yield Farming'
        expectedAPY = (rates.bestSupply?.supplyAPY || 4.0) * 1.5
        riskScore = 5
        steps = [
          'Supply collateral to protocol',
          'Borrow stablecoin at low rate',
          'Re-supply borrowed assets',
          'Monitor liquidation risk'
        ]
        protocols = [rates.bestSupply?.protocol || 'Aave V3', rates.bestBorrow?.protocol || 'Compound V3']
        break
      
      case 'high':
        strategy = 'Multi-Protocol Arbitrage'
        expectedAPY = (rates.bestSupply?.supplyAPY || 5.0) * 2.0
        riskScore = 8
        steps = [
          'Flash loan for capital efficiency',
          'Arbitrage between protocols',
          'Leverage across multiple chains',
          'Active position management'
        ]
        protocols = ['Aave V3', 'Compound V3', 'MakerDAO']
        break
      
      default:
        throw new Error('Invalid risk tolerance')
    }

    return {
      strategy,
      expectedAPY,
      riskScore,
      steps,
      protocols
    }
  } catch (error) {
    console.error('Failed to calculate optimal strategy:', error)
    return {
      strategy: 'Conservative Supply',
      expectedAPY: 3.5,
      riskScore: 2,
      steps: ['Supply assets safely'],
      protocols: ['Aave V3']
    }
  }
}

/**
 * Monitor cross-protocol arbitrage opportunities
 */
export async function findArbitrageOpportunities(): Promise<Array<{
  asset: string
  buyProtocol: string
  sellProtocol: string
  spread: number
  profitPotential: number
  riskLevel: 'low' | 'medium' | 'high'
}>> {
  try {
    // Mock arbitrage opportunities
    return [
      {
        asset: 'USDC',
        buyProtocol: 'Compound V3',
        sellProtocol: 'Aave V3',
        spread: 0.5, // 0.5% spread
        profitPotential: 1200, // $1200 potential profit
        riskLevel: 'low'
      },
      {
        asset: 'WETH',
        buyProtocol: 'Aave V3',
        sellProtocol: 'MakerDAO',
        spread: 1.2,
        profitPotential: 3500,
        riskLevel: 'medium'
      }
    ]
  } catch (error) {
    console.error('Failed to find arbitrage opportunities:', error)
    return []
  }
}