const retiredVersions = require("./retiredVersions");

const newKid = async () => {
  const privateV = (await retiredVersions("private"))?.at(-1);
  const publicV = (await retiredVersions("public"))?.at(-1);
  const version = Math.min(privateV ?? 0, publicV ?? 0) + 1;
  const templete = `key-v${version}`;
  return [templete, version];
};

module.exports = newKid;
