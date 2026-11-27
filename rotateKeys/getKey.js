const { readFile } = require("node:fs/promises");
const { join } = require("node:path");
const retiredVersions = require("./keysHandler/retiredVersions");
const keyCache = new Map();

const readKey = async (path) => {
  return await readFile(path, "utf-8").catch((err) => {
    throw new Error(err.message);
  });
};

const getKey = async (type, metadata = false, options = { ttl: 60 * 1000 }) => {
  if (!type) {
    throw new Error("Key type is required.");
  }
  const { ttl } = options;
  const _dir = type
    .toLowerCase()
    .trim()
    .match(/^(private|public)$/)?.[0];
  const versions = await retiredVersions(_dir);
  const newest = versions?.at(-1);
  const ext = metadata ? "json" : "pem";
  const _type = metadata ? "metadata" : _dir;
  const name = `${_type}-v${newest}.${ext}`;

  const filePath = join(__dirname, "../../keys", _dir, `v${newest}`, name);

  if (options && Number.isFinite(ttl) && ttl > 0 && !metadata) {
    if (!keyCache.has(name)) {
      const readedKey = await readKey(filePath);
      keyCache.set(name, readedKey);
      const timer = setTimeout(() => keyCache.delete(name), ttl).unref();
      return readedKey;
    } else {
      return keyCache.get(name);
    }
  }

  return await readKey(filePath);
};

module.exports = getKey;
