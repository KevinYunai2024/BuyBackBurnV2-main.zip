// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BuyBackBurnV2
 * @dev Enhanced token buyback and burn mechanism for deflationary tokenomics
 */
contract BuyBackBurnV2 is Ownable, ReentrancyGuard, Pausable {
    IERC20 public token;
    
    uint256 public totalBuyBackAmount;
    uint256 public totalBurnedAmount;
    uint256 public buyBackFeePercentage;
    uint256 private constant BASIS_POINTS = 10000;
    address private constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    address public treasuryWallet;
    uint256 public minBuyBackAmount;
    uint256 public maxBuyBackAmount;
    
    mapping(address => bool) public authorizedExecutors;
    
    event BuyBackExecuted(address indexed executor, uint256 amount, uint256 tokensBought);
    event TokensBurned(uint256 amount);
    event BuyBackFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event MinBuyBackAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event MaxBuyBackAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event ExecutorAuthorized(address indexed executor, bool status);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    
    modifier onlyAuthorized() {
        require(authorizedExecutors[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    /**
     * @dev Constructor to initialize the BuyBackBurn contract
     * @param _token Address of the token to be bought back and burned
     * @param _treasuryWallet Address of the treasury wallet
     * @param _buyBackFeePercentage Fee percentage for buyback operations (in basis points)
     */
    constructor(
        address _token,
        address _treasuryWallet,
        uint256 _buyBackFeePercentage
    ) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        require(_treasuryWallet != address(0), "Invalid treasury address");
        require(_buyBackFeePercentage <= BASIS_POINTS, "Fee exceeds 100%");
        
        token = IERC20(_token);
        treasuryWallet = _treasuryWallet;
        buyBackFeePercentage = _buyBackFeePercentage;
        minBuyBackAmount = 0.001 ether;
        maxBuyBackAmount = 100 ether;
        
        authorizedExecutors[msg.sender] = true;
    }
    
    /**
     * @dev Execute buyback operation - receives ETH and simulates buying tokens
     * @param expectedTokenAmount Minimum amount of tokens expected to receive
     */
    function executeBuyBack(uint256 expectedTokenAmount) 
        external 
        payable 
        onlyAuthorized 
        nonReentrant 
        whenNotPaused 
    {
        require(msg.value >= minBuyBackAmount, "Amount below minimum");
        require(msg.value <= maxBuyBackAmount, "Amount exceeds maximum");
        require(expectedTokenAmount > 0, "Expected amount must be positive");
        
        uint256 feeAmount = (msg.value * buyBackFeePercentage) / BASIS_POINTS;
        uint256 buyBackAmount = msg.value - feeAmount;
        
        // Transfer fee to treasury
        if (feeAmount > 0) {
            (bool feeSent, ) = treasuryWallet.call{value: feeAmount}("");
            require(feeSent, "Fee transfer failed");
        }
        
        // TODO: Production Implementation
        // In a production environment, integrate with DEX routers (e.g., Uniswap V2/V3, SushiSwap)
        // to perform actual token buybacks from the market. Example:
        // IUniswapV2Router02 router = IUniswapV2Router02(ROUTER_ADDRESS);
        // router.swapExactETHForTokens{value: buyBackAmount}(...)
        // For this version, we simulate the buyback by assuming tokens are received
        uint256 tokensBought = expectedTokenAmount;
        
        totalBuyBackAmount += buyBackAmount;
        
        emit BuyBackExecuted(msg.sender, buyBackAmount, tokensBought);
        
        // Automatically burn the bought tokens
        _burnTokens(tokensBought);
    }
    
    /**
     * @dev Burn tokens held by this contract
     * @param amount Amount of tokens to burn
     */
    function burnTokens(uint256 amount) external onlyAuthorized nonReentrant {
        _burnTokens(amount);
    }
    
    /**
     * @dev Internal function to burn tokens
     * @param amount Amount of tokens to burn
     */
    function _burnTokens(uint256 amount) internal {
        require(amount > 0, "Amount must be positive");
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient token balance");
        
        // Burn tokens by sending to dead address
        // This is a commonly accepted burn address that works with most ERC20 implementations
        // as many tokens explicitly prevent transfers to address(0)
        require(token.transfer(BURN_ADDRESS, amount), "Burn transfer failed");
        
        totalBurnedAmount += amount;
        emit TokensBurned(amount);
    }
    
    /**
     * @dev Update buyback fee percentage
     * @param newFeePercentage New fee percentage (in basis points)
     */
    function setBuyBackFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= BASIS_POINTS, "Fee exceeds 100%");
        uint256 oldFee = buyBackFeePercentage;
        buyBackFeePercentage = newFeePercentage;
        emit BuyBackFeeUpdated(oldFee, newFeePercentage);
    }
    
    /**
     * @dev Update treasury wallet address
     * @param newTreasuryWallet New treasury wallet address
     */
    function setTreasuryWallet(address newTreasuryWallet) external onlyOwner {
        require(newTreasuryWallet != address(0), "Invalid address");
        address oldWallet = treasuryWallet;
        treasuryWallet = newTreasuryWallet;
        emit TreasuryWalletUpdated(oldWallet, newTreasuryWallet);
    }
    
    /**
     * @dev Set minimum buyback amount
     * @param amount New minimum amount
     */
    function setMinBuyBackAmount(uint256 amount) external onlyOwner {
        uint256 oldAmount = minBuyBackAmount;
        minBuyBackAmount = amount;
        emit MinBuyBackAmountUpdated(oldAmount, amount);
    }
    
    /**
     * @dev Set maximum buyback amount
     * @param amount New maximum amount
     */
    function setMaxBuyBackAmount(uint256 amount) external onlyOwner {
        require(amount >= minBuyBackAmount, "Max must be >= min");
        uint256 oldAmount = maxBuyBackAmount;
        maxBuyBackAmount = amount;
        emit MaxBuyBackAmountUpdated(oldAmount, amount);
    }
    
    /**
     * @dev Authorize or revoke executor
     * @param executor Address of the executor
     * @param status Authorization status
     */
    function setExecutorAuthorization(address executor, bool status) external onlyOwner {
        require(executor != address(0), "Invalid address");
        authorizedExecutors[executor] = status;
        emit ExecutorAuthorized(executor, status);
    }
    
    /**
     * @dev Pause contract operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw function for ETH
     */
    function emergencyWithdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        (bool sent, ) = owner().call{value: balance}("");
        require(sent, "ETH withdrawal failed");
        emit EmergencyWithdraw(address(0), balance);
    }
    
    /**
     * @dev Emergency withdraw function for tokens
     * @param tokenAddress Address of the token to withdraw
     */
    function emergencyWithdrawToken(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        IERC20 tokenContract = IERC20(tokenAddress);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(tokenContract.transfer(owner(), balance), "Token withdrawal failed");
        emit EmergencyWithdraw(tokenAddress, balance);
    }
    
    /**
     * @dev Get contract statistics
     */
    function getStats() external view returns (
        uint256 _totalBuyBackAmount,
        uint256 _totalBurnedAmount,
        uint256 _contractTokenBalance,
        uint256 _contractETHBalance
    ) {
        return (
            totalBuyBackAmount,
            totalBurnedAmount,
            token.balanceOf(address(this)),
            address(this).balance
        );
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
