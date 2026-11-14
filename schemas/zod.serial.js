const { z } = require("zod");

const schema = z.strictObject({
  publicKey: z
    .string({ message: "publicKey is required" })
    .trim()
    .max(2000, "publicKey is too long")
    .regex(
      /^-----BEGIN PUBLIC KEY-----[\s\S]+-----END PUBLIC KEY-----$/,
      "publicKey is invalid",
    ),
  kid: z
    .string({ message: "kid is required" })
    .trim()
    .regex(/^key-v\d{1,6}$/, "kid is invalid"),
  kty: z.enum(["RSA"], { message: "kty is invalid" }),
  alg: z.enum(Object.keys(ALGS), { message: "alg is invalid" }),
  use: z.enum(USE, { message: "use is invalid" }),
  ts: z.coerce.int().positive(),
});

module.exports = schema;
