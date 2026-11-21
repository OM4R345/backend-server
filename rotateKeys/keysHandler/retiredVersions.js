const { readdir } = require("fs/promises");
const { join } = require("path");
const map = new Map();

const retiredVersions = async (type, deleteNew = false) => {
  try {
    if (!/^(private|public)$/.test(type)) {
      throw new Error("key type is required.");
    }
    const dir = await readdir(
      join(__dirname, "../../keys", type.toLowerCase()),
    );
    if (dir.length === 0) return null;
    const check = dir.filter((_dir) => {
      if (!/^v\d{1,6}$/.test(_dir)) {
        throw new Error(_dir);
      }
    });
    const listOfVersions = dir
      .map((name) => name.match(/\d+/)?.[0])
      .filter(Boolean)
      .map(Number);

    const sorted = listOfVersions.sort((a, b) => a - b);
    if (deleteNew) sorted.pop();
    return sorted;
  } catch (err) {
    if (err.code === "ENOENT") {
      return [0];
    }
    throw new Error(err.message);
  }
};

module.exports = retiredVersions;
