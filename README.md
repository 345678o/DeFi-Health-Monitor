# LiquidGuard

> **Enterprise-Grade Web3 Risk Intelligence Platform for Decentralized Finance**

A sophisticated blockchain-native financial analytics platform that provides real-time risk monitoring, liquidation protection, and portfolio management for DeFi lending protocols. Built with institutional-grade design principles and integrated with leading Web3 infrastructure.

![LiquidGuard](https://img.shields.io/badge/LiquidGuard-Web3%20DeFi-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)
![Wagmi](https://img.shields.io/badge/Wagmi-1C1B1F?style=for-the-badge)

## 🚀 Web3 Features

### 🔗 **Multi-Chain Support**
- **Ethereum Mainnet**: Full Aave V3, Compound V3, MakerDAO integration
- **Layer 2 Networks**: Polygon, Arbitrum, Optimism support
- **Testnet Support**: Sepolia, Goerli for development and testing
- **Cross-Chain Analytics**: Unified portfolio view across all chains

### 🔐 **Wallet Integration**
- **MetaMask**: Native browser wallet support
- **WalletConnect**: Mobile and hardware wallet compatibility
- **Multi-Wallet**: Support for multiple wallet providers
- **Auto-Reconnect**: Persistent wallet sessions

### 📊 **Real-Time Blockchain Data**
- **Health Factor Tracking**: Continuous monitoring of liquidation risk
- **Portfolio Analytics**: Comprehensive collateral and debt analysis
- **Risk Classification**: Automated risk level assessment (Low/Moderate/High/Critical)
- **Live Market Data**: Real-time price feeds and position updates

### 🛡️ **Liquidation Protection**
- **Auto-Protection Engine**: Automated position management to prevent liquidation
- **Shock Simulation**: Stress testing against market volatility scenarios
- **Alert System**: Proactive notifications for risk threshold breaches
- **Emergency Actions**: Quick position adjustment recommendations

### 💼 **Professional Interface**
- **Bloomberg Terminal Design**: Institutional dark theme with data-dense layouts
- **Multi-Currency Support**: USD ↔ INR conversion with smart formatting
- **Interactive Charts**: Advanced data visualization with Recharts
- **Responsive Design**: Optimized for desktop and mobile trading environments

### 🔗 **Wallet Integration**
- **MetaMask Support**: Seamless Web3 wallet connectivity
- **Transaction Management**: Direct interaction with DeFi protocols
- **Multi-Chain Ready**: Extensible architecture for multiple blockchains
- **Secure Authentication**: Protected routes with wallet-based access control

## 🏗️ Architecture

### **Frontend Stack**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system
- **Charts**: Recharts for financial data visualization
- **Icons**: Lucide React icon library

### **Backend Services**
- **API Routes**: RESTful endpoints for data management
- **Risk Engine**: Core financial calculations and risk metrics
- **Alert System**: Dynamic notification generation
- **Historical Tracking**: Time-series data management
- **Stress Testing**: Market scenario simulation engine

### **Web3 Integration**
- **Wallet Connection**: Ethers.js for Ethereum interaction
- **Smart Contracts**: Ready for DeFi protocol integration
- **Transaction Handling**: Secure transaction management
- **State Management**: React Context for wallet state

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── (protected)/             # Protected routes requiring authentication
│   │   ├── dashboard/           # Main portfolio overview
│   │   ├── analytics/           # Risk analysis and shock simulation
│   │   ├── positions/           # Collateral and debt management
│   │   ├── alerts/              # Risk notifications
│   │   ├── reports/             # Historical data and exports
│   │   ├── risk-engine/         # Risk calculation tools
│   │   └── auto-protection/     # Automated protection settings
│   ├── api/                     # Backend API endpoints
│   └── globals.css              # Global styles and design tokens
├── components/                   # Reusable UI components
│   ├── ui/                      # Base UI components
│   ├── top-bar.tsx              # Navigation header
│   ├── sidebar.tsx              # Navigation sidebar
│   ├── metric-card.tsx          # Financial metric display
│   └── wallet-*.tsx             # Wallet integration components
├── contexts/                     # React Context providers
│   ├── auth-context.tsx         # Authentication state
│   ├── wallet-context.tsx       # Wallet connection state
│   └── currency-context.tsx     # Currency conversion
├── hooks/                        # Custom React hooks
│   ├── useWallet.ts             # Wallet interaction hook
│   └── use-*.ts                 # Utility hooks
├── lib/                          # Business logic and services
│   ├── riskEngine.ts            # Core risk calculations
│   ├── alertsService.ts         # Alert generation and management
│   ├── shockSimulator.ts        # Market stress testing
│   ├── stressTestService.ts     # Comprehensive stress analysis
│   ├── autoProtectionService.ts # Automated protection logic
│   ├── historicalTrackingService.ts # Time-series data
│   ├── currency.ts              # Multi-currency support
│   ├── walletUtils.ts           # Web3 utilities
│   └── apiClient.ts             # API communication layer
└── public/                       # Static assets
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn** or **pnpm**
- **MetaMask** browser extension (for wallet features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/345678o/DeFi-Health-Monitor.git
   cd DeFi-Health-Monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 💡 Usage

### **Dashboard Overview**
- Monitor your total collateral and debt positions
- Track health factor trends with interactive charts
- View real-time risk metrics and safety buffers
- Access quick position management actions

### **Risk Analysis**
- Calculate precise health factors using the Risk Engine
- Run stress tests against various market scenarios
- Simulate liquidation risks with the Shock Simulator
- Set up automated protection thresholds

### **Portfolio Management**
- View detailed position breakdowns by asset
- Monitor collateral utilization rates
- Track historical performance and trends
- Export data for external analysis

### **Alert System**
- Receive proactive risk notifications
- Configure custom alert thresholds
- View alert history and resolution status
- Export alert data for compliance

## 🔧 Configuration

### **Currency Settings**
The platform supports USD and INR with automatic conversion:
- **Exchange Rate**: 1 USD = 83.5 INR (configurable in `lib/currency.ts`)
- **Formatting**: Smart notation with Lakh (L) and Crore (Cr) for INR

### **Risk Parameters**
Key risk thresholds can be configured in `lib/riskEngine.ts`:
- **Liquidation Threshold**: Default 0.8 (80%)
- **High Risk HF**: 1.2
- **Moderate Risk HF**: 1.5
- **Target HF**: 1.5

### **Wallet Configuration**
Web3 settings in `lib/walletUtils.ts`:
- **Supported Networks**: Ethereum Mainnet (extensible)
- **Wallet Providers**: MetaMask (primary)
- **Connection Timeout**: 30 seconds

## 🛠️ API Reference

### **Risk Calculation**
```typescript
POST /api/risk/calculate
{
  "collateralValue": 150000,
  "debtValue": 85000,
  "assetPrice": 3000,
  "liquidationThreshold": 0.8
}
```

### **Shock Simulation**
```typescript
POST /api/shock/simulate
{
  "collateralValue": 150000,
  "debtValue": 85000,
  "liquidationThreshold": 0.8,
  "priceDropPercent": 20
}
```

### **Alert Management**
```typescript
GET /api/alerts
POST /api/alerts
PUT /api/alerts/:id
DELETE /api/alerts/:id
```

## 🎨 Design System

### **Color Palette**
- **Background**: `#0A0E1A` (Deep slate)
- **Panel**: `#0F1419` (Card background)
- **Border**: `#1E293B` (Subtle borders)
- **Primary**: `#3B82F6` (Blue accent)
- **Success**: `#10B981` (Green)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)

### **Typography**
- **Font Family**: Geist Sans (primary), Geist Mono (financial data)
- **Financial Numbers**: Tabular figures for alignment
- **Hierarchy**: Consistent sizing scale (10px - 24px)

### **Components**
- **Panels**: Subtle backgrounds with minimal rounding
- **Buttons**: Clean, professional styling
- **Charts**: Dark theme with institutional colors
- **Tables**: Dense data presentation with clear hierarchy

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Maintain consistent code formatting
- Write comprehensive tests for new features
- Update documentation for API changes
- Follow the established design system

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the excellent React framework
- **Tailwind CSS** for the utility-first CSS framework
- **Recharts** for beautiful data visualization
- **Ethers.js** for Web3 integration
- **Lucide** for the comprehensive icon library

## 📞 Support

For support, questions, or feature requests:
- **GitHub Issues**: [Create an issue](https://github.com/345678o/DeFi-Health-Monitor/issues)
- **Documentation**: Check the `/docs` folder for detailed guides
- **Community**: Join our discussions in GitHub Discussions

---

**Built with ❤️ for the DeFi community**

*Protecting your assets through intelligent risk management*