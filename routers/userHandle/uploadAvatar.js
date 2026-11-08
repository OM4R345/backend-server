const { User } = require("../../database/database.js");
const { genPhotoName, saveOnDisk } = require("../../middleware/photo/photo.js");

const uploadAvatar = (single = true) => {
  return async (req, res, next) => {
    try {
      let i = 0;
      if (single) {
        const filename = genPhotoName(req.file);
        await saveOnDisk(req.file, filename);
        await User.setDataById(req.decoded.sub, { avatar: filename });
      } else {
        while (i < req.files.length) {
          const filename = genPhotoName(req.file);
          await saveOnDisk(req.file, filename);
          i++;
          //save photos name on galary's doc
        }
      }

      return res.status(200).json({
        status: "success",
        message: `${single ? "file is" : "All files are"} saved.`,
      });
    } catch (err) {
      next(err);
    }
  };
};

module.exports = uploadAvatar;
