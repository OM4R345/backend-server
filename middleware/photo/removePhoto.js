const { rm } = require("fs/promises");
const path = require("path");

const removePhoto = (filename) => {
  if (!filename) throw new Error("removePhoto: photoPath is required.");
  rm(path.join(__dirname, "../../photos", path.basename(filename))).catch(
    (err) => console.error(err),
  );
};

module.exports = removePhoto;
