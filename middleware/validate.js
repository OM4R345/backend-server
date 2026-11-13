const schemas = require("../schemas/validate.schema");
const organizer = require("../utilities/organizer");
const TARGETS = new Set(["body", "query", "params"]);

const validate = (...pairs) => {
  if (pairs.length === 0) {
    throw new Error(
      "validate: at least one [target, schemaName] pair is required",
    );
  }

  const seen = new Set();
  const resolved = [];

  for (const pair of pairs) {
    if (!Array.isArray(pair) || pair.length !== 2) {
      throw new Error(
        "validate: each argument must be a [target, schemaName] pair",
      );
    }
    const [target, name] = pair;
    if (!TARGETS.has(target)) {
      throw new Error(
        `validate: invalid target "${target}" (use body | query | params)`,
      );
    }
    if (seen.has(target)) {
      throw new Error(`validate: duplicate target "${target}"`);
    }
    const schema = Object.hasOwn(schemas, name) ? schemas[name] : undefined;
    if (typeof schema?.safeParse !== "function") {
      throw new Error(
        `validate: schema "${name}" not found (target "${target}")`,
      );
    }
    seen.add(target);
    resolved.push([target, schema]);
  }

  return (req, res, next) => {
    req.valid = {};
    for (const [target, schema] of resolved) {
      const result = schema.safeParse(req[target] ?? {});
      if (!result.success) {
        return res
          .status(400)
          .json({ status: "fail", error: organizer(result) });
      }
      req.valid[target] = result.data;
    }
    next();
  };
};

module.exports = validate;
