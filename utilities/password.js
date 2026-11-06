const bcrypt = require("bcryptjs");

const pwToHash = async (password, salt) => {
  const genSalt = salt || 12;
  const hashed = await bcrypt.hash(password, genSalt);
  return hashed;
};

const compareHash = async (password, hashedPassword) => {
  const compared = await bcrypt.compare(password, hashedPassword);
  return compared;
};

module.exports = {
  pwToHash,
  compareHash,
};
