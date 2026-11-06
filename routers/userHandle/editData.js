const { User } = require("../../database/database.js");
const toPublicData = require("../../utilities/toPublicData.js");

const editData = async (req, res, next) => {
  try {
    const sub = req.decoded.sub;
    const payload = {};
    const allowedFields = ["name", "age"];

    for (const field of allowedFields) {
      if (req.valid.body[field] !== undefined && req.valid.body[field] != "") {
        payload[field] = req.valid.body[field];
      }
    }

    if (Object.keys(payload).length === 0) {
      return res
        .status(400)
        .json({ status: "fail", message: "New data is required" });
    }

    const data = await User.setDataById(sub, payload);
    if (!data) {
      throw new Error();
    }
    return res.status(200).json({
      status: "success",
      data: toPublicData(data, ["__v", "_id", "updatedAt"], true),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = editData;
