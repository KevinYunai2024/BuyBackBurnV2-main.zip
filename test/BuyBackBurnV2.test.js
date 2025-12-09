const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BuyBackBurnV2", function () {
  let buyBackBurn;
  let mockToken;
  let owner;
  let treasury;
  let executor;
  let addr1;
  
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const FEE_PERCENTAGE = 500; // 5%
  const BASIS_POINTS = 10000;
  
  beforeEach(async function () {
    [owner, treasury, executor, addr1] = await ethers.getSigners();
    
    // Deploy Mock Token
    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy("Test Token", "TEST", INITIAL_SUPPLY);
    await mockToken.waitForDeployment();
    
    // Deploy BuyBackBurnV2
    const BuyBackBurnV2 = await ethers.getContractFactory("BuyBackBurnV2");
    buyBackBurn = await BuyBackBurnV2.deploy(
      await mockToken.getAddress(),
      treasury.address,
      FEE_PERCENTAGE
    );
    await buyBackBurn.waitForDeployment();
    
    // Transfer some tokens to the contract for burning
    await mockToken.transfer(await buyBackBurn.getAddress(), ethers.parseEther("10000"));
  });
  
  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      expect(await buyBackBurn.token()).to.equal(await mockToken.getAddress());
    });
    
    it("Should set the correct treasury wallet", async function () {
      expect(await buyBackBurn.treasuryWallet()).to.equal(treasury.address);
    });
    
    it("Should set the correct buyback fee", async function () {
      expect(await buyBackBurn.buyBackFeePercentage()).to.equal(FEE_PERCENTAGE);
    });
    
    it("Should authorize the owner as executor", async function () {
      expect(await buyBackBurn.authorizedExecutors(owner.address)).to.be.true;
    });
    
    it("Should set default min and max buyback amounts", async function () {
      expect(await buyBackBurn.minBuyBackAmount()).to.equal(ethers.parseEther("0.001"));
      expect(await buyBackBurn.maxBuyBackAmount()).to.equal(ethers.parseEther("100"));
    });
  });
  
  describe("Buyback Execution", function () {
    it("Should execute buyback successfully", async function () {
      const buyBackAmount = ethers.parseEther("1");
      const expectedTokens = ethers.parseEther("100");
      
      const tx = await buyBackBurn.executeBuyBack(expectedTokens, {
        value: buyBackAmount
      });
      
      await expect(tx)
        .to.emit(buyBackBurn, "BuyBackExecuted")
        .and.to.emit(buyBackBurn, "TokensBurned");
      
      const stats = await buyBackBurn.getStats();
      expect(stats[0]).to.be.gt(0); // totalBuyBackAmount
      expect(stats[1]).to.equal(expectedTokens); // totalBurnedAmount
    });
    
    it("Should transfer fee to treasury", async function () {
      const buyBackAmount = ethers.parseEther("1");
      const expectedTokens = ethers.parseEther("100");
      const expectedFee = (buyBackAmount * BigInt(FEE_PERCENTAGE)) / BigInt(BASIS_POINTS);
      
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);
      
      await buyBackBurn.executeBuyBack(expectedTokens, {
        value: buyBackAmount
      });
      
      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(expectedFee);
    });
    
    it("Should revert if amount below minimum", async function () {
      const buyBackAmount = ethers.parseEther("0.0001");
      const expectedTokens = ethers.parseEther("10");
      
      await expect(
        buyBackBurn.executeBuyBack(expectedTokens, { value: buyBackAmount })
      ).to.be.revertedWith("Amount below minimum");
    });
    
    it("Should revert if amount exceeds maximum", async function () {
      const buyBackAmount = ethers.parseEther("101");
      const expectedTokens = ethers.parseEther("1000");
      
      await expect(
        buyBackBurn.executeBuyBack(expectedTokens, { value: buyBackAmount })
      ).to.be.revertedWith("Amount exceeds maximum");
    });
    
    it("Should revert if caller is not authorized", async function () {
      const buyBackAmount = ethers.parseEther("1");
      const expectedTokens = ethers.parseEther("100");
      
      await expect(
        buyBackBurn.connect(addr1).executeBuyBack(expectedTokens, { value: buyBackAmount })
      ).to.be.revertedWith("Not authorized");
    });
    
    it("Should allow authorized executor to perform buyback", async function () {
      await buyBackBurn.setExecutorAuthorization(executor.address, true);
      
      const buyBackAmount = ethers.parseEther("1");
      const expectedTokens = ethers.parseEther("100");
      
      await expect(
        buyBackBurn.connect(executor).executeBuyBack(expectedTokens, { value: buyBackAmount })
      ).to.not.be.reverted;
    });
  });
  
  describe("Token Burning", function () {
    it("Should burn tokens correctly", async function () {
      const burnAmount = ethers.parseEther("100");
      const contractBalanceBefore = await mockToken.balanceOf(await buyBackBurn.getAddress());
      
      await expect(buyBackBurn.burnTokens(burnAmount))
        .to.emit(buyBackBurn, "TokensBurned")
        .withArgs(burnAmount);
      
      const contractBalanceAfter = await mockToken.balanceOf(await buyBackBurn.getAddress());
      expect(contractBalanceBefore - contractBalanceAfter).to.equal(burnAmount);
      expect(await buyBackBurn.totalBurnedAmount()).to.equal(burnAmount);
    });
    
    it("Should revert if insufficient token balance", async function () {
      const burnAmount = ethers.parseEther("100000");
      
      await expect(
        buyBackBurn.burnTokens(burnAmount)
      ).to.be.revertedWith("Insufficient token balance");
    });
    
    it("Should revert if burn amount is zero", async function () {
      await expect(
        buyBackBurn.burnTokens(0)
      ).to.be.revertedWith("Amount must be positive");
    });
  });
  
  describe("Admin Functions", function () {
    it("Should allow owner to update buyback fee", async function () {
      const newFee = 1000; // 10%
      
      await expect(buyBackBurn.setBuyBackFee(newFee))
        .to.emit(buyBackBurn, "BuyBackFeeUpdated")
        .withArgs(FEE_PERCENTAGE, newFee);
      
      expect(await buyBackBurn.buyBackFeePercentage()).to.equal(newFee);
    });
    
    it("Should revert if fee exceeds 100%", async function () {
      await expect(
        buyBackBurn.setBuyBackFee(10001)
      ).to.be.revertedWith("Fee exceeds 100%");
    });
    
    it("Should allow owner to update treasury wallet", async function () {
      await expect(buyBackBurn.setTreasuryWallet(addr1.address))
        .to.emit(buyBackBurn, "TreasuryWalletUpdated")
        .withArgs(treasury.address, addr1.address);
      
      expect(await buyBackBurn.treasuryWallet()).to.equal(addr1.address);
    });
    
    it("Should allow owner to set min buyback amount", async function () {
      const newMin = ethers.parseEther("0.01");
      
      await expect(buyBackBurn.setMinBuyBackAmount(newMin))
        .to.emit(buyBackBurn, "MinBuyBackAmountUpdated");
      
      expect(await buyBackBurn.minBuyBackAmount()).to.equal(newMin);
    });
    
    it("Should allow owner to set max buyback amount", async function () {
      const newMax = ethers.parseEther("200");
      
      await expect(buyBackBurn.setMaxBuyBackAmount(newMax))
        .to.emit(buyBackBurn, "MaxBuyBackAmountUpdated");
      
      expect(await buyBackBurn.maxBuyBackAmount()).to.equal(newMax);
    });
    
    it("Should revert if max is less than min", async function () {
      await buyBackBurn.setMinBuyBackAmount(ethers.parseEther("10"));
      
      await expect(
        buyBackBurn.setMaxBuyBackAmount(ethers.parseEther("5"))
      ).to.be.revertedWith("Max must be >= min");
    });
    
    it("Should allow owner to authorize/revoke executors", async function () {
      await expect(buyBackBurn.setExecutorAuthorization(executor.address, true))
        .to.emit(buyBackBurn, "ExecutorAuthorized")
        .withArgs(executor.address, true);
      
      expect(await buyBackBurn.authorizedExecutors(executor.address)).to.be.true;
      
      await buyBackBurn.setExecutorAuthorization(executor.address, false);
      expect(await buyBackBurn.authorizedExecutors(executor.address)).to.be.false;
    });
  });
  
  describe("Pause Functionality", function () {
    it("Should allow owner to pause and unpause", async function () {
      await buyBackBurn.pause();
      
      const buyBackAmount = ethers.parseEther("1");
      const expectedTokens = ethers.parseEther("100");
      
      await expect(
        buyBackBurn.executeBuyBack(expectedTokens, { value: buyBackAmount })
      ).to.be.revertedWithCustomError(buyBackBurn, "EnforcedPause");
      
      await buyBackBurn.unpause();
      
      await expect(
        buyBackBurn.executeBuyBack(expectedTokens, { value: buyBackAmount })
      ).to.not.be.reverted;
    });
  });
  
  describe("Emergency Withdraw", function () {
    it("Should allow owner to emergency withdraw ETH", async function () {
      // Send some ETH to the contract
      await owner.sendTransaction({
        to: await buyBackBurn.getAddress(),
        value: ethers.parseEther("1")
      });
      
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      const tx = await buyBackBurn.emergencyWithdrawETH();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore - gasCost);
    });
    
    it("Should allow owner to emergency withdraw tokens", async function () {
      const ownerBalanceBefore = await mockToken.balanceOf(owner.address);
      
      await buyBackBurn.emergencyWithdrawToken(await mockToken.getAddress());
      
      const ownerBalanceAfter = await mockToken.balanceOf(owner.address);
      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
    });
  });
  
  describe("Statistics", function () {
    it("Should return correct statistics", async function () {
      const buyBackAmount = ethers.parseEther("1");
      const expectedTokens = ethers.parseEther("100");
      
      await buyBackBurn.executeBuyBack(expectedTokens, { value: buyBackAmount });
      
      const stats = await buyBackBurn.getStats();
      expect(stats[0]).to.be.gt(0); // totalBuyBackAmount
      expect(stats[1]).to.equal(expectedTokens); // totalBurnedAmount
      expect(stats[2]).to.be.gt(0); // contractTokenBalance
    });
  });
});
