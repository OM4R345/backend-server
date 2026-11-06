const { User, openConnection } = require("./database/database.js");
const bootServer = require("./app.js");
const createOwner = require("../utilities/createOwner.js");
const bootValidate = require("./schemas/zod.env.js");
require("dotenv").config();

const checkValidate = () => {
  return bootValidate(process.env)?.success ? true : false;
};

openConnection().catch(err, () => {
  console.error(err);
  process.exit(1);
});
await User.init();
await createOwner();
