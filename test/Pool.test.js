console.clear()
const {
  ContractId,
  ContractFunctionParameters,
  ContractExecuteTransaction,
  TokenCreateTransaction,
  TokenId,
  AccountId,
  PrivateKey,
  Client,
  ContractCallQuery,
  Hbar,
  TokenSupplyType,
  TokenType,
  ContractCreateFlow
} = require('@hashgraph/sdk')
const fs = require('fs');
// const Web3 = require('web3');
// const web3 = new Web3();
const { expect } = require('chai');
const { describe, it, after } = require('mocha');

require('dotenv').config();

const accountId = AccountId.fromString(process.env.ACCOUNT_ID)
const privateKey = PrivateKey.fromString(process.env.PRIVATE_KEY)
const client = Client.forTestnet().setOperator(accountId, privateKey)
  .setMaxQueryPayment(new Hbar(20))

const treasuryId = AccountId.fromString(process.env.ID_1)
const treasuryKey = PrivateKey.fromString(process.env.KEY_1)
const token = TokenId.fromString(process.env.TOKEN_ID)
let contractId
let contractAddress
const addressRegex = /(\d+\.\d+\.[1-9]\d+)/i;
const contractName = process.env.CONTRACT_NAME ?? null;
const gasLimit = 10000000;

let token1
let token2

let numOfParticipants

let abi


describe('Deployment', () => {
  it('Should create token 1', async () => {
    token1 = await createFt('token1', 'tkn1')
  })
  it('Should create token 2', async () => {
    token2 = await createFt('token2', 'tkn2')
  })

  it('Should deploy contract and assoicate 2x newly created tokens', async () => {
    const json = JSON.parse(fs.readFileSync(`./artifacts/contracts/${contractName}.sol/${contractName}.json`));
    // import ABI
    abi = json.abi;
    const contractBytecode = json.bytecode;
    console.log('\n- Deploying contract...', contractName, '\n\tgas@', gasLimit);
    await contractDeployFcn(contractBytecode, gasLimit);
    console.log(`Contract created with ID: ${contractId} / ${contractAddress}`);
    expect(contractId.toString().match(addressRegex).length == 2).to.be.true;
  })
})

async function contractDeployFcn(bytecode, gasLim) {
  const contractCreateTx = new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(gasLim)
    .setInitialBalance(20)
    .setConstructorParameters(
      new ContractFunctionParameters()
        .addAddress(token1.toSolidityAddress())
        .addInt64(1200000)
        .addAddress(token2.toSolidityAddress())
        .addInt64(1200000)
    );
  const contractCreateSubmit = await contractCreateTx.execute(client);
  const contractCreateRx = await contractCreateSubmit.getReceipt(client);
  contractId = contractCreateRx.contractId;
  contractAddress = contractId.toSolidityAddress();
}

async function createFt(name, symbol) {
  // CREATE FUNGIBLE TOKEN (STABLECOIN)
  let tokenCreateTx = new TokenCreateTransaction()
    .setTokenName(name)
    .setTokenSymbol(symbol)
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(2)
    .setInitialSupply(10000)
    .setTreasuryAccountId(treasuryId)
    .setSupplyType(TokenSupplyType.Infinite)
    .setSupplyKey(treasuryKey)
    .freezeWith(client);

  //SIGN WITH TREASURY KEY
  let tokenCreateSign = await tokenCreateTx.sign(treasuryKey);

  //SUBMIT THE TRANSACTION
  let tokenCreateSubmit = await tokenCreateSign.execute(client);

  //GET THE TRANSACTION RECEIPT
  let tokenCreateRx = await tokenCreateSubmit.getReceipt(client);

  //GET THE TOKEN ID
  let tokenId = tokenCreateRx.tokenId;

  //LOG THE TOKEN ID TO THE CONSOLE
  console.log(`- Created token with ID: ${tokenId} \n`);
  return TokenId.fromString(tokenId)
}