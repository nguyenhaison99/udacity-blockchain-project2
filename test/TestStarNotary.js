const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract("StarNotary", (accs) => {
  accounts = accs;
  owner = accounts[0];
});

it("can Create a Star", async () => {
  let tokenId = 1;
  let instance = await StarNotary.deployed();
  await instance.createStar("Awesome Star!", tokenId, { from: accounts[0] });
  assert.equal(await instance.tokenIdToStarInfo.call(tokenId), "Awesome Star!");
});

it("lets user1 put up their star for sale", async () => {
  let instance = await StarNotary.deployed();
  let user1 = accounts[1];
  let starId = 2;
  let starPrice = web3.utils.toWei(".01", "ether");
  await instance.createStar("awesome star", starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });
  assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it("lets user1 get the funds after the sale", async () => {
  let instance = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 3;
  let starPrice = web3.utils.toWei(".01", "ether");
  let balance = web3.utils.toWei(".05", "ether");
  const gasPrice = web3.utils.toWei(".0001", "ether");

  await instance.createStar("awesome star", starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });

  await instance.approve(user2, starId, { from: user1, gasPrice: gasPrice }); // ERC721: Fix error: approve caller is not owner nor approved for all
  // Moving Approve() before GetBalance(), removes the following errors:
  // Error: Returned error: VM Exception while processing transaction: Transaction's maxFeePerGas (0) is less than the block's baseFeePerGas (86510)
  // (vm hf=london -> block -> tx)

  let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);

  await instance.buyStar(starId, { from: user2, value: balance });
  let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
  let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
  let value2 = Number(balanceOfUser1AfterTransaction);
  assert.equal(value1, value2);
});

it("lets user2 buy a star, if it is put up for sale", async () => {
  let instance = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 4;
  let starPrice = web3.utils.toWei(".01", "ether");
  let balance = web3.utils.toWei(".05", "ether");
  const gasPrice = web3.utils.toWei(".0001", "ether");

  await instance.createStar("awesome star", starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });

  await instance.approve(user2, starId, { from: user1, gasPrice: gasPrice }); // ERC721: Fix error: approve caller is not owner nor approved for all
  // Moving Approve() before GetBalance(), removes the following errors:
  // Error: Returned error: VM Exception while processing transaction: Transaction's maxFeePerGas (0) is less than the block's baseFeePerGas (86510)
  // (vm hf=london -> block -> tx)

  let balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);

  await instance.buyStar(starId, { from: user2, value: balance });
  assert.equal(await instance.ownerOf.call(starId), user2);
});

it("lets user2 buy a star and decreases its balance in ether", async () => {
  let instance = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 5;
  let starPrice = web3.utils.toWei(".01", "ether");
  let balance = web3.utils.toWei(".05", "ether");
  const gasPrice = web3.utils.toWei(".0001", "ether");
  await instance.createStar("awesome star", starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });

  await instance.approve(user2, starId, { from: user1, gasPrice: gasPrice }); // ERC721: Fix error: approve caller is not owner nor approved for all
  // Moving Approve() before GetBalance(), removes the following errors:
  // Error: Returned error: VM Exception while processing transaction: Transaction's maxFeePerGas (0) is less than the block's baseFeePerGas (86510)
  // (vm hf=london -> block -> tx)

  const balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
  const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);

  await instance.buyStar(starId, {
    from: user2,
    value: balance,
    gasPrice: gasPrice,
  });

  const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
  let value =
    Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
  // assert.equal(value, starPrice); // NEVER EQUAL BECAUSE OF THE GAS FEES, THAT CANNOT BE EQUAL TO ZERO

  assert(value > starPrice);
});

// Implement Task 2 Add supporting unit tests
it("can add the star name and star symbol properly", async () => {
  // 1. Deploy the Smart Contract
  let instance = await StarNotary.deployed();

  // 2. Define the user and star information
  let user1 = accounts[1];
  let starId = 6;
  let starName = "Awesome Star 2";

  // 3. Create a Star with a different tokenId
  await instance.createStar(starName, starId, { from: user1 });

  // 4. Call the name and symbol properties in your Smart Contract and compare with the expected values
  let ContractName = await instance.name();
  let ContractSymbol = await instance.symbol();

  // 5. Look up the star using the Token ID and get its name
  let starLookUp = await instance.lookUptokenIdToStarInfo(starId);

  // 6. Assert that the contract name, symbol, and star name match the expected values
  assert.equal(ContractName, "SonNH65 Token", "Contract name should match");
  assert.equal(ContractSymbol, "VND", "Contract symbol should match");
  assert.equal(starLookUp, starName, "Star name should match");
});

it("lets 2 users exchange stars", async () => {
  // 1. Deploy the Smart Contract
  let instance = await StarNotary.deployed();

  // 2. Define user accounts and star IDs
  let user1 = accounts[0];
  let user2 = accounts[1];
  let starId1 = 7;
  let starId2 = 8;

  // 3. Create two stars with different tokenId
  await instance.createStar("Star 1", starId1, { from: user1 });
  await instance.createStar("Star 2", starId2, { from: user2 });

  // 4. Approve star transfers between users
  await instance.approve(user2, starId1, { from: user1 });
  await instance.approve(user1, starId2, { from: user2 });

  // 5. Call the exchangeStars function implemented in the Smart Contract
  await instance.exchangeStars(starId1, starId2, { from: user1 });

  // 6. Check the new owners of the stars
  let newOwner1 = await instance.ownerOf.call(starId1);
  let newOwner2 = await instance.ownerOf.call(starId2);

  // 7. Verify that the owners have changed
  assert.equal(newOwner1, user2, "Owner of Star 1 should be user2");
  assert.equal(newOwner2, user1, "Owner of Star 2 should be user1");
});

it("lets a user transfer a star", async () => {
  // 1. Deploy the Smart Contract
  let instance = await StarNotary.deployed();

  // 2. Define user accounts and star ID
  let user1 = accounts[0];
  let user2 = accounts[1];
  let starId = 9;

  // 3. Create a star with a different tokenId
  await instance.createStar("Star 1", starId, { from: user1 });

  // 4. Use the transferStar function implemented in the Smart Contract
  await instance.transferStar(user2, starId, { from: user1 });

  // 5. Verify that the star owner has changed
  let newStarOwner = await instance.ownerOf.call(starId);

  // 6. Assert that the star owner has changed to user2
  assert.equal(newStarOwner, user2, "Star owner should be user2");
});