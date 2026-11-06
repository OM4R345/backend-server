const mongoose = require("mongoose");
const userModel = require("./db.user.js");
const productModel = require("./db.product.js");

const User = mongoose.models.User || mongoose.model("User", userModel);
const Product =
  mongoose.models.Product || mongoose.model("Product", productModel);

const openConnection = () => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(console.log("Database is Connected"));
};

const closeConnection = () => {
  mongoose.connection.close(false).then(() => {
    console.log("Database is Disconnected");
  });
};

module.exports = {
  User,
  Product,
  openConnection,
  closeConnection,
};
