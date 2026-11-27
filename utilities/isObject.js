const { z } = require("zod");

const isObject = (data) => {
  if (!data) throw new Error("data is required.");
  const isObject = z.object();
  const result = isObject.safeParse(data);
  if (result.success) return true;
  else return false;
};

module.exports = isObject;
