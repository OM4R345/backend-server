const { rm, lstat } = require("fs/promises");

const deleteOldKey = async (keyDirPath) => {
  const dirlstat = await lstat(keyDirPath);
  if (!dirlstat.isDirectory()) throw new Error("path is not dir.");
  await rm(keyDirPath, { recursive: true }).catch((err) => {
    throw new Error(err.message);
  });
};

module.exports = deleteOldKey;
