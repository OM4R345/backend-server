const express = require("express");
const route = express.Router();
const { upload, parseFormData } = require("./middleware/photo.js");
const { login, signUp, deleteUser } = require("./routerHandle/userHandle.js");
const { verifyToken } = require("./middleware/jwt.js");
const allowedTo = require("./middleware/allowedTo.js");
const validate = require("./middleware/validator.js");

route.post("/login", parseFormData, validate, login);
route.post("/sign-up", upload(), validate, signUp(login));
route.delete("/:email", verifyToken(), allowedTo("owner"), deleteUser);

module.exports = route;
