const networkConfig = {
    4: {
        name: "rinkeby",
        ethUsdPriceFeedCAddress: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },

    80001: {
        name: "polygon",
        ethUsdPriceFeedCAddress: "0x0715A7794a1dc8e42615F059dD6e406A6594651A",
    },
}

const developmentChains = ["hardhat", "localhost"]
const DECIMALS = 8
const INITIAL_PRICE = 200000000000
module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_PRICE,
}
