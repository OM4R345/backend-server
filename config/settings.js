const fs = require("node:fs");
const defaultSettings = require("./defaultSettings.js");

/*
[1] add temp file to save changes and add it later
[2] add writeSettings fn includes err handle (ENOENT or onther)
[2] shrink options and make permissions sys
[3] add saveSettings fn to add temp changes
*/

if (!fs.existsSync("./settings.json")) {
  const stream = fs.createWriteStream("./settings.json", "utf-8");
  stream.end(JSON.stringify(defaultSettings, null, 2));
}
