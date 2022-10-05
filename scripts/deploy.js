const {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateFlow,
  ContractFunctionParameters,
  TokenId,
  Hbar
} = require('@hashgraph/sdk');
const fs = require('fs');

require('dotenv').config()

const accountId = AccountId.fromString(process.env.ACCOUNT_ID)
const privateKey = PrivateKey.fromString(process.env.PRIVATE_KEY)
const env = PrivateKey.fromString(process.env.ENVIRONMENT)
const client = Client.forTestnet().setOperator(accountId, privateKey)
  .setMaxQueryPayment(new Hbar(20))

const treasuryId = AccountId.fromString(process.env.ACCOUNT_ID)
const token = TokenId.fromString(process.env.TOKEN_ID)
let contractId
let contractAddress
const addressRegex = /(\d+\.\d+\.[1-9]\d+)/i;
const contractName = process.env.CONTRACT_NAME ?? null;
const gasLimit = 10000000;

async function contractDeployFcn(bytecode, gasLim) {
  const contractCreateTx = new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(gasLim)
    .setInitialBalance(20)
    .setConstructorParameters(
      new ContractFunctionParameters().addAddress(token.toSolidityAddress()),
    );
  const contractCreateSubmit = await contractCreateTx.execute(client);
  const contractCreateRx = await contractCreateSubmit.getReceipt(client);
  contractId = contractCreateRx.contractId;
  contractAddress = contractId.toSolidityAddress();
}

const main = async () => {
  if (contractName === undefined || contractName == null) {
    console.log('Environment required, please specify CONTRACT_NAME for ABI in the .env file');
    return;
  }


  console.log('\n-Using ENIVRONMENT:', env);
  console.log('\n-Using Operator:', operatorId.toString());

  if (env.toUpperCase() == 'TEST') {
    client = Client.forTestnet();
    console.log('deploying in *TESTNET*');
  }
  else if (env.toUpperCase() == 'MAIN') {
    client = Client.forMainnet();
    console.log('deploying in *MAINNET*');
  }
  else {
    console.log('ERROR: Must specify either MAIN or TEST as environment in .env file');
    return;
  }

  client.setOperator(operatorId, operatorKey);

  const json = JSON.parse(fs.readFileSync(`./artifacts/contracts/${contractName}.sol/${contractName}.json`));

  const contractBytecode = json.bytecode;

  console.log('\n- Deploying contract...', contractName);
  const gasLimit = 800000;

  const [contractId, contractAddress] = await contractDeployFcn(contractBytecode, gasLimit);

  console.log(`Contract created with ID: ${contractId} / ${contractAddress}`);

};

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });