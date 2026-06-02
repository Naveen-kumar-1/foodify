const trimTrailingSlash = (url) => String(url).replace(/\/+$/, "");

/**
 * Public frontend URL used in QR codes, password-reset emails, and CORS.
 * Set CLIENT_URL in server .env for each environment.
 *
 * Priority: CLIENT_URL → FRONTEND_URL → VITE_APP_URL → APP_URL → localhost (dev only)
 */
export const getAppBaseUrl = () => {
    const raw =
        process.env.CLIENT_URL ||
        process.env.FRONTEND_URL ||
        process.env.VITE_APP_URL ||
        process.env.APP_URL;

    if (raw?.trim()) {
        return trimTrailingSlash(raw.trim());
    }

    if (process.env.NODE_ENV === "production") {
        console.warn(
            "[appUrl] CLIENT_URL is not set. QR codes and email links will use http://localhost:5173. " +
                "Set CLIENT_URL=https://yourdomain.com in server environment variables.",
        );
    }

    return "http://localhost:5173";
};

/** Customer ordering page: /order/:qrToken */
export const buildOrderPageUrl = (qrToken) =>
    `${getAppBaseUrl()}/order/${encodeURIComponent(qrToken)}`;
