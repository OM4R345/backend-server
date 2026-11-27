const { readdir } = require("fs/promises");
const { join } = require("path");
const timeConverter = require("../../utilities/time/timeConverter");
const map = new Map();

const reading = async (type) => {
  return await readdir(join(__dirname, "../../keys", type));
};

const retiredVersions = async (type, removeNew = false) => {
  try {
    const _type = type.toLowerCase().trim();
    if (!/^(private|public)$/.test(_type)) {
      throw new Error("key type is required.");
    }

    let versions = [];
    if (!map.has(_type)) {
      const dir = await reading(_type);
      if (dir.length === 0) return null;
      const check = dir.filter((n) => /^v\d+$/.test(n));
      if (!check.indexOf(true)) {
        return null;
      }

      const listOfVersions = dir
        .map((name) => name.match(/\d+/)?.[0])
        .filter(Boolean)
        .map(Number);

      const sorted = listOfVersions.sort((a, b) => a - b);
      if (removeNew) sorted.pop();
      versions = sorted;
    } else {
      versions = map.get(_type);
    }

    map.set(_type, versions);
    setTimeout(() => map.delete(_type), timeConverter("3m")).unref();
    return versions;
  } catch (err) {
    if (err.code === "ENOENT") {
      return [0];
    }
    throw new Error(err.message);
  }
};

module.exports = retiredVersions;
