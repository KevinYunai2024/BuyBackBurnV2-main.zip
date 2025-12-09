# BuyBackBurn V2 API Documentation

## Contract: BuyBackBurnV2

### State Variables

#### Public Variables

```solidity
IERC20 public token
```
The ERC20 token contract to be bought back and burned.

```solidity
uint256 public totalBuyBackAmount
```
Cumulative amount of ETH used for buybacks.

```solidity
uint256 public totalBurnedAmount
```
Cumulative amount of tokens burned.

```solidity
uint256 public buyBackFeePercentage
```
Fee percentage charged on buybacks (in basis points, where 10000 = 100%).

```solidity
address public treasuryWallet
```
Address receiving buyback fees.

```solidity
uint256 public minBuyBackAmount
```
Minimum ETH amount required for buyback operations.

```solidity
uint256 public maxBuyBackAmount
```
Maximum ETH amount allowed for buyback operations.

```solidity
mapping(address => bool) public authorizedExecutors
```
Mapping of addresses authorized to execute buybacks.

---

## Functions

### Constructor

```solidity
constructor(
    address _token,
    address _treasuryWallet,
    uint256 _buyBackFeePercentage
)
```

**Parameters:**
- `_token`: Address of the ERC20 token to buyback
- `_treasuryWallet`: Address to receive fees
- `_buyBackFeePercentage`: Initial fee percentage (0-10000)

**Requirements:**
- Token address must not be zero
- Treasury address must not be zero
- Fee must not exceed 10000 (100%)

---

### Buyback Functions

#### executeBuyBack

```solidity
function executeBuyBack(uint256 expectedTokenAmount) external payable onlyAuthorized nonReentrant whenNotPaused
```

Execute a buyback operation by sending ETH to the contract.

**Parameters:**
- `expectedTokenAmount`: Minimum tokens expected to receive from buyback

**Requirements:**
- Caller must be authorized (owner or authorized executor)
- Contract must not be paused
- msg.value must be >= minBuyBackAmount
- msg.value must be <= maxBuyBackAmount
- expectedTokenAmount must be > 0

**Emits:**
- `BuyBackExecuted(executor, amount, tokensBought)`
- `TokensBurned(amount)`

**Example:**
```javascript
await buyBackBurn.executeBuyBack(
    ethers.parseEther("100"),
    { value: ethers.parseEther("1.0") }
);
```

---

### Burn Functions

#### burnTokens

```solidity
function burnTokens(uint256 amount) external onlyAuthorized nonReentrant
```

Manually burn tokens held by the contract.

**Parameters:**
- `amount`: Number of tokens to burn

**Requirements:**
- Caller must be authorized
- Amount must be > 0
- Contract must have sufficient token balance

**Emits:**
- `TokensBurned(amount)`

**Example:**
```javascript
await buyBackBurn.burnTokens(ethers.parseEther("100"));
```

---

### Admin Functions

#### setBuyBackFee

```solidity
function setBuyBackFee(uint256 newFeePercentage) external onlyOwner
```

Update the buyback fee percentage.

**Parameters:**
- `newFeePercentage`: New fee in basis points (0-10000)

**Requirements:**
- Caller must be owner
- Fee must not exceed 10000

**Emits:**
- `BuyBackFeeUpdated(oldFee, newFee)`

---

#### setTreasuryWallet

```solidity
function setTreasuryWallet(address newTreasuryWallet) external onlyOwner
```

Update the treasury wallet address.

**Parameters:**
- `newTreasuryWallet`: New treasury address

**Requirements:**
- Caller must be owner
- Address must not be zero

**Emits:**
- `TreasuryWalletUpdated(oldWallet, newWallet)`

---

#### setMinBuyBackAmount

```solidity
function setMinBuyBackAmount(uint256 amount) external onlyOwner
```

Set the minimum ETH amount for buybacks.

**Parameters:**
- `amount`: New minimum amount in wei

**Emits:**
- `MinBuyBackAmountUpdated(oldAmount, amount)`

---

#### setMaxBuyBackAmount

```solidity
function setMaxBuyBackAmount(uint256 amount) external onlyOwner
```

Set the maximum ETH amount for buybacks.

**Parameters:**
- `amount`: New maximum amount in wei

**Requirements:**
- Amount must be >= minBuyBackAmount

**Emits:**
- `MaxBuyBackAmountUpdated(oldAmount, amount)`

---

#### setExecutorAuthorization

```solidity
function setExecutorAuthorization(address executor, bool status) external onlyOwner
```

Authorize or revoke an executor.

**Parameters:**
- `executor`: Address to authorize/revoke
- `status`: true to authorize, false to revoke

**Requirements:**
- Caller must be owner
- Executor address must not be zero

**Emits:**
- `ExecutorAuthorized(executor, status)`

---

### Pause Functions

#### pause

```solidity
function pause() external onlyOwner
```

Pause contract operations (emergency stop).

**Requirements:**
- Caller must be owner
- Contract must not already be paused

---

#### unpause

```solidity
function unpause() external onlyOwner
```

Resume contract operations.

**Requirements:**
- Caller must be owner
- Contract must be paused

---

### Emergency Functions

#### emergencyWithdrawETH

```solidity
function emergencyWithdrawETH() external onlyOwner
```

Withdraw all ETH from the contract to owner.

**Requirements:**
- Caller must be owner
- Contract must have ETH balance > 0

**Emits:**
- `EmergencyWithdraw(address(0), amount)`

---

#### emergencyWithdrawToken

```solidity
function emergencyWithdrawToken(address tokenAddress) external onlyOwner
```

Withdraw all tokens of specified type to owner.

**Parameters:**
- `tokenAddress`: Address of token to withdraw

**Requirements:**
- Caller must be owner
- Token address must not be zero
- Contract must have token balance > 0

**Emits:**
- `EmergencyWithdraw(tokenAddress, amount)`

---

### View Functions

#### getStats

```solidity
function getStats() external view returns (
    uint256 _totalBuyBackAmount,
    uint256 _totalBurnedAmount,
    uint256 _contractTokenBalance,
    uint256 _contractETHBalance
)
```

Get comprehensive contract statistics.

**Returns:**
- `_totalBuyBackAmount`: Total ETH used for buybacks
- `_totalBurnedAmount`: Total tokens burned
- `_contractTokenBalance`: Current token balance
- `_contractETHBalance`: Current ETH balance

**Example:**
```javascript
const [totalBuyback, totalBurned, tokenBalance, ethBalance] = 
    await buyBackBurn.getStats();
console.log("Total Buyback:", ethers.formatEther(totalBuyback));
console.log("Total Burned:", ethers.formatEther(totalBurned));
```

---

## Events

### BuyBackExecuted

```solidity
event BuyBackExecuted(address indexed executor, uint256 amount, uint256 tokensBought)
```

Emitted when a buyback is executed.

---

### TokensBurned

```solidity
event TokensBurned(uint256 amount)
```

Emitted when tokens are burned.

---

### BuyBackFeeUpdated

```solidity
event BuyBackFeeUpdated(uint256 oldFee, uint256 newFee)
```

Emitted when buyback fee is updated.

---

### TreasuryWalletUpdated

```solidity
event TreasuryWalletUpdated(address indexed oldWallet, address indexed newWallet)
```

Emitted when treasury wallet is updated.

---

### MinBuyBackAmountUpdated

```solidity
event MinBuyBackAmountUpdated(uint256 oldAmount, uint256 newAmount)
```

Emitted when minimum buyback amount is updated.

---

### MaxBuyBackAmountUpdated

```solidity
event MaxBuyBackAmountUpdated(uint256 oldAmount, uint256 newAmount)
```

Emitted when maximum buyback amount is updated.

---

### ExecutorAuthorized

```solidity
event ExecutorAuthorized(address indexed executor, bool status)
```

Emitted when an executor is authorized or revoked.

---

### EmergencyWithdraw

```solidity
event EmergencyWithdraw(address indexed token, uint256 amount)
```

Emitted when emergency withdrawal is performed.

---

## Error Codes

Common revert messages:
- `"Not authorized"`: Caller is not owner or authorized executor
- `"Amount below minimum"`: Buyback amount < minBuyBackAmount
- `"Amount exceeds maximum"`: Buyback amount > maxBuyBackAmount
- `"Expected amount must be positive"`: expectedTokenAmount is 0
- `"Fee transfer failed"`: Treasury fee transfer failed
- `"Insufficient token balance"`: Not enough tokens to burn
- `"Amount must be positive"`: Burn amount is 0
- `"Fee exceeds 100%"`: Fee percentage > 10000
- `"Invalid address"`: Address is zero
- `"Max must be >= min"`: Max amount less than min amount
- `"No ETH to withdraw"`: Emergency withdraw on empty balance
- `"No tokens to withdraw"`: Emergency withdraw on empty balance
