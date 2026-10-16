const mongoose = require("mongoose");
const createdOwner = require("./middleware/createOwner.js");

const userScheme = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin", "owner"],
      default: "user",
    },
    avatar: String,
  },
  { timestamps: true },
);

userScheme.statics.createObjectId = function () {
  return new mongoose.Types.ObjectId();
};

userScheme.statics.createUser = async function (data) {
  try {
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
    const { password, __v, _id, updatedAt, ...cleanData } = data;
    return { data, cleanData };
  } catch (err) {
    throw err;
  }
};

userScheme.statics.getUser = async function (email) {
  try {
    const data = await this.findOne({ email: email }).lean();

    if (!data) {
      return null;
    }

    const { password, __v, _id, updatedAt, ...cleanData } = data;
    return { userData: data, cleanData };
  } catch (err) {
    throw err;
  }
};

userScheme.statics.getUserById = async function (userID) {
  try {
    const data = await this.findById(userID).lean();
    if (!data) {
      return null;
    }

    const { password, __v, _id, updatedAt, ...cleanData } = data;
    return { data, cleanData };
  } catch (err) {
    throw err;
  }
};

userScheme.statics.searchUser = async function (params) {
  try {
    const data = await this.findOne(params).lean();
    if (!data) {
      return null;
    }

    const { password, __v, _id, updatedAt, ...cleanData } = data;
    return { data, cleanData };
  } catch (err) {
    throw err;
  }
};

userScheme.statics.getAllUsers = async function () {
  try {
    const data = await this.find({}).lean();
    return data;
  } catch (err) {
    throw err;
  }
};

userScheme.statics.deleteUserById = async function (userId) {
  try {
    if (!mongoose.isValidObjectId(userId)) {
      throw err;
    }
    const data = await this.findOneAndDelete({ _id: userId }).lean();
    if (data) {
      return data;
    }
  } catch (err) {
    throw err;
  }
};

userScheme.statics.deleteUser = async function (filter) {
  try {
    const data = await this.findOneAndDelete(filter).lean();
    if (data) {
      return data;
    }
  } catch (err) {
    throw err;
  }
};

userScheme.statics.setData = async function (email, data) {
  try {
    if (!data || !email) {
      return new Error(
        `${data == undefined || data == 0 ? '"New data"' : '"User email"'} is required to set data.`,
      );
    }
    const _data = await this.findOneAndUpdate(
      { email },
      { $set: data },
      { returnDocument: "after", runValidators: true },
    ).lean();

    if (!_data) {
      return null;
    }

    const { password, __v, _id, updatedAt, ...cleanData } = _data;
    return { data, cleanData };
  } catch (err) {
    throw err;
  }
};

//==================================================================\\
//==================================================================\\
const productScheme = mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
  },
  productName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

productScheme.statics.getProducts = async function ({
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

//==================================================================\\
//==================================================================\\
const User = mongoose.models.User || mongoose.model("User", userScheme);
const Product =
  mongoose.models.Product || mongoose.model("Product", productScheme);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Database is Connection");
    await createdOwner(User);
  })
  .catch((err) => {
    console.log(err.message);
    process.exit(1);
  });

const closeConnection = () => mongoose.connection.close(false);

module.exports = {
  User,
  Product,
  closeConnection,
};
