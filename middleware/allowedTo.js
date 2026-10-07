const allowedTo = (...roles) => {
  return (req, res, next) => {
    try {
      const lowerRoles = roles.map((value) => value.toLowerCase());
      const role = req.decoded.role.toLowerCase();
      if (!roles) {
        return res
          .status(403)
          .json({ status: "fail", message: "roles is required" });
      }

      if (lowerRoles.includes(role)) {
        next();
      } else {
        throw new Error();
      }
    } catch (err) {
      return res.status(406).json({
        status: "fail",
        data: null,
        message: "you are not acceptable",
      });
    }
  };
};

module.exports = allowedTo;
