# GATO SWAP Contract
GATO SWAP Contract forks the Pancake swap on Binance Smart Chain.
Change base fee to 1%.
### Installation
```sh
# Clone the repo
    git clone https://gitlab.com/merehead/gato/gato_swap_contracts.git
# Install all dependencies
    npm install
```
### Compile contract
```sh
npx hardhat compile
```
### Test contract
```sh
npx hardhat test
```
### Deploy contract
```sh
# BSC mainnet deploy
GatoswapFactory: npx hardhat run scripts/deploy_factory.js --network bscmainnet
GatoswapRouter:  npx hardhat run scripts/deploy_router.js --network bscmainnet

# BSC testnet deploy
GatoswapFactory: npx hardhat run scripts/deploy_factory.js --network bsctestnet
GatoswapRouter:  npx hardhat run scripts/deploy_router.js --network bsctestnet
```
### Deployed Address
```sh
# BSC mainnet
    GatoswapFactory: 
    GatoswapRouter:

# BSC testnet
    GatoswapFactory: https://testnet.bscscan.com/address/0x15E4c88D1433CC12C61a9853621c6fF413874899
    GatoswapRouter:  https://testnet.bscscan.com/address/0xD9876733D2B7f2331136F2659646EFd046de988b
```
### GatoswapFactory Functions
##### Mutable
    createPair(address tokenA, address tokenB): create the pair with tokenA and tokenB
        tokenA: token address
        tokenB: another token address
##### View
    INIT_CODE_PAIR_HASH: the hash code for generating the pair address(bytes32)
    allPairsLength: the length of all pairs(uint)
### GatoswapRouter Functions
##### Mutable
    addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, 
                uint amountAMin, uint amountBMin, address to, uint deadline)
        Add the liquidity to pair which consists of tokenA and tokenB
        tokenA: A token address
        tokenB: B token address
        amountADesired: A token amount added to liquidity
        amountBDesired: B token amount added to liquidity
        amountAMin: minimum amount of token A
        amountBMin: minimum amount of token B
        to: user address to receive Gatoswap LP token
        deadline: running time

    addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin,
                address to, uint deadline) - payable
        Add the liquidity to pair which consists of navtive coin and token
        token: token address
        amountTokenDesired: token amount added to liquidity
        amountTokenMin: minimum amount of token
        amountETHMin: minimum amount of native coin
        to: user address to receive Gatoswap LP token
        deadline: running time

    removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin,
                  address to, uint deadline)
        Remove the liquidity from pair which consists of tokenA and tokenB and send the tokenA and tokenB of liquidity.
        tokenA: A token address
        tokenB: B token address
        liquidity: taken liquidity amount
        amountAMin: minimum amount of token A
        amountBMin: minimum amount of token B
        to: user address to receive Gatoswap LP token
        deadline: running time

    removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline)
        Remove the liquidity from pair which consists of BNB and token
        token: token address
        liquidity: taken liquidity amount
        amountTokenMin: minimum amount of token
        amountETHMin: minimum amount of BNB
        to: user address to receive Gatoswap LP token
        deadline: running time

    swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        swap the tokenA to tokenB
        amountIn: amount of input token
        amountOutMin: minimum amount of output token
        path: swapping path
        to: user address to receive the tokenB
        deadline: running time
    
    swapExactTokensForTokens(uint amountOut, uint amountInMin, address[] calldata path, address to, uint deadline)
        Swap the tokenB to tokenA
        amountOut: exact amount of output token
        amountInMin: minimum amount of input token
        path: swapping path
        to: user address to receive the tokenB
        deadline: running time
    
    swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) - payable
        Swap the BNB to token
        amountOutMin: minimum amount of output token
        path: swapping path
        to: user address to receive the tokenB
        deadline: running time

    swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
        Swap the token to BNB
        amountOut: exact amount of BNB
        amountInMin: minimum amount of input token
        path: swapping path
        to: user address to receive the tokenB
        deadline: running time
    
    swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
        Swap the token to BNB
        amountIn: exact amount of token
        amountOutMin: minimum amount of output BNB
        path: swapping path
        to: user address to receive the tokenB
        deadline: running time

    swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) - payable
        Swap the BNB to token
        amountOut: exact amount of token
        path: swapping path
        to: user address to receive the tokenB
        deadline: running time

    getAmountOut(uint amountIn, uint reserveIn, uint reserveOut)
        Given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
        amountIn: exact input amount
        reserveIn: reserve amount of input token
        reserveOut: reserve amount of output token
        path: swapping path
    getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) 
        Given an output amount of an asset and pair reserves, returns a required input amount of the other asset
        amountOut: exact output amount
        reserveIn: reserve amount of input token
        reserveOut: reserve amount of output token
    getAmountsOut(uint amountIn, address[] memory path)
        Performs chained getAmountOut calculations on any number of pairs
        amountIn: exact input amount
        path: swapping path
    getAmountsIn(uint amountOut, address[] memory path)
        performs chained getAmountIn calculations on any number of pairs
        amountOut: exact output amount
        path: swapping path
##### View

