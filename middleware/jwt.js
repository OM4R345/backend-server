const jwt = require("jsonwebtoken");
const fs = require("node:fs");
const genKeys = require("../genKeys.js");
const { v4: uuidv4 } = require("uuid");

let readedPublicKey = "";
if (!fs.existsSync("./public.pem")) {
  readedPublicKey = genKeys();
} else {
  readedPublicKey = fs.readFileSync("./public.pem", "utf-8");
}

const signToken = async (data, privateKey, options) => {
  const defaultOptions = {
    algorithm: "RS256",
    jwtid: uuidv4(),
    expiresIn: 10 * 60,
    ...options,
  };

  if (!data && !privateKey) {
    throw new Error("Data and privateKey are required for signing token");
  }

  return jwt.sign(data, privateKey, defaultOptions);
};

const verifyToken = (token, options, publicKey) => {
  return (req, res, next) => {
    const Token = token || req.headers.authorization?.split(" ")[1];
    if (!Token) {
      return res
        .status(401)
        .json({ status: "fail", message: "token required" });
    }

    const defaultOptions = {
      algorithm: "RS256",
      ...options,
    };

    jwt.verify(
      Token,
      publicKey || readedPublicKey,
      defaultOptions,
      (err, decoded) => {
        if (err) {
          const message =
            err.name === "TokenExpiredError" ? "jwt expired" : "invalid token";

          return res.status(401).json({ status: "fail", message: message });
        }
        req.decoded = decoded;
        next();
      },
    );
  };
};

module.exports = {
  signToken,
  verifyToken,
};
