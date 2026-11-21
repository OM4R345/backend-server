const timeConverter = (time, to = "ms") => {
  const units = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  const regex = /(\d+)(ms|s|m|h|d|w)/;
  const spliting = time.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const chapters = spliting.map((v) => v.match(regex)).filter((v) => v != null);

  if (!to.match(/(ms|s|m|h|d|w)/)) {
    throw new Error('Invalid input "to"');
  }

  const unit = chapters.map((v) => v[2]);
  const num = chapters.map((v) => v[1]);

  const warn = spliting.filter((v) => !v.match(regex));
  if (warn.length)
    console.warn("Unexpected input:", `"${time}":`, `"${warn.join(" ")}"`);

  let msTime = 0;
  for (let i = 0; i < unit.length; i++) {
    msTime += num[i] * units[unit[i]];
  }
  to.trim().toLowerCase();
  return msTime * units[to] ** -1;
};

module.exports = timeConverter;
