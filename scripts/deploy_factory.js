const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();
  
  const GatoswapFactory = await hre.ethers.getContractFactory("GatoswapFactory");
  const gatoswapFactory = await GatoswapFactory.deploy(owner.address);
  await gatoswapFactory.deployed();

  console.log("Owner address :", owner.address);
  console.log("GatoswapFactory deployed to:", gatoswapFactory.address);

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
