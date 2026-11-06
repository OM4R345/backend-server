const missingParams = require("../errorHandle/err.missingParams.js");
const userModel = require("../schemas/mongo.user.js");
const mongoose = require("mongoose");

userModel.statics.createObjectId = function () {
  return new mongoose.Types.ObjectId();
};

userModel.statics.createUser = async function (data) {
  if (!data) {
    throw new Error("data is required");
  }

  const userData = {
    name: data.name,
    age: data.age,
    email: data.email,
    password: data.password,
    role: data.role,
    avatar: data.avatar,
  };

  const createdUser = await this.create(userData);
  return createdUser;
};

userModel.statics.getUser = async function (email, password = false) {
  const data = await this.findOne({ email })
    .select(password ? "+password" : "")
    .lean();

  if (!data) {
    return null;
  }

  return data;
};

userModel.statics.getUserById = async function (userId, password = false) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("mongoose: user objectId is invalid");
  }
  const data = await this.findById(userId)
    .select(password ? "+password" : "")
    .lean();
  if (!data) {
    return null;
  }

  return data;
};

userModel.statics.searchUser = async function (filter) {
  const data = await this.findOne(filter).lean();
  if (!data) {
    return null;
  }

  return data;
};

userModel.statics.getAllUsers = async function () {
  const data = await this.find({})
    .lean()
    .select("-password", "-__v", "-updatedAt");
  return data;
};

userModel.statics.deleteUserById = async function (userId) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("mongoose: user objectId is invalid");
  }
  const data = await this.findByIdAndDelete(userId).lean();
  if (data) {
    return data;
  }
};

userModel.statics.deleteUser = async function (filter) {
  const data = await this.findOneAndDelete(filter).lean();
  if (data) {
    return data;
  }
};

userModel.statics.setDataById = async function (
  userId,
  data,
  returnNewDoc = true,
) {
  if (!data || !userId) {
    throw new Error(
      `${missingParams({ data, userId })} is required to set data.`,
    );
  }
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("mongoose: user objectId is invalid");
  }
  const returnDoc = returnNewDoc ? "after" : "before";
  const _data = await this.findByIdAndUpdate(
    userId,
    { $set: data },
    { returnDocument: returnDoc, runValidators: true },
  ).lean();

  if (!_data) {
    return null;
  }

  return _data;
};

module.exports = userModel;
