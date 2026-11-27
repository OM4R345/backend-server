const promiseChecker = (promise) => {
  if (promise.reason) throw new Error(promise.reason);
  if (promise.status === "fulfilled") {
    return { status: promise.status, value: promise.value };
  }
};

module.exports = promiseChecker;
