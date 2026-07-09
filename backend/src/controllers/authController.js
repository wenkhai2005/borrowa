const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { signToken, toPublicUser } = require("../utils/auth");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const { sendEmailVerificationEmail } = require("../utils/email");
const { validateEmailPayload, validateLoginPayload, validateRegisterPayload } = require("../validators/authValidator");

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

async function issuePendingVerificationEmail(email) {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new HttpError(409, "Email is already registered.");
  }

  const verification = createVerificationToken();
  const pendingRegistration = await prisma.pendingRegistration.upsert({
    where: { email },
    update: {
      emailVerificationHash: verification.tokenHash,
      emailVerificationExpiresAt: verification.expiresAt,
      emailVerifiedAt: null
    },
    create: {
      email,
      emailVerificationHash: verification.tokenHash,
      emailVerificationExpiresAt: verification.expiresAt
    }
  });

  await sendEmailVerificationEmail({
    user: { name: "there", email },
    verificationUrl: getVerificationUrl(verification.token)
  });

  return pendingRegistration;
}

const sendRegistrationVerification = asyncHandler(async (req, res) => {
  const data = validateEmailPayload(req.body);
  await issuePendingVerificationEmail(data.email);

  res.json({
    data: {
      email: data.email,
      message: "Verification email sent."
    }
  });
});

const register = asyncHandler(async (req, res) => {
  const data = validateRegisterPayload(req.body);
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new HttpError(409, "Email is already registered.");
  }

  const tokenHash = hashVerificationToken(data.verificationToken);
  const pendingRegistration = await prisma.pendingRegistration.findFirst({
    where: {
      email: data.email,
      emailVerificationHash: tokenHash,
      emailVerificationExpiresAt: { gt: new Date() },
      emailVerifiedAt: { not: null }
    }
  });

  if (!pendingRegistration) {
    throw new HttpError(403, "Verify your email before creating an account.");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: "RENTER",
      emailVerifiedAt: pendingRegistration.emailVerifiedAt
    }
  });

  await prisma.pendingRegistration.delete({
    where: { id: pendingRegistration.id }
  });

  res.status(201).json({
    data: {
      token: signToken(user),
      user: toPublicUser(user)
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const data = validateLoginPayload(req.body);
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (!user || !user.passwordHash) {
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
  const pendingRegistration = await prisma.pendingRegistration.findFirst({
    where: {
      emailVerificationHash: tokenHash,
      emailVerificationExpiresAt: { gt: new Date() }
    }
  });

  if (pendingRegistration) {
    const updatedPendingRegistration = await prisma.pendingRegistration.update({
      where: { id: pendingRegistration.id },
      data: {
        emailVerifiedAt: new Date()
      }
    });

    res.json({
      data: {
        email: updatedPendingRegistration.email,
        verificationToken: token,
        verified: true,
        user: null
      }
    });
    return;
  }

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

const becomeSeller = asyncHandler(async (req, res) => {
  if (!req.user.emailVerifiedAt) {
    throw new HttpError(403, "Verify your email before applying to become a seller.");
  }

  if (req.user.role === "SELLER") {
    res.json({
      data: {
        user: toPublicUser(req.user),
        message: "Your account is already a seller account."
      }
    });
    return;
  }

  if (req.user.role !== "RENTER") {
    throw new HttpError(400, "Only renter accounts can apply to become sellers.");
  }

  // TODO: Replace this instant upgrade with seller verification, KYC, and manual approval.
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { role: "SELLER" }
  });

  res.json({
    data: {
      user: toPublicUser(updatedUser),
      message: "Your account has been upgraded to seller."
    }
  });
});

module.exports = {
  becomeSeller,
  login,
  me,
  register,
  resendVerification,
  sendRegistrationVerification,
  verifyEmail
};
