'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

/**
 * builds CCP
 */
exports.buildCCP = () => {
  // load the common connection configuration file
  const ccpPath = path.resolve(__dirname, 'ccp-json', `ccp.json`);
  const fileExists = fs.existsSync(ccpPath);
  if (!fileExists) {
    throw new Error(`no such file or directory: ${ccpPath}`);
  }
  const contents = fs.readFileSync(ccpPath, 'utf8');
  // build a JSON object from the file contents
  const ccp = JSON.parse(contents);
  console.log(
    `Loaded the network configuration located at ${ccpPath}`
  );
  return ccp;
};

/**
 * builds wallet for given path
 * @param walletPath
 */
exports.buildWallet = async (walletPath) => {
  // Create a new  wallet : Note that wallet is for managing identities.
  let wallet;
  if (walletPath) {
    wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Built a file system wallet at ${walletPath}`);
  } else {
    // wallet = await Wallets.newInMemoryWallet();
    // console.log('Built an in memory wallet');
    throw new Error(
      `not building in memory wallet, provided walletPath: ${walletPath}`
    );
  }
  return wallet;
};
