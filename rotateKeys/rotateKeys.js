const crypto = require("crypto");
const genKeys = require("../utilities/genKeys");
const { savePrivateKey, sendPublicKey, newKid } = require("./keysHandle");

const ts = Date.now();
const { privateKey, publicKey } = genKeys();
const kid = newKid();
const wk_secret = process.env.WK_SECRET;
const sig = crypto
  .createHmac("sha256", wk_secret)
  .update(`${ts}.${body}`)
  .digest("hex");

sendPublicKey("http://localhost:4000", publicKey, kid, {
  "x-sig": sig,
  "x-ts": ts,
});

savePrivateKey(privateKey, kid, { deleteOld: true, timeout: 10 * 60 * 1000 });
