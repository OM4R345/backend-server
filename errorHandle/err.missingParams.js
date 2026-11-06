const missingParams = function (params) {
  const missing = Object.entries(params)
    .filter(([, value]) => value == null)
    .map(([name]) => name);

  if (!missing.length) return null;

  const names =
    missing.length === 1
      ? missing[0]
      : `${missing.slice(0, -1).join(", ")} and ${missing.at(-1)}`;

  return `${names} ${missing.length === 1 ? "is" : "are"} required`;
};

module.exports = missingParams;
