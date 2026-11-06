const { fileTypeFromBuffer } = require("file-type");
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const photoMimetype = async (req, res, next) => {
  if (!req.file)
    return res
      .status(400)
      .json({ status: "fail", error: "avatar file is required." });
  const type = await fileTypeFromBuffer(req.file.buffer);

  if (!type || !ALLOWED.has(type.mime)) {
    return res
      .status(400)
      .json({ status: "fail", error: "Invalid image file." });
  }
  req.file.ext = ALLOWED.get(type.mime);
  next();
};

module.exports = photoMimetype;
