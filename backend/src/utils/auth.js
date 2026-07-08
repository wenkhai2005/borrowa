const jwt = require("jsonwebtoken");
const env = require("../config/env");

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt
  };
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

module.exports = {
  signToken,
  toPublicUser
};
