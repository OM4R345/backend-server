const saveKey = require("./saveKey");
const newKid = require("./newKid");
const retiredVersions = require("./retiredVersions");
const deleteOldKey = require("./deleteOldKey");
const genKeys = require("./genKeys");
const deleteAllOldKeys = require("./deleteAllOldKeys");
const removedVersions = require("./removedVersions");

module.exports = {
  deleteOldKey,
  removedVersions,
  deleteAllOldKeys,
  genKeys,
  retiredVersions,
  saveKey,
  newKid,
};
