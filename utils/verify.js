const { run } = require("hardhat")

async function verify(contractAddress, args) {
    try {
        console.log("Verifing Contract ............")
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("already verified")
        } else {
            console.log(e)
        }
    }
}

module.exports = { verify }
