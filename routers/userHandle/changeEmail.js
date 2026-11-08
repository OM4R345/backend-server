const { User } = require("../../database/database.js");

const changeEmail = (loginMiddleware) => {
  return async (req, res, next) => {
    try {
      const sub = req.decoded.sub;
      const newEmail = req.valid.body.newEmail;

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
      if (!data) {
        return res.status(400).json({
          status: "fail",
          message: "Document not found.",
        });
      }
      return loginMiddleware(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

module.exports = changeEmail;
