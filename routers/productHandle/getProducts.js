const { Product } = require("../../database/database.js");

const getProducts = async (req, res, next) => {
  try {
    const { limit, page, search } = req.query;

    const filter =
      typeof search === "string" && search
        ? {
            productName: new RegExp(
              search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              "i",
            ),
          }
        : {};

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
