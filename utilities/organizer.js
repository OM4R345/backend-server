const organizer = (result) => {
  return result.error.issues.map((i) => ({
    field: i.path.join("."),
    message: i.message,
  }));
};

module.exports = organizer;
