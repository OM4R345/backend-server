const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const fs = require("node:fs");
const crypto = require("crypto");
const missingParams = require("../errorHandle/err.missingParams");

const providers = {
  "https://accounts.google.com": jwksClient({
    jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
  }),
  "http://localhost:3000": jwksClient({
    jwksUri: "http://localhost:4000/.well-known/jwks.json",
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  }),
};

/* const checkPrivate = fs.existsSync("../private.pem");
const checkPublic = fs.existsSync("../public.pem");

if (!checkPrivate || !checkPublic) {
  console.error(
    `Cannot find ${
      !checkPrivate && !checkPrivate
        ? "private and public Keys"
        : !checkPrivate
          ? "Private Key"
          : "Public Key"
    }`,
  );
  process.exit(1);
  //require("../genKeys")();
}  */

const signToken = async (data, privateKey, options) => {
  const defaultOptions = {
    algorithm: "RS256",
    keyid: "kid-v1",
    jwtid: crypto.randomUUID(),
    expiresIn: 10 * 60,
    ...options,
  };

  if (!data || !privateKey) {
    throw new Error(
      `${missingParams({ data, privateKey })} is required for signing token`,
    );
  }

  return jwt.sign(data, privateKey, defaultOptions);
};

const verifyToken = (token, options) => {
  return (req, res, next) => {
    const Token = token || req.headers.authorization?.split(" ")[1];
    if (!Token) {
      return res
        .status(401)
        .json({ status: "fail", message: "token required" });
    }

    const defaultOptions = {
      algorithms: ["RS256"],
      ...options,
    };

    const unverifiedToken = jwt.decode(Token, {
      complete: true,
    });
    const issuer = unverifiedToken?.payload?.iss;
    const client = providers[issuer];

    if (!client) {
      return res.status(401).json({
        status: "fail",
        message: "unsupported issuer",
      });
    }

    const getKey = (header, callback) => {
      client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        callback(null, key.getPublicKey());
      });
    };

    jwt.verify(Token, getKey, defaultOptions, (err, decoded) => {
      if (err) {
        const message =
          err.name === "TokenExpiredError" ? "jwt expired" : "invalid token";

        return res.status(401).json({ status: "fail", message: message });
      }
      req.decoded = decoded;
      next();
    });
  };
};

module.exports = {
  signToken,
  verifyToken,
};
