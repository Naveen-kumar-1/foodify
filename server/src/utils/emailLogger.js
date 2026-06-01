const formatMeta = (meta = {}) =>
  Object.entries(meta)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

export const logEmailAttempt = ({ type, to, attempt, maxAttempts }) => {
  console.info(
    `[Email] SEND_ATTEMPT ${formatMeta({ type, to, attempt, maxAttempts, at: new Date().toISOString() })}`,
  );
};

export const logEmailSuccess = ({ type, to, messageId, attempt, durationMs }) => {
  console.info(
    `[Email] SEND_SUCCESS ${formatMeta({ type, to, messageId, attempt, durationMs, at: new Date().toISOString() })}`,
  );
};

export const logEmailFailure = ({ type, to, attempt, error, durationMs }) => {
  console.error(
    `[Email] SEND_FAILURE ${formatMeta({
      type,
      to,
      attempt,
      durationMs,
      error: error?.message || error,
      at: new Date().toISOString(),
    })}`,
  );
};

export const logEmailSkipped = ({ type, to, reason }) => {
  console.warn(`[Email] SEND_SKIPPED ${formatMeta({ type, to, reason, at: new Date().toISOString() })}`);
};
