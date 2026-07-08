const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { signToken, toPublicUser } = require("../utils/auth");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const { sendEmailVerificationEmail } = require("../utils/email");
const { validateLoginPayload, validateRegisterPayload } = require("../validators/authValidator");

const verificationTokenTtlMs = 24 * 60 * 60 * 1000;

function hashVerificationToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashVerificationToken(token),
    expiresAt: new Date(Date.now() + verificationTokenTtlMs)
  };
}

function getVerificationUrl(token) {
  const baseUrl = env.frontendUrl.replace(/\/$/, "");
  return `${baseUrl}/#/verify-email?token=${encodeURIComponent(token)}`;
}

async function issueVerificationEmail(user) {
  const verification = createVerificationToken();
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationTokenHash: verification.tokenHash,
      emailVerificationExpiresAt: verification.expiresAt
    }
  });

  await sendEmailVerificationEmail({
    user: updatedUser,
    verificationUrl: getVerificationUrl(verification.token)
  });

  return updatedUser;
}

const register = asyncHandler(async (req, res) => {
  const data = validateRegisterPayload(req.body);
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new HttpError(409, "Email is already registered.");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role
    }
  });
  const userWithVerification = await issueVerificationEmail(user);

  res.status(201).json({
    data: {
      token: signToken(userWithVerification),
      user: toPublicUser(userWithVerification)
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const data = validateLoginPayload(req.body);
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user) {
    throw new HttpError(401, "Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, "Invalid email or password.");
  }

  res.json({
    data: {
      token: signToken(user),
      user: toPublicUser(user)
    }
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ data: { user: toPublicUser(req.user) } });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token.trim() : "";

  if (!token) {
    throw new HttpError(400, "Verification token is required.");
  }

  const tokenHash = hashVerificationToken(token);
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { gt: new Date() }
    }
  });

  if (!user) {
    throw new HttpError(400, "Verification token is invalid or expired.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null
    }
  });

  res.json({ data: { user: toPublicUser(updatedUser) } });
});

const resendVerification = asyncHandler(async (req, res) => {
  if (req.user.emailVerifiedAt) {
    throw new HttpError(400, "Email is already verified.");
  }

  await issueVerificationEmail(req.user);

  res.json({ data: { message: "Verification email sent." } });
});

module.exports = {
  login,
  me,
  register,
  resendVerification,
  verifyEmail
};
