//this idea is over engineering and left

const { z } = require("zod");
const dataSchema = require("../schemas/zod.serial");
const organizer = require("../utilities/organizer");

class serializor {
  constructor(data) {
    const _result = dataSchema.safeParse(data);
    if (!_result.success) {
      throw new Error(JSON.stringify(organizer(_result)));
    }
    this.data = data;
  }

  sig(separate = ".") {
    const random = [];
    const keys = Object.keys(this.data);

    for (const index of keys) {
      const bool = Math.round(Math.random());
      if (bool) {
        random.push(this.data[index]);
      } else {
        random.unshift(this.data[index]);
      }
    }

    const string = random.map((v) => v.toString());
    const result = string.join(separate);
    this.result = result;
    return result;
  }

  order() {
    return this.result;
  }
}

module.exports = serializor;
