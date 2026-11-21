const crypto = require("crypto");

const genPhotoName = (file) => {
  if (!file) throw new Error("avatar file is required.");
  return `avatar-${Date.now()}-${crypto.randomUUID()}.${file.ext}`;
};

module.exports = genPhotoName;
