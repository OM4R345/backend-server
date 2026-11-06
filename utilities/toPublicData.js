const missingParams = require("../errorHandle/err.missingParams");
const toPublicData = (userData, filter, exclude = false) => {
  if (!userData || !filter) {
    const msg = missingParams({ userData, filter });
    throw new Error(`Destructor fn: ${msg} required.`);
  }

  const objectData = userData.toObject ? userData.toObject() : userData;
  return Object.fromEntries(
    Object.entries(objectData).filter(([key]) =>
      exclude ? !filter.includes(key) : filter.includes(key),
    ),
  );
};

module.exports = toPublicData;
