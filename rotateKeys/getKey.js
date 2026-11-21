const { readFile } = require("node:fs/promises");
const { join } = require("node:path");
const retiredVersions = require("./keysHandler/retiredVersions");
const map = new Map();

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
    .match(/^(private|public)$/)[0];
  const versions = await retiredVersions(type);
  const newest = versions?.at(-1);
  const ext = metadata ? "json" : "pem";
  const _type = metadata ? "metadata" : _dir;
  const name = `${_type}-v${newest}.${ext}`;

  const filePath = join(__dirname, "../../keys", _dir, `v${newest}`, name);

  if (options && Number.isFinite(ttl) && ttl > 0 && !metadata) {
    if (!map.get(name)) {
      map.set(name, await readKey(filePath));
      const timer = setTimeout(() => map.delete(name), ttl).unref();
      return map.get(name);
    } else {
      return map.get(name);
    }
  }

  return await readKey(filePath);
};

(async () => {
  const type = "public";
  console.log(await getKey(type, false, false));
})();
module.exports = getKey;
