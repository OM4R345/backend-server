const { join } = require("node:path");
const { writeFile, mkdir } = require("node:fs/promises");
const deleteOldKey = require("./deleteOldKey");
const retiredVersions = require("./retiredVersions");
const missingParams = require("../../errorHandle/err.missingParams");

const saveKey = async (key, metadata, timeout) => {
  if (!key || !metadata) {
    throw new Error(`${missingParams({ key, metadata })} required.`);
  }

  const check = ["type", "version", "ext"];
  for (let i = 0; i < check.length; i++) {
    if (!Object.hasOwn(metadata, check[i])) {
      throw new Error(`undefined property: ${check[i]}`);
    }
  }
  const { type, version: v, ext } = metadata;

  const checkMetadata = () => {
    const __type = /^(private|public)$/.test(type);
    const __ext = /^pem$/.test(ext);
    const __version = /^v\d{1,6}$/.test(v);
    if (!__type || !__ext || !__version) {
      const array = [__type, __ext, __version];
      throw new Error(`Invalid data: ${array.filter((v) => v === false)}`);
    }
  };
  checkMetadata();
  const keysPath = join(__dirname, "../../keys");
  const keyPath = join(keysPath, type, v);
  const _key = join(keyPath, `${type}-${v}.${ext}`);
  const _metadata = join(keyPath, `metadata-${v}.json`);

  const _saveKey = async () => {
    await writeFile(_key, key, "utf-8", {
      flag: "wx",
    });
  };
  const saveMetadata = async () => {
    await writeFile(_metadata, JSON.stringify(metadata, null, 2), "utf-8", {
      flag: "wx",
    });
  };

  await mkdir(keyPath, { recursive: true });
  const promise = await Promise.allSettled([_saveKey(), saveMetadata()]);
  const maped = promise.map((v) => {
    if (v.reason) {
      throw new Error(v.reason);
    }
  });

  if (timeout && Number.isFinite(timeout) && timeout > 0) {
    const dir = await retiredVersions(type, true);
    if (dir.length > 0) {
      const cb = async () =>
        dir.map(async (v) => await deleteOldKey(join(keysPath, type, `v${v}`)));
      if (timeout > 0) setTimeout(async () => await cb(), timeout);
      else await cb();
    }
  }
  return maped;
};

(async () => {
  const { publicKey } = require("./genKeys")();
  const _newKid = require("./newKid");
  const kid = await _newKid();
  const regex = /^(private|public)-(v\d{1,6})$/;
  const [, , publicVd] = kid[1].match(regex);
  const publicMetadata = {
    type: "public",
    version: publicVd,
    ext: "pem",
  };
  const v = await saveKey(publicKey, publicMetadata, false);
  console.log(v);
})();

module.exports = saveKey;
