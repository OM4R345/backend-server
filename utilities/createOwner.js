const { User } = require("../database/database.js");
const { pwToHash } = require("./password.js");

const createdOwner = async () => {
  try {
    const ownerEmail = process.env.OWNER_EMAIL;
    const ownerExists = await User.findOne({ email: ownerEmail });

    if (!ownerExists) {
      await User.create({
        name: process.env.OWNER_NAME,
        age: process.env.OWNER_AGE,
        email: ownerEmail,
        password: await pwToHash(process.env.OWNER_PASSWORD),
        role: "owner",
        avatar: process.env.OWNER_AVATAR,
      });

      const username = ownerEmail.split("@")[0];
      const host = ownerEmail.split("@")[1];
      const finalName = `${username[0]}${"*".repeat(username.length - 3)}${username.slice(username.length - 2)}@${host}`;

      console.log(`Done create owner: ${finalName}`);
    }
  } catch (err) {
    console.error(err);
  }
};

module.exports = createdOwner;
