const retiredVersions = require("./retiredVersions");

const removedVersions = async (
  type,
  count = 1,
  removeNew = true,
  returnNumbers = false,
) => {
  if (!type) throw new Error("Type is required.");
  const keyDir = await retiredVersions(type, !removeNew);
  const end = keyDir.length - count;
  const sliced = keyDir.slice(0, end);

  if (!returnNumbers) {
    return sliced.map((v) => `v${v}`);
  }
  return sliced;
};

module.exports = removedVersions;
