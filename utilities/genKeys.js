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

  const epPath = "../endpoint-server/public.pem";
  if (fs.existsSync(path.dirname(path.join(__dirname, epPath)))) {
    fs.writeFileSync(path.join(__dirname, epPath), publicKey);
  }

  return publicKey;
};

module.exports = genKeys;
