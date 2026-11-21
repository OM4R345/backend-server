const getAvatar = require("./getAvatar.js");
const parseFormData = require("./parseFormData.js");
const photoMimetype = require("./photoMimetype.js");
const removePhoto = require("./removePhoto.js");
const upload = require("./upload.js");
const genPhotoName = require("./genPhotoName");
const saveOnDisk = require("./saveOnDisk.js");

module.exports = {
  upload,
  removePhoto,
  genPhotoName,
  saveOnDisk,
  getAvatar,
  parseFormData,
  photoMimetype,
};
