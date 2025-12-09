# BuyBackBurn V2

A sophisticated smart contract implementation for token buyback and burn mechanisms, designed to support deflationary tokenomics in DeFi projects.

## Features

- **Token Buyback**: Execute buyback operations using ETH or native tokens
- **Automatic Burning**: Tokens are automatically burned after buyback
- **Fee Management**: Configurable buyback fees sent to treasury
- **Access Control**: Owner and authorized executor management
- **Pause Functionality**: Emergency pause/unpause capability
- **Emergency Withdrawals**: Secure withdrawal functions for ETH and tokens
- **Comprehensive Events**: Full transparency with detailed event emissions
- **Security**: Built with OpenZeppelin contracts, reentrancy guards, and pausable features

## Smart Contracts

### BuyBackBurnV2.sol
Main contract implementing the buyback and burn mechanism with:
- Configurable min/max buyback amounts
- Fee-based treasury funding
- Multi-executor authorization
- Comprehensive statistics tracking

### MockToken.sol
Simple ERC20 token for testing purposes.

## Installation

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage
```

## Deployment

### Deploy with existing token
```bash
# Set environment variables
export TOKEN_ADDRESS=<your_token_address>
export TREASURY_WALLET=<treasury_address>
export BUYBACK_FEE_PERCENTAGE=500  # 5%

# Deploy
npm run deploy
```

### Deploy with mock token (for testing)
```bash
npx hardhat run scripts/deploy-with-mock.js --network localhost
```

## Usage

### Initialize Contract
```javascript
const buyBackBurn = await BuyBackBurnV2.deploy(
  tokenAddress,      // ERC20 token to buyback
  treasuryWallet,    // Treasury wallet address
  500                // 5% fee in basis points
);
```

### Execute Buyback
```javascript
// As owner or authorized executor
await buyBackBurn.executeBuyBack(
  expectedTokenAmount,
  { value: ethers.parseEther("1.0") }
);
```

### Configure Settings
```javascript
// Update fee
await buyBackBurn.setBuyBackFee(1000); // 10%

// Set min/max amounts
await buyBackBurn.setMinBuyBackAmount(ethers.parseEther("0.01"));
await buyBackBurn.setMaxBuyBackAmount(ethers.parseEther("50"));

// Authorize executor
await buyBackBurn.setExecutorAuthorization(executorAddress, true);
```

### Get Statistics
```javascript
const stats = await buyBackBurn.getStats();
console.log("Total Buyback Amount:", stats[0]);
console.log("Total Burned Amount:", stats[1]);
console.log("Contract Token Balance:", stats[2]);
console.log("Contract ETH Balance:", stats[3]);
```

## Contract Parameters

- **minBuyBackAmount**: Minimum ETH amount for buyback (default: 0.001 ETH)
- **maxBuyBackAmount**: Maximum ETH amount for buyback (default: 100 ETH)
- **buyBackFeePercentage**: Fee percentage in basis points (100 = 1%)
- **treasuryWallet**: Address receiving buyback fees

## Security Features

1. **ReentrancyGuard**: Prevents reentrancy attacks
2. **Pausable**: Emergency stop functionality
3. **Ownable**: Secure ownership management
4. **Access Control**: Multi-level authorization system
5. **Input Validation**: Comprehensive parameter checks

## Events

```solidity
event BuyBackExecuted(address indexed executor, uint256 amount, uint256 tokensBought);
event TokensBurned(uint256 amount);
event BuyBackFeeUpdated(uint256 oldFee, uint256 newFee);
event TreasuryWalletUpdated(address indexed oldWallet, address indexed newWallet);
event ExecutorAuthorized(address indexed executor, bool status);
// ... and more
```

## Development

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node  # In separate terminal
npx hardhat run scripts/deploy-with-mock.js --network localhost

# Clean build artifacts
npx hardhat clean
```

## License

MIT License

## Author

Kevin Yunai

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
