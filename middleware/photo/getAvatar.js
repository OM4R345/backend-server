const path = require("path");

const getAvatar = (filename) => {
  return (req, res, next) => {
    const photoName = path.basename(filename || req.params.photoName);
    if (!photoName) throw new Error("filename and photoName are undefined");
    res.sendFile(photoName, { root: "../../photos" }, (err) => {
      if (!err || res.headersSent) return;
      if (err.code === "ENOENT" || err.status === 404) {
        return res.sendFile(
          "default-avatar.webp",
          { root: "../../photos" },
          (err) => {
            err && !res.headersSent && next(err);
          },
        );
      }
      next(err);
    });
  };
};

module.exports = getAvatar;
