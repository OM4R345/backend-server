const multer = require("multer");

const parseFormData = multer().none();

module.exports = parseFormData;
