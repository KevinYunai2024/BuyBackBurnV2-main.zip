const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying BuyBackBurn V2 with Mock Token...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy Mock Token first
  console.log("\n📝 Deploying Mock Token...");
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy(
    "Test Token",
    "TEST",
    ethers.parseEther("1000000") // 1 million tokens
  );
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();
  console.log("✅ Mock Token deployed to:", tokenAddress);
  
  // Deploy parameters
  const TREASURY_WALLET = deployer.address;
  const BUYBACK_FEE_PERCENTAGE = 500; // 5%
  
  console.log("\n📝 Deploying BuyBackBurnV2...");
  console.log("Deployment parameters:");
  console.log("- Token Address:", tokenAddress);
  console.log("- Treasury Wallet:", TREASURY_WALLET);
  console.log("- Buyback Fee:", BUYBACK_FEE_PERCENTAGE / 100, "%");
  
  // Deploy BuyBackBurnV2
  const BuyBackBurnV2 = await ethers.getContractFactory("BuyBackBurnV2");
  const buyBackBurn = await BuyBackBurnV2.deploy(
    tokenAddress,
    TREASURY_WALLET,
    BUYBACK_FEE_PERCENTAGE
  );
  
  await buyBackBurn.waitForDeployment();
  const contractAddress = await buyBackBurn.getAddress();
  
  console.log("✅ BuyBackBurnV2 deployed to:", contractAddress);
  
  // Transfer tokens to the contract for testing
  console.log("\n📦 Transferring tokens to contract...");
  const transferAmount = ethers.parseEther("10000");
  await mockToken.transfer(contractAddress, transferAmount);
  console.log("✅ Transferred", ethers.formatEther(transferAmount), "tokens to contract");
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const token = await buyBackBurn.token();
  const treasury = await buyBackBurn.treasuryWallet();
  const fee = await buyBackBurn.buyBackFeePercentage();
  const contractBalance = await mockToken.balanceOf(contractAddress);
  
  console.log("- Token:", token);
  console.log("- Treasury:", treasury);
  console.log("- Fee:", fee.toString(), "basis points");
  console.log("- Contract Token Balance:", ethers.formatEther(contractBalance));
  
  console.log("\n✨ Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Mock Token:", tokenAddress);
  console.log("BuyBackBurnV2:", contractAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  return { tokenAddress, contractAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
