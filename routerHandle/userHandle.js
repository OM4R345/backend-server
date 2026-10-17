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

const resetPw = async (req, res, next) => {
  try {
    const email = req.decoded.email;
    const newPassword = req.body.newPassword.trim();
    const confirmPw = req.body.confirmPw.trim();

    if (newPassword !== confirmPw) {
      return res
        .status(400)
        .json({ status: "fail", message: "confirm Password is wrong" });
    }

    const hashedPw = await pwToHash(newPassword);
    const data = await User.setData(email, {
      password: hashedPw,
    });
    return res.status(200).json({ status: "success", data: data.cleanData });
  } catch (err) {
    next(err);
  }
};

const changeEmail = async (req, res, next) => {
  try {
    const email = req.decoded.email;
    const newEmail = req.body.newEmail?.trim();

    if (!newEmail) {
      return res
        .status(400)
        .json({ status: "fail", message: "Email is required" });
    }

    const checkEmail = await User.getUser(newEmail);
    if (checkEmail !== null) {
      return res.status(400).json({ status: "fail", message: "Email is used" });
    }

    const data = await User.setData(email, { email: newEmail });
    return res.status(200).json({ status: "success", data: data.cleanData });
  } catch (err) {
    next(err);
  }
};

const editData = async (req, res, next) => {
  try {
    const email = req.decoded.email;
    const payload = {};
    const allowedFields = ["name", "age"];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] != "") {
        payload[field] = req.body[field];
      }
    }

    if (Object.keys(payload).length === 0) {
      return res
        .status(400)
        .json({ status: "fail", message: "New data is required" });
    }

    const data = await User.setData(email, payload);
    if (!data) {
      throw new Error();
    }
    return res.status(200).json({ status: "success", data: data.cleanData });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, signUp, deleteUser, changeEmail, editData, resetPw };
