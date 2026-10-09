const { z } = require("zod");

const emailField = z
  .string({ message: "email is required" })
  .trim()
  .toLowerCase()
  .email("invalid email");

const schemas = {
  "post /user/sign-up": z.strictObject({
    name: z
      .string({ message: "name is required" })
      .trim()
      .min(3, "name is short than 3 chars")
      .max(30, "name is too long"),
    age: z.coerce
      .number({ message: "age must be a number" })
      .int()
      .gte(16, "you are younger than 16 years"),
    email: emailField,
    password: z
      .string({ message: "password is required" })
      .min(8, "password is too short")
      .max(72, "password is too long")
      .regex(/[a-z]/, "add a lowercase letter")
      .regex(/[A-Z]/, "add an uppercase letter")
      .regex(/\d/, "add a number")
      .regex(/[^A-Za-z0-9]/, "add a symbol"),
  }),
  "post /user/login": z.strictObject({
    email: emailField,
    password: z.string({ message: "password is required" }).min(8),
  }),
};

module.exports = validate = (req, res, next) => {
  const key = `${req.method} ${req.baseUrl}${req.path}`
    .replace(/\/+$/, "")
    .toLowerCase();
  const schema = schemas[key];
  if (!schema) return next();

  const result = schema.safeParse(req.body ?? {});

  if (!result.success) {
    return res.status(400).json({
      status: "fail",
      errors: result.error.issues.map((i) => ({
        field: i.path.join(".") || (i.keys ? i.keys.join(", ") : ""),
        message: i.message,
      })),
    });
  }
  req.body = result.data;
  next();
};
