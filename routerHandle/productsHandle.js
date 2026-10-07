const { Product } = require("../database.js");

const getProducts = async (req, res, next) => {
  try {
    const { limit, page, search } = req.query;
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const filter = safe ? { productName: new RegExp(safe, "i") } : {};

    const data = await Product.getProducts({ filter, limit, page });

    res.status(200).json({
      status: "success",
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = getProducts;
