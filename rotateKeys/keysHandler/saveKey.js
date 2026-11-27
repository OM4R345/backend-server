const { join } = require("node:path");
const { writeFile, mkdir } = require("node:fs/promises");
const missingParams = require("../../errorHandle/err.missingParams");

const saveKey = async (key, metadata) => {
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

  (function checkMetadata() {
    const __type = /^(private|public)$/.test(type);
    const __ext = /^pem$/.test(ext);
    const __version = /^v\d+$/.test(v);
    if (!__type || !__ext || !__version) {
      const array = [__type, __ext, __version];
      throw new Error(`Invalid data: ${array.filter((v) => v === false)}`);
    }
  })();

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
  const checkPromise = promise.map((v) => {
    if (v.reason) {
      throw new Error(v.reason);
    }
    return v.status === "fulfilled";
  });

  return checkPromise.indexOf(false) ? true : false;
};

module.exports = saveKey;
