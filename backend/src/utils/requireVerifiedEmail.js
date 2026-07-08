const HttpError = require("./httpError");

function requireVerifiedEmail(user) {
  if (!user.emailVerifiedAt) {
    throw new HttpError(403, "Please verify your email before continuing.");
  }
}

module.exports = requireVerifiedEmail;
