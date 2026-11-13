const crypto = require("crypto");
const genKeys = require("../utilities/genKeys");
const { savePrivateKey, sendPublicKey, newKid } = require("./keysHandle");

const ts = Date.now();
const { privateKey, publicKey } = genKeys();
const kid = newKid();
const wk_secret = process.env.WK_SECRET;
const sig = crypto
  .createHmac("sha256", wk_secret)
  .update(`${ts}.${publicKey}`)
  .digest("hex");

const data = await sendPublicKey(
  "http://localhost:4000/rotateKey",
  publicKey,
  { kid, alg: "RS256", kty: "RSA", use: "sig" },
  { "x-sig": sig, "x-ts": ts },
);

const saved = savePrivateKey(privateKey, kid, {
  deleteOld: true,
  timeout: 10 * 60 * 1000,
});
