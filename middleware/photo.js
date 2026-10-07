const multer = require("multer");
const path = require("node:path");
const fsPromises = require("node:fs/promises");
const fs = require("node:fs");

const storage = multer.memoryStorage();

const filter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("only image files are allowed"), false);
  }
};

const multerConfig = multer({
  storage: storage,
  fileFilter: filter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

const upload = (fieldname) => {
  return (req, res, next) => {
    const multerUpload = multerConfig.single(fieldname || "avatar");
    multerUpload(req, res, (err) => {
      if (err)
        return res.status(400).json({ status: "fail", message: err.message });
      next();
    });
  };
};

const saveOnDisk = function* (file, filename) {
  if (!file) {
    yield "default-avatar.png";
    return;
  }

  const ext = path.extname(file.originalname);
  const createdFilename =
    filename ||
    `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  yield createdFilename;

  const savePath = path.join(__dirname, "../photos", createdFilename);
  return fsPromises.writeFile(savePath, file.buffer);
};

const getAvatar = (filename) => {
  return (req, res, next) => {
    try {
      const targetFile = filename || req.params.photoName;
      if (!targetFile) throw new Error("filename and photoName are undefined");

      const filePath = path.basename(__dirname, "../photos", targetFile);

      if (!fs.existsSync(filePath)) {
        const defaultPath = path.join(
          __dirname,
          "../photos/default-avatar.webp",
        );
        if (fs.existsSync(defaultPath)) {
          const stream = fs.createReadStream(defaultPath);

          res.setHeader("Content-Type", "image/webp");
          res.setHeader("Transfer-Encoding", "chunked");

          stream.on("error", (err) => {
            return res
              .status(500)
              .json({ status: "error", message: err.message });
          });

          return stream.pipe(res);
        } else {
          throw new Error("Photo Name and Default image are undefined");
        }
      }

      const stream = fs.createReadStream(filePath);
      const ext = path.extname(targetFile).replace(".", "");

      res.setHeader("Content-Type", `image/${ext}`);
      res.setHeader("Transfer-Encoding", "chunked");

      stream.on("error", (err) => {
        return res.status(500).json({ status: "error", message: err.message });
      });

      return stream.pipe(res);
    } catch (err) {
      next(err);
    }
  };
};

const parseFormData = multer().none();

module.exports = { upload, getAvatar, parseFormData, saveOnDisk };
