const jwksClient = require("jwks-rsa");
const jwt = require("jsonwebtoken");

const providers = {
  "https://accounts.google.com": jwksClient({
    jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
  }),
};

const checkSig = (token, provider, options) => {
  const getKey = (header, callback) => {
    const unverifiedToken = jwt.decode(token, { complete: true });
    const issuer = unverifiedToken?.payload?.iss;
    const client = provider ? provider : providers[issuer];

    if (!client)
      return callback(new Error(`Unsupported Provider / Issuer ${issuer}`));

    client.getSigningKey(header.kid, (err, key) => {
      if (err) return callback(err);

      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  };

  return new Promise((res, rej) => {
    jwt.verify(token, getKey, options, (err, decoded) => {
      if (err) return rej(err);
      else return res(decoded);
    });
  });
};

module.exports = checkSig;
