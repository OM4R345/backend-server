const { join } = require("node:path");
const isObject = require("../../utilities/isObject");
const deleteOldKey = require("./deleteOldKey");
const checkPromise = require("../../utilities/checkPromise");
const removedVersions = require("./removedVersions");

const deleteAllOldKeys = async (
  type,
  count = { privateCount, publicCount },
  includeNewest = false,
) => {
  type = type.toLowerCase().trim();
  if (!/^(all|private|public)$/.test(type))
    throw new Error(`Umkown type: ${type}`);

  const { privateCount, publicCount } = count;
  const _count = {};

  if (isObject(count)) {
    if (Object.keys(count).length === 2) {
      if (Number.isFinite(privateCount) && Number.isFinite(publicCount)) {
        _count.private = privateCount;
        _count.public = publicCount;
      } else {
        throw new Error(`private or public count is not nmber`);
      }
    } else if (
      (type === "private" && publicCount > 0 && privateCount == null) ||
      (type === "public" && privateCount > 0 && publicCount == null)
    ) {
      throw new Error("type count must match type");
    } else {
      _count[type] = privateCount == null ? publicCount : privateCount;
    }
  } else if (type === "all" && Number.isFinite(count)) {
    _count.private = _count.public = count;
  } else if (type !== "all" && Number.isFinite(count)) {
    _count[type] = count;
  } else {
    throw new Error("Invalid data type.");
  }

  const privatePath = "../../keys/private";
  const publicPath = "../../keys/public";

  if (type === "all") {
    const [privateRemovedVersions, publicRemovedVersions] =
      await Promise.allSettled([
        await removedVersions("private", _count.private, includeNewest),
        await removedVersions("public", _count.public, includeNewest),
      ]);

    const versions = [
      privateRemovedVersions.map((v) => `${privatePath}/${v}`),
      publicRemovedVersions.map((v) => `${publicPath}/${v}`),
    ].flat();
    const promises = await Promise.allSettled([
      versions.map(async (v) => await deleteOldKey(join(__dirname, v))),
    ]);
    const checked = checkPromise(promises);

    return checked?.value;
  } else {
    const typeCount = _count[type];
    const typePath = type === "private" ? privatePath : publicPath;
    const fieldDir = await removedVersions(type, typeCount, includeNewest);

    const fieldProcess = () =>
      fieldDir.map(
        async (v) => await deleteOldKey(join(__dirname, typePath, v)),
      );

    const fieldResult = await Promise.allSettled([await fieldProcess()]);
    const fr = checkPromise(fieldResult);
    return fr?.value;
  }
};

module.exports = deleteAllOldKeys;
