const express = require("express");
const app = express();
const port = process.env.PORT;
require("dotenv").config({ quiet: true });
const userHandle = require("./routerHandle");
const { getProducts } = require("./routers/productHandl");
const allowedTo = require("./middleware/allowedTo");
const { verifyToken } = require("./middleware/jwt");
const handleShutdown = require("./utilities/shutdown");
const rotateKeys = require("./rotateKeys/rotateKeys");
const helmet = require("helmet");

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

const timer = setInterval(rotateKeys(), 3000).unref();

process.on("SIGTERM", () => handleShutdown("SIGTERM", server));
process.on("SIGINT", () => handleShutdown("SIGINT", server));
