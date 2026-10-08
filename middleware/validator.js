const { z } = require("zod");

module.exports = vaildator = (req, res, next) => {
  const { name, age, email, password, confirmPw } = req.body;

  const userScheme = z.object({
    name: z
      .string({ required_error: "name is required" })
      .min(5, "name is short than 5 chars")
      .max(30, "name is too long"),
    age: z
      .number({ required_error: "age is required" })
      .positive()
      .gte(16, "you are younger than 16 years"),
    email: z.string({ required_error: "email is required" }).email(),
    password: z
      .string({ required_error: "password is required" })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,30}$/,
        "password is weak, use [A-z], [a-z], [0-9] and [@.#$!%*?&]",
      ),
  });

  const loginScheme = userScheme
    .pick({
      email: true,
      password: true,
    })
    .extend({
      confirmPw: z.string({ required_error: "confirm password is wrong" }),
    })
    .refine((v) => v.password === v.confirmPw, {
      message: "confirm password is wrong",
      path: ["confirmPw"],
    });

  const path = req.url.split("/");
  if (path.includes("login")) {
    const result = userScheme.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return res
        .status(400)
        .json({ status: "fail", message: formattedErrors.message });
    }
    next();
  } else if (path.includes("sign-up")) {
    const result = loginScheme.safeParse(req.body);

    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return res
        .status(400)
        .json({ status: "fail", message: formattedErrors.message });
    }
    next();
  }
};
