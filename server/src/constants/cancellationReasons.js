export const OTHER_REASON = "Other";

export const CUSTOMER_CANCELLATION_REASONS = [
    "Ordered by mistake",
    "Want to change items",
    "Waiting time is too long",
    "Duplicate order",
    "No longer needed",
    OTHER_REASON,
];

export const STAFF_CANCELLATION_REASONS = [
    "Item unavailable",
    "Out of stock",
    "Kitchen issue",
    "Restaurant closed",
    "Unable to fulfill order",
    "Duplicate order",
    OTHER_REASON,
];

export const parseCancellationPayload = (body, actor) => {
    const cancellationReason = body.cancellationReason?.trim();
    const customReason = body.customReason?.trim() || null;
    const allowed =
        actor === "customer" ? CUSTOMER_CANCELLATION_REASONS : STAFF_CANCELLATION_REASONS;

    if (!cancellationReason || !allowed.includes(cancellationReason)) {
        throw new Error("Please select a valid cancellation reason");
    }

    if (cancellationReason === OTHER_REASON) {
        if (!customReason || customReason.length < 5) {
            throw new Error("Please specify the reason (at least 5 characters)");
        }
    }

    return { cancellationReason, customReason: cancellationReason === OTHER_REASON ? customReason : null };
};
