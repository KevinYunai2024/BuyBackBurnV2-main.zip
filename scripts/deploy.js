const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying BuyBackBurn V2...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy parameters
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || ethers.ZeroAddress;
  const TREASURY_WALLET = process.env.TREASURY_WALLET || deployer.address;
  const BUYBACK_FEE_PERCENTAGE = process.env.BUYBACK_FEE_PERCENTAGE || 500; // 5%
  
  console.log("\nDeployment parameters:");
  console.log("- Token Address:", TOKEN_ADDRESS);
  console.log("- Treasury Wallet:", TREASURY_WALLET);
  console.log("- Buyback Fee:", BUYBACK_FEE_PERCENTAGE / 100, "%");
  
  // Deploy BuyBackBurnV2
  const BuyBackBurnV2 = await ethers.getContractFactory("BuyBackBurnV2");
  const buyBackBurn = await BuyBackBurnV2.deploy(
    TOKEN_ADDRESS,
    TREASURY_WALLET,
    BUYBACK_FEE_PERCENTAGE
  );
  
  await buyBackBurn.waitForDeployment();
  const contractAddress = await buyBackBurn.getAddress();
  
  console.log("\n✅ BuyBackBurnV2 deployed to:", contractAddress);
  
  // Verify deployment
  console.log("\nVerifying deployment...");
  const token = await buyBackBurn.token();
  const treasury = await buyBackBurn.treasuryWallet();
  const fee = await buyBackBurn.buyBackFeePercentage();
  
  console.log("- Token:", token);
  console.log("- Treasury:", treasury);
  console.log("- Fee:", fee.toString(), "basis points");
  
  console.log("\n📋 Next steps:");
  console.log("1. Verify contract on block explorer");
  console.log("2. Configure authorized executors");
  console.log("3. Fund contract with tokens for burning");
  console.log("4. Test buyback functionality");
  
  return contractAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
