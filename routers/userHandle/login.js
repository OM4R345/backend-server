const { User } = require("../../database/database.js");
const toPublicData = require("../../utilities/toPublicData.js");
const { signToken } = require("../../middleware/jwt.js");
const fs = require("node:fs");
const privateKey = fs.readFileSync("./private.pem", "utf-8");
const { compareHash } = require("../../utilities/password.js");

const login = async (req, res, next) => {
  try {
    const userData = req.userData
      ? req.userData
      : await User.getUser(req.valid.body.email, true);

    if (!userData) {
      return res
        .status(400)
        .json({ status: "fail", message: "invalid email or password" });
    }

    const cleanData = toPublicData(
      userData,
      ["password", "__v", "_id", "updatedAt"],
      true,
    );

    if (!(await compareHash(req.valid.body.password, userData.password))) {
      return res.status(400).json({
        status: "fail",
        message: "invalid email or password",
      });
    }

    const token = await signToken(
      {
        name: userData.name,
        age: userData.age,
        email: userData.email,
        role: userData.role,
      },
      privateKey,
      {
        subject: userData._id.toString(),
        audience: "urn:frontend",
        issuer: "http://localhost:3000",
      },
    );

    if (userData && token) {
      return res.status(200).json({
        status: "success",
        data: cleanData,
        token,
      });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = login;
