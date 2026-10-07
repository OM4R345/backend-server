const { pwToHash } = require("./password.js");

const createdOwner = async (schema) => {
  try {
    const ownerEmail = process.env.OWNER_EMAIL;
    const ownerExists = await schema.findOne({ email: ownerEmail });

    if (!ownerExists) {
      await schema.create({
        name: process.env.OWNER_NAME,
        age: process.env.OWNER_AGE,
        email: ownerEmail,
        password: await pwToHash(process.env.OWNER_PASSWORD),
        role: "owner",
        avatar: process.env.OWNER_AVATAR,
      });
      console.log(`Done create owner: ${process.env.OWNER_EMAIL}`);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = createdOwner;
