const crypto = require("crypto");
const { join } = require("path");
const { readdir, rm } = require("fs/promises");
const { writeFile } = require("fs/promises");
const missingParams = require("../errorHandle/err.missingParams");
const serializor = require("./serializor");

const sendPublicKey = async (
  url,
  publicKey,
  secret,
  keyData = { kid, kty, alg, use },
  rawBody = { body, headers },
) => {
  if (!url || !publicKey || !secret || !keyData) {
    throw new Error(
      `${missingParams({ url, publicKey, secret, ...keyData })} required.`,
    );
  }
  const { kid, kty, alg, use } = keyData;
  if (!rawBody) throw new Error("rawBody param is required.");
  let _headers, _body;
  if (rawBody === true) {
    ts = Date.now();
    sig = crypto
      .createHmac("sha256", secret)
      .update(`${publicKey}.${kid}.${kty}.${alg}.${use}.${ts} }`)
      .digest("hex");

    _headers = {
      "x-sig": sig,
      "x-ts": ts,
      "x-order": "publicKey.kid.kty.alg.use.ts",
    };
    _body = {
      publicKey,
      kid,
      kty,
      alg,
      use,
    };
  }

  const { body, headers } =
    rawBody && rawBody !== true ? rawBody : { _body, _headers };

  return await fetch(url, {
    headers: headers,
    method: "POST",
    body: JSON.stringify(body),
  }).then((data) => data.json());
};

const retiredVersions = async (deleteNew = false) => {
  const dir = await readdir(join(__dirname, "..", "keys"));
  const listOfVersions = dir.filter((name) => Number(name.match(/-\d+/)?.[0]));

  const sorted = listOfVersions.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  if (deleteNew) sorted.pop();
  return sorted;
};

const savePrivateKey = async (
  privateKey,
  filename,
  { deleteOld = false, timeout = 0 },
) => {
  if (!privateKey || !filename) {
    throw new Error(`${missingParams({ privateKey, filename })} required.`);
  }

  const keysPath = join(__dirname, "..", "keys");
  if (deleteOld) {
    const oldVersions = await retiredVersions(true);

    const cb = async () => {
      return await Promise.all(
        oldVersions.map(
          async (v) =>
            await rm(join(keysPath, v), { force: true }).catch((err) => {
              throw new Error(err.message);
            }),
        ),
      );
    };
    if (timeout && !isNaN(timeout)) {
      setTimeout(cb(), timeout);
    } else {
      cb();
    }
  }

  return await writeFile(join(keysPath, filename), privateKey, {
    flag: "wx",
  });
};

const newKid = async () => {
  const versions = await retiredVersions();
  return `private-key-v${versions.at(-1) + 1}.pem`;
};

module.exports = {
  sendPublicKey,
  savePrivateKey,
  newKid,
};
