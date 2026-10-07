const fs = require("node:fs");
const { User } = require("../database.js");
const { v4: uuidv4 } = require("uuid");
const { signToken } = require("../middleware/jwt.js");
const { pwToHash, compareHash } = require("../password.js");
const { saveOnDisk } = require("../middleware/photo.js");
const privateKey = fs.readFileSync("./private.pem", "utf-8");
const publicKey = fs.readFileSync("./public.pem", "utf-8");

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "fail", message: "provide email and password" });
    }

    const returnedData = await User.getUser(email);
    if (!returnedData) {
      return res
        .status(400)
        .json({ status: "fail", message: "invalid email or password" });
    }
    const { userData, cleanData } = returnedData;

    if (!(await compareHash(password, userData.password))) {
      res.status(401).json({
        status: "fail",
        data: null,
        message: "invalid email or password",
      });
      return;
    }

    const token = await signToken(
      {
        name: userData.name,
        age: userData.age,
        email: userData.email,
        role: userData.role,
      },
      privateKey,
      {
        subject: userData._id.toString(),
        audience: "urn:frontend",
        issuer: "http://localhost:3000",
      },
    );

    if (userData && token) {
      return res.status(200).json({
        status: "success",
        data: cleanData,
        token,
      });
    }
  } catch (err) {
    next(err);
  }
};

const signUp = (loginMiddleware) => {
  return async (req, res, next) => {
    try {
      const { name, age, email, password } = req.body;

      const checkedPassword =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,15}$/.test(
          password,
        );
      if (!checkedPassword) {
        return res.status(400).json({
          status: "fail",
          message: "password is weak, use [A-z], [a-z], [0-9] and [@.#$!%*?&]",
        });
      }

      const saveAvatar = saveOnDisk(req.file);

      const { createdUser } = await User.createUser({
        name,
        age,
        email,
        password: await pwToHash(password),
        avatar: saveAvatar.next().value,
      });

      if (createdUser && req.file) {
        await saveAvatar.next().value;
      }

      return loginMiddleware(req, res, next);
    } catch (err) {
      console.log(err);
      if (err.code === 11000) {
        return res.status(400).json({
          status: "fail",
          data: null,
          message: "Email already exists.Please login or use another email.",
        });
      }
      next(err);
    }
  };
};

const deleteUser = async (req, res, next) => {
  try {
    const email = req.params.email?.includes("@gmail.com")
      ? req.params.email
      : `${req.params.email}@gmail.com`;

    if (email === req.decoded.email)
      return res
        .status(400)
        .json({ status: "fail", message: "you can't delete yourself" });

    const action = await User.deleteUser({ email: email });
    if (!action) {
      return res
        .status(404)
        .json({ status: "fail", message: "user not found" });
    }

    return res.status(200).json({ status: "success", data: action });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, signUp, deleteUser };
