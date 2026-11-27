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
  };

  const privateMetadata = {
    type: "private",
    ...sharedMetadata,
  };
  const publicMetadata = {
    type: "public",
    ...sharedMetadata,
  };

  const savePublicKey = await saveKey(
    publicKey,
    publicMetadata,
    timeConverter("1m"),
  ).catch((err) => {
    throw new Error(err.message);
  });

  if (!savePublicKey) throw new Error("Rotation failed.");
  const savePrivateKey = await saveKey(
    privateKey,
    privateMetadata,
    timeConverter("20s"),
  ).catch((err) => {
    throw new Error(err.message);
  });
};

module.exports = rotateKeys;
