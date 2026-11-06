const { User } = require("../../database/database.js");
const { pwToHash } = require("../../utilities/password.js");

const signUp = (loginMiddleware) => {
  return async (req, res, next) => {
    try {
      const { name, age, email, password } = req.valid.body;

      const createdUser = await User.createUser({
        name,
        age,
        email,
        password: await pwToHash(password),
      });

      req.userData = createdUser;
      return loginMiddleware(req, res, next);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({
          status: "fail",
          data: null,
          message: "Email already exists.Please login or use another email.",
        });
      }
      next(err);
    }
  };
};

module.exports = signUp;
