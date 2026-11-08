const { z } = require("zod");

const port = z.coerce
  .number({ message: "Port must be a number" })
  .int()
  .min(1)
  .max(65535);

const ownerName = z.string({ message: "Owner name is required to run server" });

const ownerAge = z.coerce.number({ message: "Age must be a number" }).int();

const ownerEmail = z
  .string({ message: "Owner Email is required to run server" })
  .trim()
  .toLowerCase()
  .pipe(z.email("Invalid email"));

const ownerPassword = z.string({
  message: "Owner Password is required to run server",
});

const ownerAvatar = z.string({
  message: "Owner Avatar Photo is required to run server",
});

const mongodbUriMsg = "MONGODB_URI is required";
const mongodbUri = z
  .string({ message: mongodbUriMsg })
  .trim()
  .min(1, mongodbUriMsg);

const envSchema = z.object({
  PORT: port,
  MONGODB_URI: mongodbUri,
  OWNER_NAME: ownerName,
  OWNER_AGE: ownerAge,
  OWNER_EMAIL: ownerEmail,
  OWNER_PASSWORD: ownerPassword,
  OWNER_AVATAR: ownerAvatar,
});

const runEnvSchema = (data) => {
  const _data = envSchema.safeParse(data);
  return _data.success;
};

module.exports = {
  runEnvSchema,
  envSchema,
};
