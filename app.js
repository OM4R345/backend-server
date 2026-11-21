const express = require("express");
const app = express();
require("dotenv").config({ quiet: true });
const port = Number(process.env.PORT);
const userHandle = require("./routerHandle");
const { getProducts } = require("./routers/productHandle");
const allowedTo = require("./middleware/allowedTo");
const { verifyToken } = require("./middleware/jwt");
const handleShutdown = require("./utilities/shutdown");
const rotateKeys = require("./rotateKeys/rotateKeys");
const helmet = require("helmet");
const { retiredVersions } = require("./rotateKeys/keysHandler");

app.use(express.json());
app.use(helmet());

app.use("/user", userHandle);
app.use("/products", verifyToken(), allowedTo("all"), getProducts);

app.use((req, res) => {
  res
    .status(404)
    .json({ status: "fail", message: `Page {${req.originalUrl}} not found.` });
});

const server = app.listen(port, () => {
  console.log(`Server listen on port ${port}`);
});

(async () => {
  const checkPrivate = await retiredVersions("private");
  const checkPublic = await retiredVersions("public");
  if (checkPrivate === null && checkPublic === null) {
    await rotateKeys();
  }
})();
const timer = setInterval(() => rotateKeys(), 180_000).unref();

process.on("SIGTERM", () => handleShutdown("SIGTERM", server));
process.on("SIGINT", () => handleShutdown("SIGINT", server));
