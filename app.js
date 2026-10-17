const express = require("express");
const app = express();
const port = 3000;
require("dotenv").config({ quiet: true });
const userHandle = require("./routerHandle.js");
const productHandle = require("./routerHandle/productsHandle.js");
const { getAvatar } = require("./middleware/photo.js");
const allowedTo = require("./middleware/allowedTo");
const { verifyToken } = require("./middleware/jwt.js");
const handleShutdown = require("./shutdown.js");
const helmet = require("helmet");

app.use(express.json());
app.use(helmet());

app.use("/user", userHandle);
app.use(
  "/products",
  verifyToken(),
  allowedTo("all" /* "admin", "owner" */),
  productHandle,
);
app.get("/photo/:photoName", getAvatar());

const server = app.listen(port, () => {
  console.log(`Server listen on port ${port}`);
});

process.on("SIGTERM", () => handleShutdown("SIGTERM", server));
process.on("SIGINT", () => handleShutdown("SIGINT", server));
