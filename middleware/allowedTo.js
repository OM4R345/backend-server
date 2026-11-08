const mainRoles = new Set(["user", "admin", "owner"]);

const allowedTo = (...roles) => {
  return (req, res, next) => {
    try {
      if (roles.length == 0) {
        throw new Error("allowedTo: roles is required.");
      }
      const lowerRoles = roles.map((value) => value.toLowerCase());
      const role = req.decoded.role.toLowerCase();

      if (lowerRoles.includes("all") || lowerRoles.includes(role)) {
        next();
      } else {
        return res.status(403).json({
          status: "fail",
          message: "you are not acceptable.",
        });
      }
    } catch (err) {
      next(err);
    }
  };
};

module.exports = allowedTo;
