const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { expandTo18Decimals, MINIMUM_LIQUIDITY, getApprovalDigest, getDomainSeparator } = require("./utilities")
const { BigNumber, constants,  utils } = require("ethers");

const { ecsign } = require("ethereumjs-util");
const { ethers } = require("hardhat");
const { MaxUint256, AddressZero, Zero } = constants;

const overrides = {
  gasLimit: 9999999
}

describe("Gatoswap Test", function () {
  let token0;
  let token1;
  let WETH;
  let factory;
  let router;
  let pair;
  let WETHpair;
  let WETHPartner;
  let wallet;
  let routerEventEmitter;

  beforeEach(async () => {
    [wallet] = await ethers.getSigners();
    wallet.privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    const GatoswapFactory = await ethers.getContractFactory("GatoswapFactory");
    factory = await GatoswapFactory.deploy(wallet.address);
  
    const _WETH = await ethers.getContractFactory("WETH");
    WETH = await _WETH.deploy();
  
    const GatoswapRouter = await ethers.getContractFactory("GatoswapRouter");
    router = await GatoswapRouter.deploy(factory.address, WETH.address);

    const RouterEventEmitter = await ethers.getContractFactory("RouterEventEmitter");
    routerEventEmitter = await RouterEventEmitter.deploy();
  
    const Token = await ethers.getContractFactory("ERC20");
    token0 = await Token.deploy("token0", "token0");
    token1 = await Token.deploy("token1", "token1");

    if (token0.address.toLocaleLowerCase() > token1.address.toLocaleLowerCase()) {
      let temp = token0;
      token0 = token1;
      token1 = temp;
    }
    WETHPartner = await Token.deploy("WETHPartner", "WETHPartner");
    
    await token0.transfer(wallet.address, expandTo18Decimals(100))
    await token1.transfer(wallet.address, expandTo18Decimals(100))

    await factory.createPair(token0.address, token1.address)
    const pairAddress = await factory.getPair(token0.address, token1.address)
    pair = await ethers.getContractAt("IGatoswapPair", pairAddress);

    await factory.createPair(WETH.address, WETHPartner.address)
    const WETHPairAddress = await factory.getPair(WETH.address, WETHPartner.address)
    WETHPair = await ethers.getContractAt("IGatoswapPair", WETHPairAddress);
  });

  it('factory, WETH', async () => {
    expect(await router.factory()).to.eq(factory.address);
    expect(await router.WETH()).to.eq(WETH.address);
    expect(await factory.getPair(token0.address, token1.address)).to.eq(pair.address);
  })

  it('addLiquidity', async () => {
    const token0Amount = expandTo18Decimals(1)
    const token1Amount = expandTo18Decimals(4)
    const expectedLiquidity = expandTo18Decimals(2)
    await token0.approve(router.address, MaxUint256)
    await token1.approve(router.address, MaxUint256)

    await expect(
      router.addLiquidity(
        token0.address,
        token1.address,
        token0Amount,
        token1Amount,
        0,
        0,
        wallet.address,
        MaxUint256,
        overrides
      )
    )
      .to.emit(token0, 'Transfer')
      .withArgs(wallet.address, pair.address, token0Amount)
      .to.emit(token1, 'Transfer')
      .withArgs(wallet.address, pair.address, token1Amount)
      .to.emit(pair, 'Transfer')
      .withArgs(AddressZero, AddressZero, MINIMUM_LIQUIDITY)
      .to.emit(pair, 'Transfer')
      .withArgs(AddressZero, wallet.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
      .to.emit(pair, 'Sync')
      .withArgs(token0Amount, token1Amount)
      .to.emit(pair, 'Mint')
      .withArgs(router.address, token0Amount, token1Amount)
    expect(await pair.balanceOf(wallet.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY))
  })

  it('addLiquidityETH', async () => {
    const WETHPartnerAmount = expandTo18Decimals(1)
    const ETHAmount = expandTo18Decimals(4)

    const expectedLiquidity = expandTo18Decimals(2)
    const WETHPairToken0 = await WETHPair.token0()
    await WETHPartner.approve(router.address, MaxUint256)
    await expect(
      router.addLiquidityETH(
        WETHPartner.address,
        WETHPartnerAmount,
        WETHPartnerAmount,
        ETHAmount,
        wallet.address,
        MaxUint256,
        { ...overrides, value: ETHAmount }
      )
    )
      .to.emit(WETHPair, 'Transfer')
      .withArgs(AddressZero, AddressZero, MINIMUM_LIQUIDITY)
      .to.emit(WETHPair, 'Transfer')
      .withArgs(AddressZero, wallet.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
      .to.emit(WETHPair, 'Sync')
      .withArgs(
        WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount : ETHAmount,
        WETHPairToken0 === WETHPartner.address ? ETHAmount : WETHPartnerAmount
      )
      .to.emit(WETHPair, 'Mint')
      .withArgs(
        router.address,
        WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount : ETHAmount,
        WETHPairToken0 === WETHPartner.address ? ETHAmount : WETHPartnerAmount
      )

    expect(await WETHPair.balanceOf(wallet.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY))
  })

  async function addLiquidity(token0Amount, token1Amount) {
    await token0.transfer(pair.address, token0Amount)
    await token1.transfer(pair.address, token1Amount)
    await pair.mint(wallet.address, overrides)
  }

  it('removeLiquidity', async () => {
    const token0Amount = expandTo18Decimals(1)
    const token1Amount = expandTo18Decimals(4)
    await addLiquidity(token0Amount, token1Amount)

    const expectedLiquidity = expandTo18Decimals(2)
    await pair.approve(router.address, MaxUint256)
    await expect(
      router.removeLiquidity(
        token0.address,
        token1.address,
        expectedLiquidity.sub(MINIMUM_LIQUIDITY),
        0,
        0,
        wallet.address,
        MaxUint256,
        overrides
      )
    )
      .to.emit(pair, 'Transfer')
      .withArgs(wallet.address, pair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
      .to.emit(pair, 'Transfer')
      .withArgs(pair.address, AddressZero, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
      .to.emit(token0, 'Transfer')
      .withArgs(pair.address, wallet.address, token0Amount.sub(500))
      .to.emit(token1, 'Transfer')
      .withArgs(pair.address, wallet.address, token1Amount.sub(2000))
      .to.emit(pair, 'Sync')
      .withArgs(500, 2000)
      .to.emit(pair, 'Burn')
      .withArgs(router.address, token0Amount.sub(500), token1Amount.sub(2000), wallet.address)

    expect(await pair.balanceOf(wallet.address)).to.eq(0)
    const totalSupplyToken0 = await token0.totalSupply()
    const totalSupplyToken1 = await token1.totalSupply()
    expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0.sub(500))
    expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1.sub(2000))
  })
  it('removeLiquidityETH', async () => {
    const WETHPartnerAmount = expandTo18Decimals(1)
    const ETHAmount = expandTo18Decimals(4)
    await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount)
    await WETH.deposit({ value: ETHAmount })
    await WETH.transfer(WETHPair.address, ETHAmount)
    await WETHPair.mint(wallet.address, overrides)

    const expectedLiquidity = expandTo18Decimals(2)
    const WETHPairToken0 = await WETHPair.token0()
    await WETHPair.approve(router.address, MaxUint256)
    await expect(
      router.removeLiquidityETH(
        WETHPartner.address,
        expectedLiquidity.sub(MINIMUM_LIQUIDITY),
        0,
        0,
        wallet.address,
        MaxUint256,
        overrides
      )
    )
      .to.emit(WETHPair, 'Transfer')
      .withArgs(wallet.address, WETHPair.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
      .to.emit(WETHPair, 'Transfer')
      .withArgs(WETHPair.address, AddressZero, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
      .to.emit(WETH, 'Transfer')
      .withArgs(WETHPair.address, router.address, ETHAmount.sub(2000))
      .to.emit(WETHPartner, 'Transfer')
      .withArgs(WETHPair.address, router.address, WETHPartnerAmount.sub(500))
      .to.emit(WETHPartner, 'Transfer')
      .withArgs(router.address, wallet.address, WETHPartnerAmount.sub(500))
      .to.emit(WETHPair, 'Sync')
      .withArgs(
        WETHPairToken0 === WETHPartner.address ? 500 : 2000,
        WETHPairToken0 === WETHPartner.address ? 2000 : 500
      )
      .to.emit(WETHPair, 'Burn')
      .withArgs(
        router.address,
        WETHPairToken0 === WETHPartner.address ? WETHPartnerAmount.sub(500) : ETHAmount.sub(2000),
        WETHPairToken0 === WETHPartner.address ? ETHAmount.sub(2000) : WETHPartnerAmount.sub(500),
        router.address
      )

    expect(await WETHPair.balanceOf(wallet.address)).to.eq(0)
    const totalSupplyWETHPartner = await WETHPartner.totalSupply()
    const totalSupplyWETH = await WETH.totalSupply()
    expect(await WETHPartner.balanceOf(wallet.address)).to.eq(totalSupplyWETHPartner.sub(500))
    expect(await WETH.balanceOf(wallet.address)).to.eq(totalSupplyWETH.sub(2000))
  })
  it('removeLiquidityWithPermit', async () => {
    const token0Amount = expandTo18Decimals(1)
    const token1Amount = expandTo18Decimals(4)
    await addLiquidity(token0Amount, token1Amount)

    const expectedLiquidity = expandTo18Decimals(2)

    const nonce = await pair.nonces(wallet.address)
    const digest = await getApprovalDigest(
      pair,
      { owner: wallet.address, spender: router.address, value: expectedLiquidity.sub(MINIMUM_LIQUIDITY) },
      nonce,
      MaxUint256
    )

  
    const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(wallet.privateKey.slice(2), 'hex'))

    await router.removeLiquidityWithPermit(
      token0.address,
      token1.address,
      expectedLiquidity.sub(MINIMUM_LIQUIDITY),
      0,
      0,
      wallet.address,
      MaxUint256,
      false,
      v,
      r,
      s,
      overrides
    )
  })
  it('removeLiquidityETHWithPermit', async () => {
    const WETHPartnerAmount = expandTo18Decimals(1)
    const ETHAmount = expandTo18Decimals(4)
    await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount)
    await WETH.deposit({ value: ETHAmount })
    await WETH.transfer(WETHPair.address, ETHAmount)
    await WETHPair.mint(wallet.address, overrides)

    const expectedLiquidity = expandTo18Decimals(2)

    const nonce = await WETHPair.nonces(wallet.address)
    const digest = await getApprovalDigest(
      WETHPair,
      { owner: wallet.address, spender: router.address, value: expectedLiquidity.sub(MINIMUM_LIQUIDITY) },
      nonce,
      MaxUint256
    )
    const { v, r, s } = ecsign(Buffer.from(digest.slice(2), 'hex'), Buffer.from(wallet.privateKey.slice(2), 'hex'))

    await router.removeLiquidityETHWithPermit(
      WETHPartner.address,
      expectedLiquidity.sub(MINIMUM_LIQUIDITY),
      0,
      0,
      wallet.address,
      MaxUint256,
      false,
      v,
      r,
      s,
      overrides
    )
  })
  describe('swapExactTokensForTokens', () => {
    const token0Amount = expandTo18Decimals(5)
    const token1Amount = expandTo18Decimals(10)
    const swapAmount = expandTo18Decimals(1)
    const expectedOutputAmount = BigNumber.from('1652754590984974958')  // 99 / 599 * 10 ^ 18

    beforeEach(async () => {
      await addLiquidity(token0Amount, token1Amount)
      await token0.approve(router.address, MaxUint256)

    })

    it('happy path', async () => {
      await expect(
        router.swapExactTokensForTokens(
          swapAmount,
          0,
          [token0.address, token1.address],
          wallet.address,
          MaxUint256,
          overrides
        )
      )
        .to.emit(token0, 'Transfer')
        .withArgs(wallet.address, pair.address, swapAmount)
        .to.emit(token1, 'Transfer')
        .withArgs(pair.address, wallet.address, expectedOutputAmount)
        .to.emit(pair, 'Sync')
        .withArgs(token0Amount.add(swapAmount), token1Amount.sub(expectedOutputAmount))
        .to.emit(pair, 'Swap')
        .withArgs(router.address, swapAmount, 0, 0, expectedOutputAmount, wallet.address)
 
    })

    it('amounts', async () => {
      await token0.approve(routerEventEmitter.address, MaxUint256)
      await expect(
        routerEventEmitter.swapExactTokensForTokens(
          router.address,
          swapAmount,
          0,
          [token0.address, token1.address],
          wallet.address,
          MaxUint256,
          overrides
        )
      )
        .to.emit(routerEventEmitter, 'Amounts')
        .withArgs([swapAmount, expectedOutputAmount])
    })
  })

  describe('swapTokensForExactTokens', () => {
    const token0Amount = expandTo18Decimals(5)
    const token1Amount = expandTo18Decimals(10)
    const expectedSwapAmount = BigNumber.from('561167227833894501')
    const outputAmount = expandTo18Decimals(1)

    beforeEach(async () => {
      await addLiquidity(token0Amount, token1Amount)
    })

    it('happy path', async () => {
      await token0.approve(router.address, MaxUint256)
      await expect(
        router.swapTokensForExactTokens(
          outputAmount,
          MaxUint256,
          [token0.address, token1.address],
          wallet.address,
          MaxUint256,
          overrides
        )
      )
        .to.emit(token0, 'Transfer')
        .withArgs(wallet.address, pair.address, expectedSwapAmount)
        .to.emit(token1, 'Transfer')
        .withArgs(pair.address, wallet.address, outputAmount)
        .to.emit(pair, 'Sync')
        .withArgs(token0Amount.add(expectedSwapAmount), token1Amount.sub(outputAmount))
        .to.emit(pair, 'Swap')
        .withArgs(router.address, expectedSwapAmount, 0, 0, outputAmount, wallet.address)
    })

    it('amounts', async () => {
      await token0.approve(routerEventEmitter.address, MaxUint256)
      await expect(
        routerEventEmitter.swapTokensForExactTokens(
          router.address,
          outputAmount,
          MaxUint256,
          [token0.address, token1.address],
          wallet.address,
          MaxUint256,
          overrides
        )
      )
        .to.emit(routerEventEmitter, 'Amounts')
        .withArgs([expectedSwapAmount, outputAmount])
    })
  })

  describe('swapExactETHForTokens', () => {
    const WETHPartnerAmount = expandTo18Decimals(10)
    const ETHAmount = expandTo18Decimals(5)
    const swapAmount = expandTo18Decimals(1)
    const expectedOutputAmount = BigNumber.from('1652754590984974958')

    beforeEach(async () => {
      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount)
      await WETH.deposit({ value: ETHAmount })
      await WETH.transfer(WETHPair.address, ETHAmount)
      await WETHPair.mint(wallet.address, overrides)

      await token0.approve(router.address, MaxUint256)
    })

    it('happy path', async () => {
      const WETHPairToken0 = await WETHPair.token0()
      await expect(
        router.swapExactETHForTokens(0, [WETH.address, WETHPartner.address], wallet.address, MaxUint256, {
          ...overrides,
          value: swapAmount
        })
      )
        .to.emit(WETH, 'Transfer')
        .withArgs(router.address, WETHPair.address, swapAmount)
        .to.emit(WETHPartner, 'Transfer')
        .withArgs(WETHPair.address, wallet.address, expectedOutputAmount)
        .to.emit(WETHPair, 'Sync')
        .withArgs(
          WETHPairToken0 === WETHPartner.address
            ? WETHPartnerAmount.sub(expectedOutputAmount)
            : ETHAmount.add(swapAmount),
          WETHPairToken0 === WETHPartner.address
            ? ETHAmount.add(swapAmount)
            : WETHPartnerAmount.sub(expectedOutputAmount)
        )
        .to.emit(WETHPair, 'Swap')
        .withArgs(
          router.address,
          WETHPairToken0 === WETHPartner.address ? 0 : swapAmount,
          WETHPairToken0 === WETHPartner.address ? swapAmount : 0,
          WETHPairToken0 === WETHPartner.address ? expectedOutputAmount : 0,
          WETHPairToken0 === WETHPartner.address ? 0 : expectedOutputAmount,
          wallet.address
        )
    })

    it('amounts', async () => {
      await expect(
        routerEventEmitter.swapExactETHForTokens(
          router.address,
          0,
          [WETH.address, WETHPartner.address],
          wallet.address,
          MaxUint256,
          {
            ...overrides,
            value: swapAmount
          }
        )
      )
        .to.emit(routerEventEmitter, 'Amounts')
        .withArgs([swapAmount, expectedOutputAmount])
    })
  })

  describe('swapTokensForExactETH', () => {
    const WETHPartnerAmount = expandTo18Decimals(5)
    const ETHAmount = expandTo18Decimals(10)
    const expectedSwapAmount = BigNumber.from('561167227833894501')
    const outputAmount = expandTo18Decimals(1)

    beforeEach(async () => {
      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount)
      await WETH.deposit({ value: ETHAmount })
      await WETH.transfer(WETHPair.address, ETHAmount)
      await WETHPair.mint(wallet.address, overrides)
    })

    it('happy path', async () => {
      await WETHPartner.approve(router.address, MaxUint256)
      const WETHPairToken0 = await WETHPair.token0()
      await expect(
        router.swapTokensForExactETH(
          outputAmount,
          MaxUint256,
          [WETHPartner.address, WETH.address],
          wallet.address,
          MaxUint256,
          overrides
        )
      )
        .to.emit(WETHPartner, 'Transfer')
        .withArgs(wallet.address, WETHPair.address, expectedSwapAmount)
        .to.emit(WETH, 'Transfer')
        .withArgs(WETHPair.address, router.address, outputAmount)
        .to.emit(WETHPair, 'Sync')
        .withArgs(
          WETHPairToken0 === WETHPartner.address
            ? WETHPartnerAmount.add(expectedSwapAmount)
            : ETHAmount.sub(outputAmount),
          WETHPairToken0 === WETHPartner.address
            ? ETHAmount.sub(outputAmount)
            : WETHPartnerAmount.add(expectedSwapAmount)
        )
        .to.emit(WETHPair, 'Swap')
        .withArgs(
          router.address,
          WETHPairToken0 === WETHPartner.address ? expectedSwapAmount : 0,
          WETHPairToken0 === WETHPartner.address ? 0 : expectedSwapAmount,
          WETHPairToken0 === WETHPartner.address ? 0 : outputAmount,
          WETHPairToken0 === WETHPartner.address ? outputAmount : 0,
          router.address
        )
    })

    it('amounts', async () => {
      await WETHPartner.approve(routerEventEmitter.address, MaxUint256)
      await expect(
        routerEventEmitter.swapTokensForExactETH(
          router.address,
          outputAmount,
          MaxUint256,
          [WETHPartner.address, WETH.address],
          wallet.address,
          MaxUint256,
          overrides
        )
      )
        .to.emit(routerEventEmitter, 'Amounts')
        .withArgs([expectedSwapAmount, outputAmount])
    })
  })

  describe('swapExactTokensForETH', () => {
    const WETHPartnerAmount = expandTo18Decimals(5)
    const ETHAmount = expandTo18Decimals(10)
    const swapAmount = expandTo18Decimals(1)
    const expectedOutputAmount = BigNumber.from('1652754590984974958')

    beforeEach(async () => {
      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount)
      await WETH.deposit({ value: ETHAmount })
      await WETH.transfer(WETHPair.address, ETHAmount)
      await WETHPair.mint(wallet.address, overrides)
    })

    it('happy path', async () => {
      await WETHPartner.approve(router.address, MaxUint256)
      const WETHPairToken0 = await WETHPair.token0()
      await expect(
        router.swapExactTokensForETH(
          swapAmount,
          0,
          [WETHPartner.address, WETH.address],
          wallet.address,
          MaxUint256,
          overrides
        )
      )
        .to.emit(WETHPartner, 'Transfer')
        .withArgs(wallet.address, WETHPair.address, swapAmount)
        .to.emit(WETH, 'Transfer')
        .withArgs(WETHPair.address, router.address, expectedOutputAmount)
        .to.emit(WETHPair, 'Sync')
        .withArgs(
          WETHPairToken0 === WETHPartner.address
            ? WETHPartnerAmount.add(swapAmount)
            : ETHAmount.sub(expectedOutputAmount),
          WETHPairToken0 === WETHPartner.address
            ? ETHAmount.sub(expectedOutputAmount)
            : WETHPartnerAmount.add(swapAmount)
        )
        .to.emit(WETHPair, 'Swap')
        .withArgs(
          router.address,
          WETHPairToken0 === WETHPartner.address ? swapAmount : 0,
          WETHPairToken0 === WETHPartner.address ? 0 : swapAmount,
          WETHPairToken0 === WETHPartner.address ? 0 : expectedOutputAmount,
          WETHPairToken0 === WETHPartner.address ? expectedOutputAmount : 0,
          router.address
        )
    })

    it('amounts', async () => {
      await WETHPartner.approve(routerEventEmitter.address, MaxUint256)
      await expect(
        routerEventEmitter.swapExactTokensForETH(
          router.address,
          swapAmount,
          0,
          [WETHPartner.address, WETH.address],
          wallet.address,
          MaxUint256,
          overrides
        )
      )
        .to.emit(routerEventEmitter, 'Amounts')
        .withArgs([swapAmount, expectedOutputAmount])
    })
  })

  describe('swapETHForExactTokens', () => {
    const WETHPartnerAmount = expandTo18Decimals(10)
    const ETHAmount = expandTo18Decimals(5)
    const expectedSwapAmount = BigNumber.from('561167227833894501')
    const outputAmount = expandTo18Decimals(1)

    beforeEach(async () => {
      await WETHPartner.transfer(WETHPair.address, WETHPartnerAmount)
      await WETH.deposit({ value: ETHAmount })
      await WETH.transfer(WETHPair.address, ETHAmount)
      await WETHPair.mint(wallet.address, overrides)
    })

    it('happy path', async () => {
      const WETHPairToken0 = await WETHPair.token0()
      await expect(
        router.swapETHForExactTokens(
          outputAmount,
          [WETH.address, WETHPartner.address],
          wallet.address,
          MaxUint256,
          {
            ...overrides,
            value: expectedSwapAmount
          }
        )
      )
        .to.emit(WETH, 'Transfer')
        .withArgs(router.address, WETHPair.address, expectedSwapAmount)
        .to.emit(WETHPartner, 'Transfer')
        .withArgs(WETHPair.address, wallet.address, outputAmount)
        .to.emit(WETHPair, 'Sync')
        .withArgs(
          WETHPairToken0 === WETHPartner.address
            ? WETHPartnerAmount.sub(outputAmount)
            : ETHAmount.add(expectedSwapAmount),
          WETHPairToken0 === WETHPartner.address
            ? ETHAmount.add(expectedSwapAmount)
            : WETHPartnerAmount.sub(outputAmount)
        )
        .to.emit(WETHPair, 'Swap')
        .withArgs(
          router.address,
          WETHPairToken0 === WETHPartner.address ? 0 : expectedSwapAmount,
          WETHPairToken0 === WETHPartner.address ? expectedSwapAmount : 0,
          WETHPairToken0 === WETHPartner.address ? outputAmount : 0,
          WETHPairToken0 === WETHPartner.address ? 0 : outputAmount,
          wallet.address
        )
    })

    it('amounts', async () => {
      await expect(
        routerEventEmitter.swapETHForExactTokens(
          router.address,
          outputAmount,
          [WETH.address, WETHPartner.address],
          wallet.address,
          MaxUint256,
          {
            ...overrides,
            value: expectedSwapAmount
          }
        )
      )
        .to.emit(routerEventEmitter, 'Amounts')
        .withArgs([expectedSwapAmount, outputAmount])
    })
  })
});

