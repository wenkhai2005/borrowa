const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { sendNewChatMessageEmail } = require("../utils/email");

async function getBookingForChatOrThrow(id, userEmail) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { listing: true }
  });

  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  const isRenter = booking.renterEmail === userEmail;
  const isSeller = booking.listing.ownerEmail === userEmail;

  if (!isRenter && !isSeller) {
    throw new HttpError(403, "Only the renter or listing owner can access this chat.");
  }

  return {
    booking,
    senderRole: isRenter ? "RENTER" : "SELLER",
    recipientEmail: isRenter ? booking.listing.ownerEmail : booking.renterEmail
  };
}

const listBookingMessages = asyncHandler(async (req, res) => {
  await getBookingForChatOrThrow(req.params.id, req.user.email);

  const [messages, unreadCount] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { bookingId: req.params.id },
      orderBy: { createdAt: "asc" }
    }),
    prisma.chatMessage.count({
      where: {
        bookingId: req.params.id,
        senderEmail: { not: req.user.email },
        readAt: null
      }
    })
  ]);

  res.json({ data: { messages, unreadCount } });
});

const markBookingMessagesRead = asyncHandler(async (req, res) => {
  await getBookingForChatOrThrow(req.params.id, req.user.email);

  const result = await prisma.chatMessage.updateMany({
    where: {
      bookingId: req.params.id,
      senderEmail: { not: req.user.email },
      readAt: null
    },
    data: { readAt: new Date() }
  });

  res.json({ data: { updatedCount: result.count } });
});

const createBookingMessage = asyncHandler(async (req, res) => {
  const text = typeof req.body.message === "string" ? req.body.message.trim() : "";

  if (!text) {
    throw new HttpError(400, "Message is required.");
  }

  const { booking, senderRole, recipientEmail } = await getBookingForChatOrThrow(req.params.id, req.user.email);

  const message = await prisma.chatMessage.create({
    data: {
      bookingId: booking.id,
      senderEmail: req.user.email,
      senderName: req.user.name,
      senderRole,
      message: text
    }
  });

  await sendNewChatMessageEmail({
    booking,
    message,
    recipientEmail
  });

  res.status(201).json({ data: message });
});

module.exports = {
  createBookingMessage,
  listBookingMessages,
  markBookingMessagesRead
};
