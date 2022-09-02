// @ts-nocheck
'use strict';

const { Gateway } = require('fabric-network');
const path = require('path');
const { buildCCP, buildWallet } = require('./helper');

exports.openGateway = async () => {
  try {
    const ccp = buildCCP();
    const org = ccp.client.organization;
    // load/setup the wallet
    const wallet = await buildWallet(path.join(__dirname, 'wallet'));
    // const walletContent = await wallet.list()
    // console.log("walletContent:::::::::", walletContent)
    const gateway = new Gateway();
    // The user will now be able to create connections to the fabric network and be able to
    // submit transactions and query. All transactions submitted by this gateway will be
    // signed by this user using the credentials stored in the wallet.
    const clientId = `${org}.client`;
    const clientIdentity = await wallet.get(clientId);
    // console.log('clientIdentity: ', clientIdentity);
    await gateway.connect(ccp, {
      wallet: wallet,
      identity: clientIdentity,
      discovery: {
        enabled: true,
        asLocalhost: false,
      },
    });
    return gateway;
  } catch (error) {
    console.error(`Error in gateway setup: ${error}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
};
