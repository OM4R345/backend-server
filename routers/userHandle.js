const login = require("./userHandle/login.js");
const logout = require("./userHandle/logout.js");
const signUp = require("./userHandle/signUp.js");
const deleteUser = require("./userHandle/deleteUser.js");
const changeEmail = require("./userHandle/changeEmail.js");
const editData = require("./userHandle/editData.js");
const resetPw = require("./userHandle/resetPw.js");
const uploadAvatar = require("./userHandle/uploadAvatar.js");

module.exports = {
  login,
  logout,
  signUp,
  deleteUser,
  changeEmail,
  editData,
  resetPw,
  uploadAvatar,
};
