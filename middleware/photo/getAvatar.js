const path = require("path");
const fs = require("fs");
const { pipeline } = require("stream/promises");

const getAvatar = (filename) => {
  return (req, res, next) => {
    try {
      const targetFile = filename || req.params.photoName;
      if (!targetFile) throw new Error("filename and photoName are undefined");

      const filePath = path.join(
        __dirname,
        "../photos",
        path.basename(targetFile),
      );

      if (!fs.existsSync(filePath)) {
        const defaultPath = path.join(
          __dirname,
          "../photos/default-avatar.webp",
        );
        if (fs.existsSync(defaultPath)) {
          const stream = fs.createReadStream(defaultPath);

          stream.on("error", (err) => {
            return res
              .status(500)
              .json({ status: "error", message: err.message });
          });

          return pipeline(stream, res);
        } else {
          throw new Error("Photo Name and Default image are undefined");
        }
      }

      const stream = fs.createReadStream(filePath);
      const ext = path.extname(targetFile).replace(".", "");

      stream.on("error", (err) => {
        return res.status(500).json({ status: "error", message: err.message });
      });

      return pipeline(stream, res);
    } catch (err) {
      next(err);
    }
  };
};

module.exports = getAvatar;
