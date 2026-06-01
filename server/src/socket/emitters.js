import { getIO } from "./socketServer.js";
import { SOCKET_EVENTS, orderRoom, restaurantRoom } from "./orderEvents.js";

const emitPayload = (order) => ({
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    restaurantId: order.restaurantId,
    tableId: order.tableId,
    table: order.table,
    orderStatus: order.orderStatus,
    total: order.total,
    subtotal: order.subtotal,
    tax: order.tax,
    discount: order.discount,
    items: order.items,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    statusHistory: order.statusHistory,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
});

export const emitOrderPlaced = (order) => {
    const io = getIO();
    if (!io || !order?.restaurantId) return;

    const payload = emitPayload(order);
    io.to(restaurantRoom(order.restaurantId)).emit(SOCKET_EVENTS.ORDER_PLACED, payload);
    io.to(orderRoom(order.orderId)).emit(SOCKET_EVENTS.ORDER_PLACED, payload);
};

export const emitOrderStatusUpdated = (order) => {
    const io = getIO();
    if (!io || !order?.restaurantId) return;

    const payload = emitPayload(order);
    io.to(orderRoom(order.orderId)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);
    io.to(restaurantRoom(order.restaurantId)).emit(SOCKET_EVENTS.ORDER_STATUS_UPDATED, payload);
};
