'use strict';

const http = require('http');
const express = require('express');
const { BLUE, RESET, PORT } = require('./constants');
const { createCryptoMaterial } = require('./dlt/fabric-ca');
const {
  GetAllAssets,
  ReadAsset,
  CreateAsset,
  TransferAsset,
} = require('./handlers');

async function main() {
  console.log(`${BLUE} ************ START ************ ${RESET}`);
  const app = express();
  app.use(express.json());
  app.get('/assets', GetAllAssets);
  app.get('/assets/:id', ReadAsset);
  app.post('/assets', CreateAsset);
  app.post('/assets/transfer', TransferAsset);
  const server = http.createServer(app);
  server.listen(PORT, async function () {
    // run this only once
    // await createCryptoMaterial();
    console.log(
      `${BLUE} ---------------------  app up on port:${PORT} ---------------------${RESET}`
    );
  });
  console.log(`${BLUE} ************ END ************ ${RESET}`);
}

main();
