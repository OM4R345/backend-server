const mongoose = require("mongoose");
const createdOwner = require("./middleware/createOwner.js");
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Database is Connection");
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });

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

await createdOwner(userScheme);

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

    return { createdUser };
  } catch (err) {
    throw err;
  }
};

userScheme.statics.getUser = async function (email) {
  try {
    const data = await this.findOne({ email: email });

    if (!data) {
      return null;
    }

    const { password, __v, _id, updatedAt, ...cleanData } = data.toObject();
    return { userData: data, cleanData };
  } catch (err) {
    throw err;
  }
};

userScheme.statics.getUserById = async function (userID) {
  try {
    const data = await this.findById(userID);
    if (!data) {
      return null;
    }

    const { password, __v, _id, updatedAt, ...cleanData } = data.toObject();
    return { data, cleanData };
  } catch (err) {
    throw err;
  }
};

userScheme.statics.searchUser = async function (params) {
  try {
    const data = await this.findOne(params);
    if (!data) {
      return null;
    }

    const { password, __v, _id, updatedAt, ...cleanData } = data.toObject();
    return { data, cleanData };
  } catch (err) {
    throw err;
  }
};

userScheme.statics.getAllUsers = async () => {
  try {
    const data = await this.find({});
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
    const data = await this.findOneAndDelete({ _id: userId }).then();
    if (data) {
      return data;
    }
  } catch (err) {
    throw err;
  }
};

userScheme.statics.deleteUser = async function (filter) {
  try {
    const data = await this.findOneAndDelete(filter);
    if (data) {
      return data;
    }
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

const User = mongoose.models.User || mongoose.model("User", userScheme);
const Product =
  mongoose.models.Product || mongoose.model("Product", productScheme);

module.exports = {
  User,
  Product,
};
