const { z } = require("zod");

const nameField = z
  .string({ message: "name is required" })
  .trim()
  .min(3, "name is short than 3 chars")
  .max(30, "name is too long")
  .refine((v) => v.split(" ").length >= 2, "Name must be two generations");

const ageField = z.coerce
  .number({ message: "age must be a number" })
  .trim()
  .int()
  .gte(16, "you are younger than 16 years");

const emailField = z
  .string({ message: "email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email({ pattern: z.regexes.html5Email, error: "Invalid email" }));

const passwordField = z
  .string({ message: "password is required" })
  .trim()
  .min(8, "password is too short")
  .refine((v) => Buffer.byteLength(v, "utf8") <= 72, "password is too long")
  .regex(/[a-z]/, "add a lowercase letter")
  .regex(/[A-Z]/, "add an uppercase letter")
  .regex(/\d/, "add a number")
  .regex(/[^A-Za-z0-9]/, "add a symbol");

module.exports = {
  nameField,
  ageField,
  emailField,
  passwordField,
};
