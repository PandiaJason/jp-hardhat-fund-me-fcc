const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe, deployer, mockV3Aggregator, gasCost
          console.log(deployer)
          const sendValue = ethers.utils.parseEther("1") // "100000000000000000"
          beforeEach(async function () {
              // deploy our fundme contract
              // using hardhat deploy

              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          describe("constructor", async function () {
              it("set the aggregator address correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("Fails if we dont sent enough ETH ", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH"
                  )
                  // console.log(`fundMe.fund(): ${fundMe.fund()}`)
              })
              it("Updated the amount data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  // console.log(`response: ${response}`)
                  // console.log(" ")
                  // console.log(`sendValue: ${sendValue}`)
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Add funder to array of getFunder ", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  // console.log(`funder: ${funder}`)
                  // console.log(" ")
                  // console.log(`deployer: ${deployer}`)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              }) // FundMe.address = 1eth or 1e18
              it("Withdraw ETH from single funder ", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // console.log(" ")
                  // console.log("---------------------------------------------------")
                  // console.log(`startingFundMeBalance: ${startingFundMeBalance}`)
                  // console.log(" ")
                  // console.log(`startingDeployerBalance: ${startingDeployerBalance}`)
                  // Act
                  const transactionResponse = await fundMe.withdraw() // spent gass and money withdrawn

                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt // { } -> pull out the gass price

                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // console.log(" ")
                  // console.log("---------------------Withdraw----------------------")

                  // console.log(`gasCost: ${gasCost}`)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // console.log(" ")
                  // console.log("---------------------------------------------------")
                  // console.log(`endingFundMeBalance: ${endingFundMeBalance}`)
                  // console.log(" ")
                  // console.log(`endingDeployerBalance: ${endingDeployerBalance}`)
                  // console.log("---------------------------------------------------")

                  // Assert
                  // gasCost = transactionReceipt["gasUsed"]
                  //     .toString()
                  //     .add(transactionReceipt["effectiveGasPrice"].toString())

                  // console.log(gasCost)

                  // let total

                  totalS = startingFundMeBalance.add(startingDeployerBalance)

                  totalE = endingDeployerBalance.add(gasCost).toString()

                  // console.log(`totalS: ${totalS}`)
                  // console.log(`totalE: ${totalE}`)
                  // console.log(" ")
                  // console.log("---------------------------------------------------")
                  // console.log(" ")
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("alllows us to withdraw ETH from multiple getFunder", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnecteedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnecteedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act

                  const transactionResponse = await fundMe.withdraw() // spent gass and money withdrawn

                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt // { } -> pull out the gass price

                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make Sure getFunder Are Reset Properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("alllows only owner to withdraw ETH ", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attakerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attakerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe_NotOwner")
              })
          })

          describe("cheaperwithdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              }) // FundMe.address = 1eth or 1e18
              it("CheapWithdraw ETH from single funder ", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // console.log(" ")
                  // console.log("---------------------------------------------------")
                  // console.log(`startingFundMeBalance: ${startingFundMeBalance}`)
                  // console.log(" ")
                  // console.log(`startingDeployerBalance: ${startingDeployerBalance}`)
                  // Act
                  const transactionResponse = await fundMe.cheaperwithdraw() // spent gass and money withdrawn

                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt // { } -> pull out the gass price

                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // console.log(" ")
                  // console.log("---------------------Withdraw----------------------")

                  // console.log(`gasCost: ${gasCost}`)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // console.log(" ")
                  // console.log("---------------------------------------------------")
                  // console.log(`endingFundMeBalance: ${endingFundMeBalance}`)
                  // console.log(" ")
                  // console.log(`endingDeployerBalance: ${endingDeployerBalance}`)
                  // console.log("---------------------------------------------------")

                  // Assert
                  // gasCost = transactionReceipt["gasUsed"]
                  //     .toString()
                  //     .add(transactionReceipt["effectiveGasPrice"].toString())

                  // console.log(gasCost)

                  // let total

                  totalS = startingFundMeBalance.add(startingDeployerBalance)

                  totalE = endingDeployerBalance.add(gasCost).toString()

                  // console.log(`totalS: ${totalS}`)
                  // console.log(`totalE: ${totalE}`)
                  // console.log(" ")
                  // console.log("---------------------------------------------------")
                  // console.log(" ")
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("alllows us to CheapWithdraw ETH from multiple getFunder", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnecteedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnecteedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act

                  const transactionResponse = await fundMe.cheaperwithdraw() // spent gass and money withdrawn

                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt // { } -> pull out the gass price

                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make Sure getFunder Are Reset Properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("alllows only owner to CheapWithdraw ETH ", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attakerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attakerConnectedContract.cheaperwithdraw()
                  ).to.be.revertedWith("FundMe_NotOwner")
              })
          })
      })
