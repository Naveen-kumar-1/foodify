/** Socket room & event names for order real-time updates */

export const SOCKET_EVENTS = {
    ORDER_PLACED: "order-placed",
    ORDER_STATUS_UPDATED: "order-status-updated",
};

export const orderRoom = (orderId) => `order:${orderId}`;
export const restaurantRoom = (restaurantId) => `restaurant:${restaurantId}`;
