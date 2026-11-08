const { z } = require("zod");
const {
  nameField,
  ageField,
  passwordField,
  emailField,
} = require("./zod.user.js");

const schemas = {
  signUp: z.strictObject({
    name: nameField,
    age: ageField,
    email: emailField,
    password: passwordField,
  }),
  login: z.strictObject({
    email: emailField,
    password: z.string({ message: "password is required" }).min(8).trim(),
  }),
  changeEmail: z.strictObject({
    newEmail: emailField,
  }),
  resetPassword: z.strictObject({
    oldPassword: z.string().trim(),
    newPassword: passwordField,
    confirmPassword: z.string().trim(),
  }),
  editData: z
    .strictObject({
      name: nameField,
      age: ageField,
    })
    .partial()
    .refine((o) => Object.keys(o).length > 0, "at least one field is required"),
  deleteUser: z.strictObject({
    email: emailField,
  }),
};

module.exports = schemas;
