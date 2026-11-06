const multer = require("multer");
const crypto = require("crypto");
const path = require("node:path");
const fsPromises = require("node:fs/promises");
const fs = require("node:fs");
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const filter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    if (ALLOWED.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG or WebP images are allowed"), false);
    }
  } else {
    cb(new Error("only image files are allowed"), false);
  }
};

const singleMulterConfig = multer({
  storage: multer.memoryStorage(),
  fileFilter: filter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

const multipleMulterConfig = multer({
  storage: multer.memoryStorage(),
  fileFilter: filter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
});

const upload = (() => {
  class uploader {
    single(fieldname) {
      return (req, res, next) => {
        if (!fieldname) next(new Error("upload: fieldname is required."));
        const _upload = singleMulterConfig.single(fieldname || "avatar");
        _upload(req, res, (err) => {
          if (err)
            return res
              .status(400)
              .json({ status: "fail", message: err.message });
          next();
        });
      };
    }
    multiple(fieldname, maxCount) {
      return (req, res, next) => {
        if (!fieldname) next(new Error("upload: fieldname is required."));
        const filesCount = maxCount ? maxCount : 5;
        const _upload = multipleMulterConfig.array(fieldname, filesCount);
        _upload(req, res, (err) => {
          if (err)
            return res
              .status(400)
              .json({ status: "fail", message: err.message });
          next();
        });
      };
    }
  }
  return new uploader();
})();

const genPhotoName = (file) => {
  if (!file)
    return res
      .status(400)
      .json({ status: "fail", error: "avatar file is required." });
  return `avatar-${Date.now()}-${crypto.randomUUID()}.${file.ext}`;
};

const saveOnDisk = (file, filename) => {
  if (!file) {
    return "default-avatar.webp";
  }
  if (file && !filename) {
    throw new Error("saveOnDisk: filename is required");
  }
  const savePath = path.join(__dirname, "../../photos", filename);
  return fsPromises.writeFile(savePath, file.buffer);
};

//collect all functions
const getAvatar = require("./getAvatar.js");
const parseFormData = require("./parseFormData.js");
const photoMimetype = require("./photoMimetype.js");
const removePhoto = require("./removePhoto.js");

module.exports = {
  upload,
  removePhoto,
  genPhotoName,
  saveOnDisk,
  getAvatar,
  parseFormData,
  photoMimetype,
};
