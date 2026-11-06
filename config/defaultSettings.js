const defaultSettings = {
  runValidate: true,
  ownerCreated: false,
  auth: {
    jwtExpiresIn: 600,
  },
  uploads: {
    uploadSizeLimitMb: 5 * 1024 * 1024,
    uploadFileLimit: 1,
  },
};

module.exports = defaultSettings;
