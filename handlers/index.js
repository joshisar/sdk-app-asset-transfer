'use strict';

const {
  CHAINCODE_NAME,
  BLUE,
  RESET,
  GREEN,
  RED,
  CHANNEL_NAME,
} = require('../constants');
const { openGateway } = require('../dlt/gateway');
const { prettyJSONString } = require('../utils');

// GetAllAssets
exports.GetAllAssets = async (req, res) => {
  try {
    console.log(`${BLUE}--> GetAllAssets START ${RESET}`);
    const gateway = await openGateway();
    // @ts-ignore
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);
    const result = await contract.evaluateTransaction('GetAllAssets');
    if (`${result}` !== '') {
      console.log(
        `*** Result: ${prettyJSONString(result.toString())}`
      );
      const assets = JSON.parse(result.toString());
      res.send(assets);
    } else {
      res.status(200).json([]);
    }
    console.log(`${BLUE}--> GetAllAssets END ${RESET}`);
  } catch (err) {
    res.status(500).send({
      error: `${err.message}`,
    });
  }
};

// CreateAsset
exports.CreateAsset = async (req, res) => {
  try {
    console.log(`${BLUE}--> CreateAsset START ${RESET}`);
    const { id, asset_type, currency, value, owner } = req.body;
    const gateway = await openGateway();
    // @ts-ignore
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);
    const tx = await contract.submitTransaction(
      'CreateAsset',
      id,
      asset_type,
      currency,
      value,
      owner
    );
    if (`${tx.toString()}` !== '') {
      console.log(`*** Result: ${prettyJSONString(tx.toString())}`);
      res.send(JSON.parse(tx.toString()));
    } else {
      res.status(200).json('');
    }
    console.log(`${BLUE}--> CreateAsset END ${RESET}`);
  } catch (err) {
    res.status(500).send({
      error: `${err.message}`,
    });
  }
};

// UpdateAsset
exports.UpdateAsset = async (req, res) => {
  try {
    console.log(`${BLUE}--> UpdateAsset START ${RESET}`);
    const { id, asset_type, currency, value, owner } = req.body;
    const gateway = await openGateway();
    // @ts-ignore
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);
    const tx = await contract.submitTransaction(
      'UpdateAsset',
      id,
      asset_type,
      currency,
      value,
      owner
    );
    if (`${tx.toString()}` !== '') {
      console.log(`*** Result: ${prettyJSONString(tx.toString())}`);
      res.send(JSON.parse(tx.toString()));
    } else {
      res.status(200).json('');
    }
    console.log(`${BLUE}--> UpdateAsset END ${RESET}`);
  } catch (err) {
    res.status(500).send({
      error: `${err.message}`,
    });
  }
};

// ReadAsset
exports.ReadAsset = async (req, res) => {
  try {
    console.log(`${BLUE}--> ReadAsset START ${RESET}`);
    const id = req.params.id;
    const gateway = await openGateway();
    // @ts-ignore
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);
    const result = await contract.evaluateTransaction(
      'ReadAsset',
      id
    );
    if (`${result}` !== '') {
      console.log(
        `*** Result: ${prettyJSONString(result.toString())}`
      );
      res.send(JSON.parse(result.toString()));
    } else {
      res.status(200).json('');
    }
    console.log(`${BLUE}--> ReadAsset END ${RESET}`);
  } catch (err) {
    res.status(500).send({
      error: `${err.message}`,
    });
  }
};

// DeleteAsset
exports.DeleteAsset = async (req, res) => {
  try {
    console.log(`${BLUE}--> DeleteAsset START ${RESET}`);
    const id = req.params.id;
    const gateway = await openGateway();
    // @ts-ignore
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);
    const tx = await contract.submitTransaction('DeleteAsset', id);
    if (`${tx.toString()}` !== '') {
      console.log(`*** Result: ${prettyJSONString(tx.toString())}`);
      res.send(JSON.parse(tx.toString()));
    } else {
      res.status(200).json('');
    }
    console.log(`${BLUE}--> DeleteAsset END ${RESET}`);
  } catch (err) {
    res.status(500).send({
      error: `${err.message}`,
    });
  }
};

// TransferAsset
exports.TransferAsset = async (req, res) => {
  try {
    console.log(`${BLUE}--> TransferAsset START ${RESET}`);
    const { id, newOwner } = req.body;
    const gateway = await openGateway();
    // @ts-ignore
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);
    const tx = await contract.submitTransaction(
      'TransferAsset',
      id,
      newOwner
    );
    if (`${tx.toString()}` !== '') {
      console.log(`*** Result: ${prettyJSONString(tx.toString())}`);
      res.send(JSON.parse(tx.toString()));
    } else {
      res.status(200).json('');
    }
    console.log(`${BLUE}--> TransferAsset END ${RESET}`);
  } catch (err) {
    res.status(500).send({
      error: `${err.message}`,
    });
  }
};
