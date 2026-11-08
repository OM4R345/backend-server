const mongoose = require("mongoose");
const userModel = require("./db.user.js");
const productModel = require("./db.product.js");

const User = mongoose.models.User || mongoose.model("User", userModel);
const Product =
  mongoose.models.Product || mongoose.model("Product", productModel);

const openConnection = () => {
  return mongoose.connect(process.env.MONGODB_URI).then(
    () => console.log("Database is Connected"),
    () => console.log("Database connection is failed."),
  );
};

const closeConnection = () => {
  return mongoose.connection.close(false).then(
    () => console.log("Database is Disconnected"),
    () => console.log("Database disconnection is failed."),
  );
};

module.exports = {
  User,
  Product,
  openConnection,
  closeConnection,
};
