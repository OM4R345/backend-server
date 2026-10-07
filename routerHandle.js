const express = require("express");
const route = express.Router();
const { upload, parseFormData } = require("./middleware/photo.js");
const { login, signUp, deleteUser } = require("./routerHandle/userHandle.js");

route.post("/login", parseFormData, login);
route.post("/sign-up", upload(), signUp(login));
route.delete("/:email", deleteUser);

module.exports = route;
