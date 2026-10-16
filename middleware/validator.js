const { z, email } = require("zod");

const emailField = z
  .string({ message: "email is required" })
  .trim()
  .toLowerCase()
  .email("invalid email");

const passwordField = z
  .string({ message: "password is required" })
  .min(8, "password is too short")
  .max(72, "password is too long")
  .regex(/[a-z]/, "add a lowercase letter")
  .regex(/[A-Z]/, "add an uppercase letter")
  .regex(/\d/, "add a number")
  .regex(/[^A-Za-z0-9]/, "add a symbol");

const nameField = z
  .string({ message: "name is required" })
  .trim()
  .min(3, "name is short than 3 chars")
  .max(30, "name is too long")
  .refine((v) => v.split(" ").length >= 2, "Name must be two generations");

const ageField = z.coerce
  .number({ message: "age must be a number" })
  .int()
  .gte(16, "you are younger than 16 years");

const schemas = {
  "post /user/sign-up": z.strictObject({
    name: nameField,
    age: ageField,
    email: emailField,
    password: passwordField,
  }),
  "post /user/login": z.strictObject({
    email: emailField,
    password: z.string({ message: "password is required" }).min(8),
  }),
  "patch /user/change-email": z.strictObject({
    newEmail: emailField,
  }),
  "patch /user/reset-password": z.strictObject({
    newPassword: passwordField,
    confirmPw: z.string(),
  }),
  "patch /user/change-email": z.strictObject({
    newEmail: emailField,
  }),
  "patch /user/edit-data": z.strictObject({
    name: nameField,
    age: ageField,
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
