const { User } = require("../../database/database.js");
const toPublicData = require("../../utilities/toPublicData.js");
const { pwToHash } = require("../../utilities/password.js");

const resetPw = async (req, res, next) => {
  try {
    const sub = req.decoded.sub;
    const oldPw = await User.getUserById(sub, true)?.password;
    const oldPassword = req.valid.body.oldPassword;
    const newPassword = req.valid.body.newPassword;
    const confirmPassword = req.valid.body.confirmPassword;

    if (oldPassword !== oldPw) {
      return res
        .status(400)
        .json({ status: "fail", message: "Old Password is wrong." });
    }
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ status: "fail", message: "confirm Password is wrong" });
    }

    const hashedPw = await pwToHash(newPassword);
    const data = await User.setDataById(sub, {
      password: hashedPw,
    });
    return res.status(200).json({
      status: "success",
      data: toPublicData(data, ["__v", "_id", "updatedAt"], true),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = resetPw;
