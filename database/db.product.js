const productModel = require("../schemas/mongo.product.js");

productModel.statics.getProducts = async function ({
  filter = {},
  limit = 10,
  page = 1,
} = {}) {
  limit = parseInt(limit);
  page = parseInt(page);
  const skip = (page - 1) * limit;

  const [data, totalcount] = await Promise.all([
    this.find(filter).skip(skip).limit(limit).lean(),
    this.countDocuments(filter),
  ]);
  return {
    data,
    pagination: {
      totalcount: totalcount,
      totalPages: Math.ceil(totalcount / limit),
      page: page,
      limit: limit,
    },
  };
};

module.exports = productModel;
