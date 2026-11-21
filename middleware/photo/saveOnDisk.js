const { writeFile } = require("node:fs/promises");
const { join } = require("node:path");

const saveOnDisk = (file, filename) => {
  if (!file) {
    return "default-avatar.webp";
  }
  if (file && !filename) {
    throw new Error("saveOnDisk: filename is required");
  }
  const savePath = join(__dirname, "../../photos", filename);
  return writeFile(savePath, file.buffer);
};

module.exports = saveOnDisk;
