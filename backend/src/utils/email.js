const nodemailer = require("nodemailer");
const env = require("../config/env");

const BRAND_NAME = "Borrowa";
const BRAND_TAGLINE = "Borrow smarter. Own less.";

function hasSmtpConfig() {
  return Boolean(env.smtp.host && env.smtp.port && env.smtp.user && env.smtp.pass && env.smtp.from);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-MY", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR"
  }).format(Number(value || 0));
}

function bookingSummary(booking) {
  return {
    listingTitle: booking.listing?.title || "Borrowa listing",
    listingOwnerName: booking.listing?.ownerName || "Seller",
    listingOwnerEmail: booking.listing?.ownerEmail || "",
    renterName: booking.renterName,
    renterEmail: booking.renterEmail,
    startDate: formatDate(booking.startDate),
    endDate: formatDate(booking.endDate),
    totalPrice: formatMoney(booking.totalPrice),
    status: booking.status
  };
}

function buildBookingEmail(booking, heading, nextStep) {
  const summary = bookingSummary(booking);
  const text = [
    `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    "",
    heading,
    "",
    `Listing: ${summary.listingTitle}`,
    `Seller: ${summary.listingOwnerName} <${summary.listingOwnerEmail}>`,
    `Renter: ${summary.renterName} <${summary.renterEmail}>`,
    `Dates: ${summary.startDate} to ${summary.endDate}`,
    `Total: ${summary.totalPrice}`,
    `Status: ${summary.status}`,
    "",
    `Next step: ${nextStep}`
  ].join("\n");

  const html = `
    <p><strong>${BRAND_NAME}</strong><br />${BRAND_TAGLINE}</p>
    <h2>${heading}</h2>
    <ul>
      <li><strong>Listing:</strong> ${summary.listingTitle}</li>
      <li><strong>Seller:</strong> ${summary.listingOwnerName} &lt;${summary.listingOwnerEmail}&gt;</li>
      <li><strong>Renter:</strong> ${summary.renterName} &lt;${summary.renterEmail}&gt;</li>
      <li><strong>Dates:</strong> ${summary.startDate} to ${summary.endDate}</li>
      <li><strong>Total:</strong> ${summary.totalPrice}</li>
      <li><strong>Status:</strong> ${summary.status}</li>
    </ul>
    <p><strong>Next step:</strong> ${nextStep}</p>
  `;

  return { html, text };
}

function buildRefundEmail(booking, heading, nextStep) {
  const summary = bookingSummary(booking);
  const refundReason = booking.refundReason || "No reason provided";
  const responseNote = booking.refundResponseNote || "No response note yet";
  const text = [
    `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    "",
    heading,
    "",
    `Listing: ${summary.listingTitle}`,
    `Seller: ${summary.listingOwnerName} <${summary.listingOwnerEmail}>`,
    `Renter: ${summary.renterName} <${summary.renterEmail}>`,
    `Dates: ${summary.startDate} to ${summary.endDate}`,
    `Total: ${summary.totalPrice}`,
    `Booking status: ${summary.status}`,
    `Refund status: ${booking.refundStatus}`,
    `Refund reason: ${refundReason}`,
    `Response note: ${responseNote}`,
    "",
    `Next step: ${nextStep}`
  ].join("\n");

  const html = `
    <p><strong>${BRAND_NAME}</strong><br />${BRAND_TAGLINE}</p>
    <h2>${heading}</h2>
    <ul>
      <li><strong>Listing:</strong> ${summary.listingTitle}</li>
      <li><strong>Seller:</strong> ${summary.listingOwnerName} &lt;${summary.listingOwnerEmail}&gt;</li>
      <li><strong>Renter:</strong> ${summary.renterName} &lt;${summary.renterEmail}&gt;</li>
      <li><strong>Dates:</strong> ${summary.startDate} to ${summary.endDate}</li>
      <li><strong>Total:</strong> ${summary.totalPrice}</li>
      <li><strong>Booking status:</strong> ${summary.status}</li>
      <li><strong>Refund status:</strong> ${booking.refundStatus}</li>
      <li><strong>Refund reason:</strong> ${refundReason}</li>
      <li><strong>Response note:</strong> ${responseNote}</li>
    </ul>
    <p><strong>Next step:</strong> ${nextStep}</p>
  `;

  return { html, text };
}

function buildCompletionEmail(booking, heading, nextStep) {
  const summary = bookingSummary(booking);
  const completionNote = booking.completionNote || "No completion note provided";
  const text = [
    `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    "",
    heading,
    "",
    `Listing: ${summary.listingTitle}`,
    `Seller: ${summary.listingOwnerName} <${summary.listingOwnerEmail}>`,
    `Renter: ${summary.renterName} <${summary.renterEmail}>`,
    `Dates: ${summary.startDate} to ${summary.endDate}`,
    `Total: ${summary.totalPrice}`,
    `Status: ${summary.status}`,
    `Completion note: ${completionNote}`,
    "",
    `Next step: ${nextStep}`
  ].join("\n");

  const html = `
    <p><strong>${BRAND_NAME}</strong><br />${BRAND_TAGLINE}</p>
    <h2>${heading}</h2>
    <ul>
      <li><strong>Listing:</strong> ${summary.listingTitle}</li>
      <li><strong>Seller:</strong> ${summary.listingOwnerName} &lt;${summary.listingOwnerEmail}&gt;</li>
      <li><strong>Renter:</strong> ${summary.renterName} &lt;${summary.renterEmail}&gt;</li>
      <li><strong>Dates:</strong> ${summary.startDate} to ${summary.endDate}</li>
      <li><strong>Total:</strong> ${summary.totalPrice}</li>
      <li><strong>Status:</strong> ${summary.status}</li>
      <li><strong>Completion note:</strong> ${completionNote}</li>
    </ul>
    <p><strong>Next step:</strong> ${nextStep}</p>
  `;

  return { html, text };
}

function damageReportSummary(report) {
  const booking = report.booking || {};
  const listing = booking.listing || {};

  return {
    listingTitle: listing.title || "Borrowa listing",
    sellerEmail: report.sellerEmail,
    renterEmail: report.renterEmail,
    renterName: booking.renterName || "Renter",
    startDate: booking.startDate ? formatDate(booking.startDate) : "Unavailable",
    endDate: booking.endDate ? formatDate(booking.endDate) : "Unavailable",
    title: report.title,
    description: report.description,
    claimAmount: report.claimAmount ? formatMoney(report.claimAmount) : "No claim amount",
    status: report.status
  };
}

function buildDamageReportEmail(report, heading, nextStep) {
  const summary = damageReportSummary(report);
  const text = [
    `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    "",
    heading,
    "",
    `Listing: ${summary.listingTitle}`,
    `Rental dates: ${summary.startDate} to ${summary.endDate}`,
    `Seller: ${summary.sellerEmail}`,
    `Renter: ${summary.renterName} <${summary.renterEmail}>`,
    `Damage title: ${summary.title}`,
    `Description: ${summary.description}`,
    `Claim amount: ${summary.claimAmount}`,
    `Status: ${summary.status}`,
    "",
    `Next step: ${nextStep}`
  ].join("\n");

  const html = `
    <p><strong>${BRAND_NAME}</strong><br />${BRAND_TAGLINE}</p>
    <h2>${heading}</h2>
    <ul>
      <li><strong>Listing:</strong> ${summary.listingTitle}</li>
      <li><strong>Rental dates:</strong> ${summary.startDate} to ${summary.endDate}</li>
      <li><strong>Seller:</strong> ${summary.sellerEmail}</li>
      <li><strong>Renter:</strong> ${summary.renterName} &lt;${summary.renterEmail}&gt;</li>
      <li><strong>Damage title:</strong> ${summary.title}</li>
      <li><strong>Description:</strong> ${summary.description}</li>
      <li><strong>Claim amount:</strong> ${summary.claimAmount}</li>
      <li><strong>Status:</strong> ${summary.status}</li>
    </ul>
    <p><strong>Next step:</strong> ${nextStep}</p>
  `;

  return { html, text };
}

function buildChatMessageEmail({ booking, message }) {
  const listingTitle = booking.listing?.title || "Borrowa listing";
  const sender = `${message.senderName} <${message.senderEmail}>`;
  const startDate = formatDate(booking.startDate);
  const endDate = formatDate(booking.endDate);
  const preview = message.message.length > 180 ? `${message.message.slice(0, 180)}...` : message.message;
  const text = [
    `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    "",
    "New message about your booking",
    "",
    `Listing: ${listingTitle}`,
    `Sender: ${sender}`,
    `Booking dates: ${startDate} to ${endDate}`,
    `Message: ${preview}`,
    "",
    "Next step: Log in to reply."
  ].join("\n");

  const html = `
    <p><strong>${BRAND_NAME}</strong><br />${BRAND_TAGLINE}</p>
    <h2>New message about your booking</h2>
    <ul>
      <li><strong>Listing:</strong> ${listingTitle}</li>
      <li><strong>Sender:</strong> ${sender}</li>
      <li><strong>Booking dates:</strong> ${startDate} to ${endDate}</li>
      <li><strong>Message:</strong> ${preview}</li>
    </ul>
    <p><strong>Next step:</strong> Log in to reply.</p>
  `;

  return { html, text };
}

function buildEmailVerificationEmail({ name, verificationUrl }) {
  const text = [
    `Hi ${name},`,
    "",
    `Please verify your ${BRAND_NAME} account email address.`,
    "",
    `Verify email: ${verificationUrl}`,
    "",
    "This link expires in 24 hours."
  ].join("\n");

  const html = `
    <h2>Verify your email address</h2>
    <p>Hi ${name},</p>
    <p>Please verify your ${BRAND_NAME} account email address.</p>
    <p>${BRAND_TAGLINE}</p>
    <p><a href="${verificationUrl}">Verify email</a></p>
    <p>This link expires in 24 hours.</p>
  `;

  return { html, text };
}

async function sendEmail({ to, subject, html, text }) {
  if (!to) {
    console.log("[email:skipped] Missing recipient", { subject, text });
    return;
  }

  if (!hasSmtpConfig()) {
    console.log("[email:mock]", { to, from: env.smtp.from || "mock", subject, text, html });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure ?? env.smtp.port === 465,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass
    }
  });

  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error("[email:error]", {
      to,
      subject,
      message: error.message
    });
  }
}

function sendBookingEmail({ booking, to, subject, heading, nextStep }) {
  const content = buildBookingEmail(booking, heading, nextStep);
  return sendEmail({ to, subject, ...content });
}

function sendRefundEmail({ booking, to, subject, heading, nextStep }) {
  const content = buildRefundEmail(booking, heading, nextStep);
  return sendEmail({ to, subject, ...content });
}

function sendCompletionEmail({ booking, to, subject, heading, nextStep }) {
  const content = buildCompletionEmail(booking, heading, nextStep);
  return sendEmail({ to, subject, ...content });
}

function sendDamageReportEmail({ report, to, subject, heading, nextStep }) {
  const content = buildDamageReportEmail(report, heading, nextStep);
  return sendEmail({ to, subject, ...content });
}

function sendNewChatMessageEmail({ booking, message, recipientEmail }) {
  const content = buildChatMessageEmail({ booking, message });
  return sendEmail({
    to: recipientEmail,
    subject: `${BRAND_NAME}: New message about your booking`,
    ...content
  });
}

function sendEmailVerificationEmail({ user, verificationUrl }) {
  const content = buildEmailVerificationEmail({
    name: user.name,
    verificationUrl
  });

  return sendEmail({
    to: user.email,
    subject: `Verify your ${BRAND_NAME} email`,
    ...content
  });
}

function sendNewBookingRequestEmailToSeller(booking) {
  return sendBookingEmail({
    booking,
    to: booking.listing?.ownerEmail,
    subject: `${BRAND_NAME}: New booking request for ${booking.listing?.title || "your listing"}`,
    heading: "New booking request received",
    nextStep: "Open Seller Dashboard > Booking Requests to accept or decline this request."
  });
}

function sendBookingRequestSubmittedEmailToRenter(booking) {
  return sendBookingEmail({
    booking,
    to: booking.renterEmail,
    subject: `${BRAND_NAME}: Your booking request was submitted`,
    heading: "Booking request submitted",
    nextStep: "Wait for the seller to accept or decline your request."
  });
}

function sendBookingConfirmedEmailToRenter(booking) {
  return sendBookingEmail({
    booking,
    to: booking.renterEmail,
    subject: `${BRAND_NAME}: Your booking is confirmed`,
    heading: "Your booking is confirmed",
    nextStep: "Coordinate pickup or delivery with the seller before the rental start date."
  });
}

function sendBookingAcceptedEmailToSeller(booking) {
  return sendBookingEmail({
    booking,
    to: booking.listing?.ownerEmail,
    subject: `${BRAND_NAME}: Booking accepted for ${booking.listing?.title || "your listing"}`,
    heading: "Booking accepted",
    nextStep: "Prepare the gear and coordinate handoff with the renter."
  });
}

function sendBookingDeclinedEmailToRenter(booking) {
  return sendBookingEmail({
    booking,
    to: booking.renterEmail,
    subject: `${BRAND_NAME}: Your booking request was declined`,
    heading: "Booking request declined",
    nextStep: "Browse other available gear and submit a new request."
  });
}

function sendBookingDeclinedEmailToSeller(booking) {
  return sendBookingEmail({
    booking,
    to: booking.listing?.ownerEmail,
    subject: `${BRAND_NAME}: Booking declined for ${booking.listing?.title || "your listing"}`,
    heading: "Booking declined",
    nextStep: "No further action is required."
  });
}

function sendRefundRequestEmailToSeller(booking) {
  return sendRefundEmail({
    booking,
    to: booking.listing?.ownerEmail,
    subject: `${BRAND_NAME}: Refund requested for ${booking.listing?.title || "your listing"}`,
    heading: "Refund request received",
    nextStep: "Open Seller Dashboard > Refund Requests to approve or reject this request."
  });
}

function sendRefundRequestSubmittedEmailToRenter(booking) {
  return sendRefundEmail({
    booking,
    to: booking.renterEmail,
    subject: `${BRAND_NAME}: Your refund request was submitted`,
    heading: "Refund request submitted",
    nextStep: "Wait for the seller to approve or reject your refund request."
  });
}

function sendRefundApprovedEmailToRenter(booking) {
  return sendRefundEmail({
    booking,
    to: booking.renterEmail,
    subject: `${BRAND_NAME}: Your refund request was approved`,
    heading: "Refund approved",
    nextStep: "The refund is approved. Payment processing is still mocked in this MVP."
  });
}

function sendRefundApprovedEmailToSeller(booking) {
  return sendRefundEmail({
    booking,
    to: booking.listing?.ownerEmail,
    subject: `${BRAND_NAME}: Refund approved for ${booking.listing?.title || "your listing"}`,
    heading: "Refund approved confirmation",
    nextStep: "No further action is required in this MVP."
  });
}

function sendRefundRejectedEmailToRenter(booking) {
  return sendRefundEmail({
    booking,
    to: booking.renterEmail,
    subject: `${BRAND_NAME}: Your refund request was rejected`,
    heading: "Refund rejected",
    nextStep: "Review the seller response note in My Bookings."
  });
}

function sendRefundRejectedEmailToSeller(booking) {
  return sendRefundEmail({
    booking,
    to: booking.listing?.ownerEmail,
    subject: `${BRAND_NAME}: Refund rejected for ${booking.listing?.title || "your listing"}`,
    heading: "Refund rejected confirmation",
    nextStep: "No further action is required."
  });
}

function sendBookingCompletedEmailToRenter(booking) {
  return sendCompletionEmail({
    booking,
    to: booking.renterEmail,
    subject: `${BRAND_NAME}: Your booking is completed`,
    heading: "Booking completed",
    nextStep: "The seller marked the item as returned. Deposit or refund handling is separate for now."
  });
}

function sendBookingCompletedEmailToSeller(booking) {
  return sendCompletionEmail({
    booking,
    to: booking.listing?.ownerEmail,
    subject: `${BRAND_NAME}: Booking completed for ${booking.listing?.title || "your listing"}`,
    heading: "Booking completed confirmation",
    nextStep: "No further action is required unless deposit or refund handling is needed separately."
  });
}

function sendDamageReportedEmailToRenter(report) {
  return sendDamageReportEmail({
    report,
    to: report.renterEmail,
    subject: `${BRAND_NAME}: Damage reported for ${report.booking?.listing?.title || "your booking"}`,
    heading: "Damage report submitted",
    nextStep: "The platform or seller will review this manually. No payment deduction is processed in this MVP."
  });
}

function sendDamageReportSubmittedEmailToSeller(report) {
  return sendDamageReportEmail({
    report,
    to: report.sellerEmail,
    subject: `${BRAND_NAME}: Damage report recorded for ${report.booking?.listing?.title || "your listing"}`,
    heading: "Damage report recorded",
    nextStep: "The report is recorded. Manual dispute resolution is not implemented yet."
  });
}

module.exports = {
  sendBookingAcceptedEmailToSeller,
  sendBookingCompletedEmailToRenter,
  sendBookingCompletedEmailToSeller,
  sendBookingConfirmedEmailToRenter,
  sendBookingDeclinedEmailToRenter,
  sendBookingDeclinedEmailToSeller,
  sendBookingRequestSubmittedEmailToRenter,
  sendDamageReportedEmailToRenter,
  sendDamageReportSubmittedEmailToSeller,
  sendEmail,
  sendEmailVerificationEmail,
  sendNewBookingRequestEmailToSeller,
  sendNewChatMessageEmail,
  sendRefundApprovedEmailToRenter,
  sendRefundApprovedEmailToSeller,
  sendRefundRejectedEmailToRenter,
  sendRefundRejectedEmailToSeller,
  sendRefundRequestEmailToSeller,
  sendRefundRequestSubmittedEmailToRenter
};
