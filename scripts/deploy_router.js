const hre = require("hardhat");

async function main() {
  const factory = "0x15E4c88D1433CC12C61a9853621c6fF413874899";
  const WBNB = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
  
  const GatoswapRouter = await hre.ethers.getContractFactory("GatoswapRouter");
  const gatoswapRouter = await GatoswapRouter.deploy(factory, WBNB);
  await gatoswapRouter.deployed();

  console.log("GatoswapRouter deployed to:", gatoswapRouter.address);

  // const WBNB = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
  // const GatoswapRouter = await hre.ethers.getContractFactory("GatoswapRouter");
  // const gatoswapRouter = await GatoswapRouter.deploy(gatoswapFactory.address, WBNB);
  // await gatoswapRouter.deployed();

  // console.log("GatoswapRouter deployed to:", gatoswapRouter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
