import { Server } from "socket.io";
import Order from "../model/Order.js";
import { orderRoom, restaurantRoom } from "./orderEvents.js";
import { verifyRestaurantToken } from "./kitchenEvents.js";

let io = null;

const clientOrigin = () =>
    process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: [clientOrigin(), "http://localhost:5173", "http://localhost:5174"],
            methods: ["GET", "POST"],
            credentials: true,
        },
        pingInterval: 25000,
        pingTimeout: 20000,
        maxHttpBufferSize: 1e5,
    });

    io.on("connection", (socket) => {
        socket.on("join-order", async (payload, ack) => {
            try {
                const orderId = payload?.orderId?.trim();
                const customerSessionId = payload?.customerSessionId?.trim();
                if (!orderId || !customerSessionId) {
                    return ack?.({ ok: false, message: "orderId and customerSessionId required" });
                }

                const order = await Order.findOne({ orderId, customerSessionId }).lean();
                if (!order) {
                    return ack?.({ ok: false, message: "Order not found" });
                }

                socket.join(orderRoom(orderId));
                socket.data.customerSessionId = customerSessionId;
                if (!socket.data.orderRooms) socket.data.orderRooms = new Set();
                socket.data.orderRooms.add(orderId);

                ack?.({
                    ok: true,
                    orderId,
                    orderStatus: order.orderStatus,
                    orderNumber: order.orderNumber,
                });
            } catch (err) {
                ack?.({ ok: false, message: err.message || "Join failed" });
            }
        });

        socket.on("leave-order", ({ orderId }) => {
            if (!orderId) return;
            socket.leave(orderRoom(orderId));
            socket.data.orderRooms?.delete(orderId);
        });

        socket.on("join-restaurant", async (payload, ack) => {
            try {
                const token = payload?.token || socket.handshake.auth?.token;
                const restaurantId = await verifyRestaurantToken(token);
                socket.join(restaurantRoom(restaurantId));
                socket.data.restaurantId = restaurantId;
                socket.data.role = "restaurant";
                ack?.({ ok: true, restaurantId });
            } catch (err) {
                ack?.({ ok: false, message: err.message || "Unauthorized" });
            }
        });

        socket.on("disconnect", () => {
            socket.data.orderRooms?.clear();
        });
    });

    console.info("[Socket] Real-time order tracking enabled");
    return io;
};

export const getIO = () => io;
