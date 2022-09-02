// @ts-nocheck
'use strict';

const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCCP, buildWallet } = require('./helper');

/**
 * creates wallet, enrols ca admin, and registers->enrols->imports basic role identities (admin, peer, client)
 */
exports.createCryptoMaterial = async () => {
  // build an in memory ccp object with the network configuration for given bank, and extract relevant info
  const ccp = buildCCP();
  const org = ccp.client.organization;
  const orgInfo = ccp.organizations[org];
  const ca = orgInfo.certificateAuthorities[0];
  const caInfo = ccp.certificateAuthorities[ca];
  // const peer = orgInfo.peers[0];
  // const peerInfo = ccp.peers[peer];

  // setup the wallet to hold the credentials of the bank users
  const wallet = await buildWallet(path.join(__dirname, 'wallet'));
  const caClient = buildCAClient(caInfo);
  console.log(`Built CA Client: ${caClient}`);
  const caAdminId = caInfo.registrar.enrollId;
  const caAdminPw = caInfo.registrar.enrollSecret;
  console.log(`caAdminId: ${caAdminId}`);
  console.log(`caAdminPw: ${caAdminPw}`);

  // C.A  A D M I N
  const cryptoSuite = caClient.getCryptoSuite();
  const caAdminPrivateKey = await cryptoSuite.generateKey();
  const caAdminCsr = caAdminPrivateKey.generateCSR(`CN=${caAdminId}`);
  // Enroll the CA's Admin so that we can use it for registering other users. (we don't register caAdmin)
  const caAdminEnrollmentRequest = {
    enrollmentID: caAdminId,
    enrollmentSecret: caAdminPw,
    csr: caAdminCsr,
  };
  await enrollUserMsp(
    wallet,
    caClient,
    caAdminPrivateKey,
    caAdminEnrollmentRequest,
    'ca'
  );

  // A D M I N
  const adminId = `${org}.admin`;
  const nodeAdminPrivateKey = await cryptoSuite.generateKey();
  const nodeAdminCsr = nodeAdminPrivateKey.generateCSR(
    `CN=${adminId}`
  );
  // Register and Enroll the Node's Admin, this user represents the organization.
  const nodeAdminEnrollmentRequest = {
    enrollmentID: adminId,
    enrollmentSecret: `${adminId}-pw`,
  };
  await createIdentity(
    wallet,
    caClient,
    { ...nodeAdminEnrollmentRequest, role: 'admin' },
    caAdminEnrollmentRequest.enrollmentID
  );
  await enrollUserTls(caClient, nodeAdminPrivateKey, {
    ...nodeAdminEnrollmentRequest,
    csr: nodeAdminCsr,
  });
  await enrollUserMsp(
    wallet,
    caClient,
    nodeAdminPrivateKey,
    { ...nodeAdminEnrollmentRequest, csr: nodeAdminCsr },
    orgInfo.mspid
  );

  // P E E R
  const peerId = `${org}.peer`;
  const nodePrivateKey = await cryptoSuite.generateKey();
  const nodeCsr = nodePrivateKey.generateCSR(`CN=${peerId}`);
  const nodeEnrollmentRequest = {
    enrollmentID: peerId,
    enrollmentSecret: `${peerId}-pw`,
  };
  await createIdentity(
    wallet,
    caClient,
    {
      ...nodeEnrollmentRequest,
      role: 'peer',
    },
    caAdminEnrollmentRequest.enrollmentID
  );
  await enrollUserTls(caClient, nodePrivateKey, {
    ...nodeEnrollmentRequest,
    csr: nodeCsr,
  });
  await enrollUserMsp(
    wallet,
    caClient,
    nodePrivateKey,
    { ...nodeEnrollmentRequest, csr: nodeCsr },
    orgInfo.mspid
  );

  // C L I E N T
  const clientId = `${org}.client`;
  const clientPrivateKey = await cryptoSuite.generateKey();
  const clientCsr = clientPrivateKey.generateCSR(`CN=${clientId}`);
  const clientEnrollmentRequest = {
    enrollmentID: clientId,
    enrollmentSecret: `${clientId}-pw`,
  };
  await createIdentity(
    wallet,
    caClient,
    {
      ...clientEnrollmentRequest,
      role: 'client',
    },
    caAdminEnrollmentRequest.enrollmentID
  );
  await enrollUserTls(caClient, clientPrivateKey, {
    ...clientEnrollmentRequest,
    csr: clientCsr,
  });
  await enrollUserMsp(
    wallet,
    caClient,
    clientPrivateKey,
    { ...clientEnrollmentRequest, csr: clientCsr },
    orgInfo.mspid
  );
};

/**
 * builds CaClient from given CA Info
 * @param caInfo
 */
function buildCAClient(caInfo) {
  // Create a new CA client for interacting with the CA.
  const caClient = new FabricCAServices(
    caInfo.url,
    {
      trustedRoots: caInfo.tlsCACerts.pem,
      // Set to false as temporary workaround for HLF CA, see https://github.com/hyperledger/fabric-sdk-node/issues/542
      verify: false,
    },
    caInfo.caName
  );
  return caClient;
}

/**
 * registers user with ca
 * @param wallet
 * @param caClient
 * @param registerRequest
 * @param caEnrollmentId
 */
async function createIdentity(
  wallet,
  caClient,
  registerRequest,
  caEnrollmentId
) {
  try {
    if (
      await isIdentityInWallet(wallet, registerRequest.enrollmentID)
    ) {
      return;
    }
    const caAdminIdentity = await isIdentityInWallet(
      wallet,
      caEnrollmentId
    );
    // Must use the CA's admin to register a new user
    if (!caAdminIdentity) {
      console.log(
        'An identity for the admin user does not exist in the wallet'
      );
      console.log('Enroll the admin user before retrying');
      return;
    }
    const caAdminProvider = wallet
      .getProviderRegistry()
      .getProvider(caAdminIdentity.type);
    const caAdminUser = await caAdminProvider.getUserContext(
      caAdminIdentity,
      caEnrollmentId
    );
    await caClient.register(
      {
        ...registerRequest,
        affiliation: '',
        maxEnrollments: -1,
      },
      caAdminUser
    );
    console.log(
      `Successfully registered user ${registerRequest.enrollmentID}`
    );
  } catch (error) {
    console.error(`Failed to register user : ${error}`);
  }
}

/**
 * checks for identity in wallet
 * @param wallet
 * @param identityId
 */
async function isIdentityInWallet(wallet, identityId) {
  // Check to see if we've already enrolled the user.
  const identity = await wallet.get(identityId);
  if (identity) {
    console.info(
      `An identity for the user '${identityId}' already exists in the wallet`
    );
    return identity;
  }
  return null;
}

/**
 * enrolls user TLS with ca
 * @param caClient
 * @param privateKey
 * @param enrollmentRequest
 */
async function enrollUserTls(
  caClient,
  privateKey,
  enrollmentRequest
) {
  let tlsCryptoMaterial;
  try {
    const tlsEnrollment = await caClient.enroll({
      ...enrollmentRequest,
      profile: 'tls',
    });
    console.info(
      `Successfully enrolled user tls ${enrollmentRequest.enrollmentID}`
    );
    tlsCryptoMaterial = {
      signcerts: tlsEnrollment.certificate,
      cacerts: tlsEnrollment.rootCertificate,
      keystore: privateKey.toBytes(),
    };
  } catch (error) {
    const message = `Failed to enroll user '${enrollmentRequest.enrollmentID}' with TLS profile: ${error}`;
    console.error(message);
  }
  return tlsCryptoMaterial;
}

/**
 * enrolls user MSP with ca
 * @param wallet
 * @param caClient
 * @param privateKey
 * @param enrollmentRequest
 * @param mspId
 */
async function enrollUserMsp(
  wallet,
  caClient,
  privateKey,
  enrollmentRequest,
  mspId
) {
  let mspCryptoMaterial;
  try {
    const enrollment = await caClient.enroll(enrollmentRequest);
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: privateKey.toBytes(),
      },
      mspId,
      type: 'X.509',
    };
    await wallet.put(enrollmentRequest.enrollmentID, x509Identity);
    console.info(
      `Successfully enrolled user msp ${enrollmentRequest.enrollmentID} and imported it in wallet`
    );
    mspCryptoMaterial = {
      signcerts: enrollment.certificate,
      cacerts: enrollment.rootCertificate,
      keystore: privateKey.toBytes(),
    };
  } catch (error) {
    const message = `Failed to enroll user '${enrollmentRequest.enrollmentID}': ${error}`;
    console.error(message);
  }
  return mspCryptoMaterial;
}
