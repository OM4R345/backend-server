const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const genKeys = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  fs.writeFileSync(path.join(__dirname, "/public.pem"), publicKey);
  fs.writeFileSync(path.join(__dirname, "/private.pem"), privateKey);

  return publicKey;
};

module.exports = genKeys;
