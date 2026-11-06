const { User } = require("../../database/database.js");
const toPublicData = require("../../utilities/toPublicData.js");

const changeEmail = (loginMiddleware) => {
  return async (req, res, next) => {
    try {
      const sub = req.decoded.sub;
      const newEmail = req.valid.body.newEmail?.trim();

      if (!newEmail) {
        return res
          .status(400)
          .json({ status: "fail", message: "Email is required" });
      }

      const checkEmail = await User.getUser(newEmail);
      if (checkEmail !== null) {
        return res
          .status(400)
          .json({ status: "fail", message: "Email is used" });
      }

      const data = await User.setDataById(sub, { email: newEmail });
      res.status(200).json({
        status: "success",
        data: toPublicData(data, ["__v", "_id", "updatedAt"], true),
      });
      return loginMiddleware(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

module.exports = changeEmail;
