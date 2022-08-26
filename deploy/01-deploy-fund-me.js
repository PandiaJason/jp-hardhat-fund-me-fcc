// imports
// main function X
// calling a main function X

// require("dotenv").config()
// require("@nomiclabs/hardhat-etherscan")

const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig

// async function deployFunc(hre) {
//     console.log("Hi")
//     hre.getNamedAccounts
//     hre.deployments
// }

// module.exports.default = deployFunc

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
        console.log(chainId)
    } else {
        ethUsdPriceFeedAddress =
            networkConfig[chainId]["ethUsdPriceFeedCAddress"]
        console.log(chainId)
    }

    // well what happens when we want to change chains?
    // when going for localhost or hardhat network we want to use a mock

    log("----------------------------------------")
    log("Deploying FundMe and waiting for confirmations...")
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`FundMe deployed at ${fundMe.address}`)

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [ethUsdPriceFeedAddress])
    }
}
module.exports.tags = ["all", "fundme"]
