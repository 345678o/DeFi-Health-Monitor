import { ethers } from 'ethers'
import { writeContract, simulateContract, waitForTransactionReceipt } from '@wagmi/core'
import { config, PROTOCOL_ADDRESSES } from './web3Config'
import { parseUnits, formatUnits } from 'viem'

// Aave V3 Pool ABI for write operations
const AAVE_POOL_WRITE_ABI = [
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
  'function withdraw(address asset, uint256 amount, address to)',
  'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
  'function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf)',
  'function setUserUseReserveAsCollateral(address asset, bool useAsCollateral)',
] as const

// ERC20 ABI for approvals and transfers
const ERC20_WRITE_ABI = [
  'function approve(address spender, uint256 amount)',
  'function transfer(address to, uint256 amount)',
  'function transferFrom(address from, address to, uint256 amount)',
] as const

// LiquidGuard Smart Contract ABI (our custom protection contract)
const LIQUIDGUARD_ABI = [
  'function enableAutoProtection(address user, uint256 healthFactorThreshold, uint256 maxSlippage)',
  'function disableAutoProtection(address user)',
  'function executeProtection(address user, uint256 amount, address asset)',
  'function getProtectionStatus(address user) view returns (bool enabled, uint256 threshold, uint256 lastExecution)',
  'function setEmergencyContacts(address[] calldata contacts)',
  'function triggerEmergencyMode(address user)',
] as const

export interface TransactionResult {
  success: boolean
  txHash?: string
  error?: string
  gasUsed?: bigint
  effectiveGasPrice?: bigint
}

export interface ProtectionSettings {
  enabled: boolean
  healthFactorThreshold: number
  maxSlippage: number
  emergencyContacts: string[]
  autoRepayEnabled: boolean
  autoSupplyEnabled: boolean
}

/**
 * Supply assets to Aave V3 protocol
 */
export async function supplyToAave(
  asset: string,
  amount: string,
  userAddress: string
): Promise<TransactionResult> {
  try {
    // First approve the token
    const approveResult = await approveToken(asset, PROTOCOL_ADDRESSES.AAVE_V3_POOL, amount)
    if (!approveResult.success) {
      return approveResult
    }

    // Simulate the transaction first
    const { request } = await simulateContract(config, {
      address: PROTOCOL_ADDRESSES.AAVE_V3_POOL as `0x${string}`,
      abi: AAVE_POOL_WRITE_ABI,
      functionName: 'supply',
      args: [
        asset as `0x${string}`,
        parseUnits(amount, 18),
        userAddress as `0x${string}`,
        0 // referral code
      ],
    })

    // Execute the transaction
    const txHash = await writeContract(config, request)
    
    // Wait for confirmation
    const receipt = await waitForTransactionReceipt(config, { hash: txHash })

    return {
      success: true,
      txHash,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
    }
  } catch (error) {
    console.error('Supply to Aave failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Withdraw assets from Aave V3 protocol
 */
export async function withdrawFromAave(
  asset: string,
  amount: string,
  userAddress: string
): Promise<TransactionResult> {
  try {
    const { request } = await simulateContract(config, {
      address: PROTOCOL_ADDRESSES.AAVE_V3_POOL as `0x${string}`,
      abi: AAVE_POOL_WRITE_ABI,
      functionName: 'withdraw',
      args: [
        asset as `0x${string}`,
        parseUnits(amount, 18),
        userAddress as `0x${string}`
      ],
    })

    const txHash = await writeContract(config, request)
    const receipt = await waitForTransactionReceipt(config, { hash: txHash })

    return {
      success: true,
      txHash,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
    }
  } catch (error) {
    console.error('Withdraw from Aave failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Borrow assets from Aave V3 protocol
 */
export async function borrowFromAave(
  asset: string,
  amount: string,
  userAddress: string,
  interestRateMode: 1 | 2 = 2 // 1 = stable, 2 = variable
): Promise<TransactionResult> {
  try {
    const { request } = await simulateContract(config, {
      address: PROTOCOL_ADDRESSES.AAVE_V3_POOL as `0x${string}`,
      abi: AAVE_POOL_WRITE_ABI,
      functionName: 'borrow',
      args: [
        asset as `0x${string}`,
        parseUnits(amount, 18),
        interestRateMode,
        0, // referral code
        userAddress as `0x${string}`
      ],
    })

    const txHash = await writeContract(config, request)
    const receipt = await waitForTransactionReceipt(config, { hash: txHash })

    return {
      success: true,
      txHash,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
    }
  } catch (error) {
    console.error('Borrow from Aave failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Repay debt to Aave V3 protocol
 */
export async function repayToAave(
  asset: string,
  amount: string,
  userAddress: string,
  interestRateMode: 1 | 2 = 2
): Promise<TransactionResult> {
  try {
    // First approve the token
    const approveResult = await approveToken(asset, PROTOCOL_ADDRESSES.AAVE_V3_POOL, amount)
    if (!approveResult.success) {
      return approveResult
    }

    const { request } = await simulateContract(config, {
      address: PROTOCOL_ADDRESSES.AAVE_V3_POOL as `0x${string}`,
      abi: AAVE_POOL_WRITE_ABI,
      functionName: 'repay',
      args: [
        asset as `0x${string}`,
        parseUnits(amount, 18),
        interestRateMode,
        userAddress as `0x${string}`
      ],
    })

    const txHash = await writeContract(config, request)
    const receipt = await waitForTransactionReceipt(config, { hash: txHash })

    return {
      success: true,
      txHash,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
    }
  } catch (error) {
    console.error('Repay to Aave failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Approve token spending
 */
export async function approveToken(
  tokenAddress: string,
  spenderAddress: string,
  amount: string
): Promise<TransactionResult> {
  try {
    const { request } = await simulateContract(config, {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_WRITE_ABI,
      functionName: 'approve',
      args: [
        spenderAddress as `0x${string}`,
        parseUnits(amount, 18)
      ],
    })

    const txHash = await writeContract(config, request)
    const receipt = await waitForTransactionReceipt(config, { hash: txHash })

    return {
      success: true,
      txHash,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
    }
  } catch (error) {
    console.error('Token approval failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Enable LiquidGuard auto-protection
 */
export async function enableAutoProtection(
  userAddress: string,
  healthFactorThreshold: number = 1.5,
  maxSlippage: number = 0.05 // 5%
): Promise<TransactionResult> {
  try {
    // This would be our custom LiquidGuard smart contract
    const liquidGuardAddress = process.env.NEXT_PUBLIC_LIQUIDGUARD_CONTRACT || '0x0000000000000000000000000000000000000000'
    
    const { request } = await simulateContract(config, {
      address: liquidGuardAddress as `0x${string}`,
      abi: LIQUIDGUARD_ABI,
      functionName: 'enableAutoProtection',
      args: [
        userAddress as `0x${string}`,
        parseUnits(healthFactorThreshold.toString(), 18),
        parseUnits(maxSlippage.toString(), 18)
      ],
    })

    const txHash = await writeContract(config, request)
    const receipt = await waitForTransactionReceipt(config, { hash: txHash })

    return {
      success: true,
      txHash,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
    }
  } catch (error) {
    console.error('Enable auto-protection failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Execute emergency protection
 */
export async function executeEmergencyProtection(
  userAddress: string,
  amount: string,
  asset: string
): Promise<TransactionResult> {
  try {
    const liquidGuardAddress = process.env.NEXT_PUBLIC_LIQUIDGUARD_CONTRACT || '0x0000000000000000000000000000000000000000'
    
    const { request } = await simulateContract(config, {
      address: liquidGuardAddress as `0x${string}`,
      abi: LIQUIDGUARD_ABI,
      functionName: 'executeProtection',
      args: [
        userAddress as `0x${string}`,
        parseUnits(amount, 18),
        asset as `0x${string}`
      ],
    })

    const txHash = await writeContract(config, request)
    const receipt = await waitForTransactionReceipt(config, { hash: txHash })

    return {
      success: true,
      txHash,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
    }
  } catch (error) {
    console.error('Emergency protection failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Flash loan for position management
 */
export async function executeFlashLoan(
  asset: string,
  amount: string,
  params: string
): Promise<TransactionResult> {
  try {
    // Flash loan implementation would go here
    // This is a complex operation that requires a flash loan receiver contract
    
    console.log(`Flash loan requested: ${amount} ${asset}`)
    
    // Mock implementation for now
    return {
      success: true,
      txHash: '0x' + Math.random().toString(16).substr(2, 64)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Flash loan failed'
    }
  }
}

/**
 * Batch multiple transactions
 */
export async function batchTransactions(
  transactions: Array<{
    target: string
    data: string
    value?: bigint
  }>
): Promise<TransactionResult> {
  try {
    // This would use a multicall contract or similar batching mechanism
    console.log(`Batching ${transactions.length} transactions`)
    
    // Mock implementation
    return {
      success: true,
      txHash: '0x' + Math.random().toString(16).substr(2, 64)
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Batch transaction failed'
    }
  }
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
  contractAddress: string,
  abi: any,
  functionName: string,
  args: any[]
): Promise<{ gasEstimate: bigint; gasPrice: bigint } | null> {
  try {
    // Gas estimation logic would go here
    // This is a simplified mock implementation
    
    return {
      gasEstimate: BigInt(200000), // 200k gas
      gasPrice: BigInt(20000000000) // 20 gwei
    }
  } catch (error) {
    console.error('Gas estimation failed:', error)
    return null
  }
}