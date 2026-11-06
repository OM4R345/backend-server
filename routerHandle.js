const express = require("express");
const route = express.Router();
const {
  upload,
  parseFormData,
  photoMimetype,
  getAvatar,
} = require("./middleware/photo/photo.js");
const {
  login,
  signUp,
  deleteUser,
  changeEmail,
  resetPw,
  editData,
  uploadAvatar,
} = require("./routers/userHandle.js");
const { verifyToken } = require("./middleware/jwt.js");
const allowedTo = require("./middleware/allowedTo.js");
const validate = require("./middleware/validate.js");

route.post("/login", parseFormData, validate(["body", "login"]), login);
route.post("/sign-up", validate(["body", "signUp"]), signUp(login));
route.get(
  "/get-avatar/:photoName",
  verifyToken(),
  allowedTo("all"),
  getAvatar(),
);

route.post(
  "/upload-avatar",
  verifyToken(),
  allowedTo("all"),
  upload.single("avatar"),
  photoMimetype,
  uploadAvatar(true),
);

route.delete(
  "/:email",
  verifyToken(),
  validate(["body", "deleteUser"]),
  allowedTo("owner", "admin"),
  deleteUser(false),
);
route.delete(
  "/delete-myself",
  parseFormData,
  validate(["body", "deleteUser"]),
  verifyToken(),
  allowedTo("user"),
  deleteUser(true),
);
route.patch(
  "/reset-password",
  parseFormData,
  verifyToken(),
  validate(["body", "resetPassword"]),
  resetPw,
);
route.patch(
  "/change-email",
  parseFormData,
  verifyToken(),
  validate(["body", "changeEmail"]),
  changeEmail(login),
);
route.patch(
  "/edit-data",
  parseFormData,
  verifyToken(),
  validate(["body", "editData"]),
  editData,
);

module.exports = route;
