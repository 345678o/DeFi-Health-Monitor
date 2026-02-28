import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, polygon, arbitrum, optimism } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// Project ID for WalletConnect (you'll need to get this from https://cloud.walletconnect.com)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, optimism],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'LiquidGuard',
        description: 'DeFi Risk Management Platform',
        url: 'https://liquidguard.app',
        icons: ['https://liquidguard.app/icon.png']
      }
    }),
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL),
    [optimism.id]: http(process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL),
  },
})

// DeFi Protocol Addresses
export const PROTOCOL_ADDRESSES = {
  // Aave V3 on Mainnet
  AAVE_V3_POOL: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  AAVE_V3_DATA_PROVIDER: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3',
  
  // Compound V3 on Mainnet
  COMPOUND_V3_USDC: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
  COMPOUND_V3_ETH: '0xA17581A9E3356d9A858b789D68B4d866e593aE94',
  
  // MakerDAO
  MAKER_CDP_MANAGER: '0x5ef30b9986345249bc32d8928B7ee64DE9435E39',
  
  // Common ERC20 Tokens
  TOKENS: {
    USDC: '0xA0b86a33E6441b8435b662303c0f479c7e2b6c4e',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  }
}

// Chain-specific RPC URLs
export const RPC_URLS = {
  [mainnet.id]: process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
  [sepolia.id]: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/your-api-key',
  [polygon.id]: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/your-api-key',
  [arbitrum.id]: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb-mainnet.g.alchemy.com/v2/your-api-key',
  [optimism.id]: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://opt-mainnet.g.alchemy.com/v2/your-api-key',
}

// Supported DeFi Protocols
export const SUPPORTED_PROTOCOLS = [
  {
    name: 'Aave V3',
    id: 'aave-v3',
    chains: [mainnet.id, polygon.id, arbitrum.id, optimism.id],
    description: 'Leading decentralized lending protocol',
    tvl: '$10.2B',
    logo: '/protocols/aave.svg'
  },
  {
    name: 'Compound V3',
    id: 'compound-v3',
    chains: [mainnet.id, polygon.id, arbitrum.id],
    description: 'Algorithmic money market protocol',
    tvl: '$2.8B',
    logo: '/protocols/compound.svg'
  },
  {
    name: 'MakerDAO',
    id: 'maker',
    chains: [mainnet.id],
    description: 'Decentralized stablecoin protocol',
    tvl: '$5.1B',
    logo: '/protocols/maker.svg'
  }
]