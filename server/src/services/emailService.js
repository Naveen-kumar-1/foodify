import nodemailer from "nodemailer";
import { EMAIL_CONFIG, getEmailCredentials } from "../config/emailConfig.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  logEmailAttempt,
  logEmailFailure,
  logEmailSuccess,
} from "../utils/emailLogger.js";

const { OTP_TTL_SECONDS } = EMAIL_CONFIG;

const emailCreds = getEmailCredentials();

const transporter = nodemailer.createTransport({
  host: emailCreds.host,
  port: emailCreds.port,
  secure: emailCreds.secure,
  requireTLS: !emailCreds.secure && emailCreds.port === 587,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: EMAIL_CONFIG.CONNECTION_TIMEOUT_MS,
  greetingTimeout: EMAIL_CONFIG.GREETING_TIMEOUT_MS,
  socketTimeout: EMAIL_CONFIG.SOCKET_TIMEOUT_MS,
  auth: {
    user: emailCreds.user,
    pass: emailCreds.pass,
  },
  tls: {
    minVersion: "TLSv1.2",
  },
});

let transporterVerified = false;

const verifyTransporter = async () => {
  try {
    await transporter.verify();
    transporterVerified = true;
    console.info("[Email] SMTP connection verified and ready (pooled)");
  } catch (error) {
    transporterVerified = false;
    console.error("[Email] SMTP verification failed:", error.message);
  }
};

verifyTransporter();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildEmailLayout = ({ preheader, title, bodyHtml }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="background:#111827;padding:20px 24px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">Foodify</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;color:#18181b;font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;color:#71717a;font-size:12px;line-height:1.5;border-top:1px solid #f4f4f5;">
              This is an automated message from Foodify. If you did not request this, you can safely ignore this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const buildOTPEmailTemplate = (name, otp) => {
  const safeName = escapeHtml(name);
  const safeOtp = escapeHtml(otp);
  const expiryMinutes = Math.floor(OTP_TTL_SECONDS / 60);

  return {
    subject: `${otp} is your Foodify verification code`,
    text: `Hi ${name},\n\nYour Foodify verification code is: ${otp}\n\nThis code expires in ${expiryMinutes} minutes.\n\nIf you did not request this, please ignore this email.\n\n— Foodify Team`,
    html: buildEmailLayout({
      preheader: `Your verification code is ${otp}. Expires in ${expiryMinutes} minutes.`,
      title: "Verify your Foodify account",
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 20px;">Use this one-time code to verify your email and continue registration:</p>
        <p style="margin:0 0 20px;font-size:34px;font-weight:700;letter-spacing:8px;color:#111827;text-align:center;">${safeOtp}</p>
        <p style="margin:0;color:#52525b;">This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
      `,
    }),
  };
};

const buildPasswordResetEmailTemplate = (name, otp) => {
  const safeName = escapeHtml(name);
  const safeOtp = escapeHtml(otp);
  const expiryMinutes = Math.floor(OTP_TTL_SECONDS / 60);

  return {
    subject: `${otp} is your Foodify password reset code`,
    text: `Hi ${name},\n\nYour password reset code is: ${otp}\n\nThis code expires in ${expiryMinutes} minutes.\n\nIf you did not request this, please ignore this email.\n\n— Foodify Team`,
    html: buildEmailLayout({
      preheader: `Your password reset code is ${otp}. Expires in ${expiryMinutes} minutes.`,
      title: "Reset your Foodify password",
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 20px;">Use this code to reset your password:</p>
        <p style="margin:0 0 20px;font-size:34px;font-weight:700;letter-spacing:8px;color:#111827;text-align:center;">${safeOtp}</p>
        <p style="margin:0;color:#52525b;">This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
      `,
    }),
  };
};

const sendWithRetry = async ({ type, to, subject, text, html }) => {
  if (!emailCreds.configured) {
    throw new AppError(
      "Email is not configured. Set EMAIL_USER and EMAIL_PASS in server .env",
      503,
    );
  }

  const mailOptions = {
    from: `"Foodify" <${emailCreds.user}>`,
    to,
    subject,
    text,
    html,
    priority: "high",
    headers: {
      "X-Priority": "1",
      "X-MSMail-Priority": "High",
      Importance: "high",
    },
  };

  if (!transporterVerified) {
    await verifyTransporter();
  }

  let lastError;

  for (let attempt = 1; attempt <= EMAIL_CONFIG.MAX_SEND_RETRIES; attempt += 1) {
    const startedAt = Date.now();
    logEmailAttempt({ type, to, attempt, maxAttempts: EMAIL_CONFIG.MAX_SEND_RETRIES });

    try {
      const info = await transporter.sendMail(mailOptions);
      const durationMs = Date.now() - startedAt;

      logEmailSuccess({
        type,
        to,
        messageId: info.messageId,
        attempt,
        durationMs,
      });

      return {
        success: true,
        messageId: info.messageId,
        attempt,
        durationMs,
      };
    } catch (error) {
      lastError = error;
      logEmailFailure({
        type,
        to,
        attempt,
        error,
        durationMs: Date.now() - startedAt,
      });

      if (attempt < EMAIL_CONFIG.MAX_SEND_RETRIES) {
        const delay = EMAIL_CONFIG.RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw new Error(
    lastError?.message || "Failed to send email after multiple attempts. Please try again later.",
  );
};

export const sendOTPEmail = async (email, name, otp) => {
  const { subject, text, html } = buildOTPEmailTemplate(name, otp);
  return sendWithRetry({ type: "signup_otp", to: email, subject, text, html });
};

export const sendPasswordResetOTPEmail = async (email, name, otp) => {
  const { subject, text, html } = buildPasswordResetEmailTemplate(name, otp);
  return sendWithRetry({ type: "reset_otp", to: email, subject, text, html });
};

const buildPasswordResetLinkEmailTemplate = (name, resetUrl) => {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(resetUrl);

  return {
    subject: "Reset your Foodify password",
    text: `Hi ${name},\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link expires in 30 minutes.\n\nIf you did not request this, ignore this email.\n\n— Foodify Team`,
    html: buildEmailLayout({
      preheader: "Reset your Foodify account password",
      title: "Reset your password",
      bodyHtml: `
        <p style="margin:0 0 12px;">Hi ${safeName},</p>
        <p style="margin:0 0 20px;">Click the button below to choose a new password:</p>
        <p style="margin:0 0 24px;text-align:center;">
          <a href="${safeUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Reset password</a>
        </p>
        <p style="margin:0 0 12px;color:#52525b;font-size:13px;">Or copy this link:</p>
        <p style="margin:0;word-break:break-all;font-size:12px;color:#71717a;">${safeUrl}</p>
        <p style="margin:20px 0 0;color:#52525b;font-size:13px;">This link expires in <strong>30 minutes</strong>.</p>
      `,
    }),
  };
};

export const sendPasswordResetLinkEmail = async (email, name, resetUrl) => {
  const { subject, text, html } = buildPasswordResetLinkEmailTemplate(name, resetUrl);
  return sendWithRetry({ type: "reset_link", to: email, subject, text, html });
};

export const getEmailDeliveryMeta = () => ({
  transporterReady: transporterVerified,
  otpTtlSeconds: OTP_TTL_SECONDS,
});
