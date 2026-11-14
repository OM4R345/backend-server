const genKeys = require("../utilities/genKeys");
const { savePrivateKey, sendPublicKey, newKid } = require("./keysHandle");
const { rm } = require("fs/promises");
const path = require("path");

const { privateKey, publicKey } = genKeys();
const kid = await newKid();
const wk_secret = process.env.WK_SECRET;

const rotateKeys = async () => {
  const saved = await savePrivateKey(privateKey, kid, {
    deleteOld: true,
    timeout: 10 * 60 * 1000,
  }).catch((err) => {
    throw new Error(err.message);
  });

  const data = await sendPublicKey(
    "http://localhost:4000/rotateKey",
    publicKey,
    wk_secret,
    { kid, alg: "RS256", kty: "RSA", use: "sig" },
    true,
  ).catch((err) => async () => {
    return (async () => {
      await rm(path.join(__dirname, "..", "keys", kid), { force: true });
      throw err;
    })();
  });
  return { saved, data };
};

module.exports = rotateKeys;
