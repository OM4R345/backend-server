const { User } = require("../../database/database.js");
const toPublicData = require("../../utilities/toPublicData.js");
const path = require("node:path");
const { rm } = require("node:fs/promises");

const deleteUser = (self = true) => {
  return async (req, res, next) => {
    try {
      const email = req.valid.params.email;
      const defaultAvatars = new Set([
        "default-avatar.webp",
        "default-avatar.png",
        process.env.OWNER_AVATAR,
      ]);
      let action = "";

      if (self) {
        if (email !== req.decoded.email)
          return res
            .status(400)
            .json({ status: "fail", message: "you can't delete onother user" });

        action = await User.searchUser({ _id: req.decoded.sub });
        if (action && !defaultAvatars.has(action.avatar)) {
          setTimeout(await User.deleteUserById(req.decoded.sub), 3000).unref();
        } else {
          return res
            .status(404)
            .json({ status: "fail", message: "user not found" });
        }
      } else {
        if (email === req.decoded.email)
          return res
            .status(400)
            .json({ status: "fail", message: "you can't delete yourself" });

        action = await User.deleteUser({ email });

        if (action) { 
         if(action.avatar && !defaultAvatars.has(action.avatar)) {
          rm(
            path.join(__dirname, "../../photos", path.basename(action.avatar)),
          ).catch((err) => next(err));
         }
        } else {
          return res
            .status(404)
            .json({ status: "fail", message: "user not found" });
        }
      }

      return res.status(200).json({
        status: "success",
        data: toPublicData(action, ["__v", "_id", "updatedAt"], true),
      });
    } catch (err) {
      next(err);
    }
  };
};

module.exports = deleteUser;
