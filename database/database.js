const mongoose = require("mongoose");
const userModel = require("./db.user.js");
const productModel = require("./db.product.js");

const User = mongoose.models.User || mongoose.model("User", userModel);
const Product =
  mongoose.models.Product || mongoose.model("Product", productModel);

const openConnection = () => {
  return mongoose.connect(process.env.MONGODB_URI).then(
    (err) => {
      console.log("Database is connected.");
      throw err;
    },
    (err) => {
      console.log("Database connected is failed.");
      throw err;
    },
  );
};

const closeConnection = () => {
  return mongoose.connection.close(false).then(
    (err) => {
      console.log("Database is disconnected.");
      throw err;
    },
    (err) => {
      console.log("Database disconnected is failed.");
      throw err;
    },
  );
};

module.exports = {
  User,
  Product,
  openConnection,
  closeConnection,
};
