/** Gmail app passwords are 16 chars — strip spaces if pasted with gaps */
export const getEmailCredentials = () => {
    const user = (process.env.EMAIL_USER || "").trim();
    const rawPass = process.env.EMAIL_PASS || "";
    const pass = rawPass.replace(/\s+/g, "").trim();

    return {
        user,
        pass,
        host: (process.env.EMAIL_HOST || "smtp.gmail.com").trim(),
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === "true",
        configured: Boolean(user && pass),
    };
};

export const EMAIL_CONFIG = {
    OTP_TTL_SECONDS: Number(process.env.OTP_TTL_SECONDS) || 300,
    RESEND_COOLDOWN_SECONDS: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60,
    MAX_SEND_RETRIES: Number(process.env.EMAIL_MAX_RETRIES) || 3,
    RETRY_BASE_DELAY_MS: Number(process.env.EMAIL_RETRY_DELAY_MS) || 400,
    CONNECTION_TIMEOUT_MS: 10_000,
    GREETING_TIMEOUT_MS: 10_000,
    SOCKET_TIMEOUT_MS: 15_000,
};
