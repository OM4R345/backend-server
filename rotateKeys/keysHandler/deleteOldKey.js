const { rm, lstat } = require("fs/promises");

const deleteOldKey = async (keyDirPath) => {
  keyDirPath = keyDirPath.trim().toLowerCase();
  const dirlstat = await lstat(keyDirPath);
  if (!dirlstat.isDirectory()) throw new Error("path is not dir.");
  if (/^(private|public|keys)$/i.test(keyDirPath))
    throw new Error(`You cannot remove parent dir ${keyDirPath}`);

  await rm(keyDirPath, { recursive: true }).catch((err) => {
    throw new Error(err.message);
  });
};

module.exports = deleteOldKey;
