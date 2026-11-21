const { saveKey, newKid, genKeys } = require("./keysHandler");
const timeConverter = require("../utilities/time/timeConverter");

const rotateKeys = async () => {
  const { privateKey, publicKey } = genKeys();
  const [kid, Vd] = await newKid();

  const sharedMetadata = {
    kty: "RSA",
    alg: "RS256",
    ext: "pem",
    version: Vd,
    kid: kid,
    modulusLength: 2048,
    createdAt: new Date().toISOString(),
    status: "active",
  };

  const privateMetadata = {
    type: "private",
    ...sharedMetadata,
  };
  const publicMetadata = {
    type: "public",
    ...sharedMetadata,
  };

  const savePrivateKey = await saveKey(
    privateKey,
    privateMetadata,
    timeConverter("20s"),
  ).catch((err) => {
    throw new Error(err.message);
  });

  const savePublicKey = await saveKey(
    publicKey,
    publicMetadata,
    timeConverter("1m"),
  ).catch((err) => {
    throw new Error(err.message);
  });

  const _process = await Promise.allSettled([savePrivateKey, savePublicKey]);
  const status = _process.filter((key) => key.status === "fulfilled");
  return status;
};

(async () => {
  await rotateKeys();
})();
module.exports = rotateKeys;
