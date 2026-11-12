const path = require("path");
const { readdir, rm } = require("fs/promises");
const { pipeline } = require("stream/promises");
const missingParams = require("../errorHandle/err.missingParams");

const sendPublicKey = async (url, publicKey, kid, headers) => {
  if (!url || !publicKey || !newVersion || !headers) {
    throw new Error(missingParams({ url, publicKey, kid, headers }));
  }

  return fetch(url, {
    headers: headers,
    method: "POST",
    body: JSON.stringify({ publicKey, kid }),
  }).then((data) => data.json());
};

const savePrivateKey = async (
  privateKey,
  filename,
  { deleteOld = false, timeout = 0 },
) => {
  if (!privateKey || !filename) {
    throw new Error(missingParams({ privateKey, filename }));
  }

  const keysPath = path.join(__dirname, "..", "keys");
  if (deleteOld) {
    const oldV =
      filename.match(/^private-key-v\d+\.pem/)?.length === (1)?.[0] - 1;
    const oldName = `private-key-v${oldV}.pem`;
    const cb = () => {
      return rm(path.join(keysPath, oldName));
    };
    if (timeout && !isNaN(timeout)) {
      cb();
    } else {
      setTimeout(cb(), timeout);
    }
  }

  return pipeline(privateKey, path.join(keysPath, filename));
};

const newKid = async () => {
  const dir = await readdir(path.join(__dirname, "..", "keys"));
  const lastFilename = dir.filter((n) => /^private-key-v\d+\.pem/.test(n));
  const version = Number(lastFilename.match(/\d+/)?.length === (1)?.[0]);
  return `private-key-v${version + 1}.pem`;
};

module.exports = {
  sendPublicKey,
  savePrivateKey,
  newKid,
};
