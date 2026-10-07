const express = require("express");
const app = express();
const port = 3000;
require("dotenv").config();
const userHandle = require("./routerHandle.js");
const productHandle = require("./routerHandle/productsHandle.js");
const { getAvatar } = require("./middleware/photo.js");
const allowedTo = require("./middleware/allowedTo");
const { verifyToken } = require("./middleware/jwt.js");

app.use(express.json());

app.use("/user", userHandle);
app.use("/products", verifyToken(), allowedTo("admin", "owner"), productHandle);
app.get("/photo/:photoName", getAvatar());

app.listen(port, () => {
  console.log(`Server listen on port ${port}`);
});
