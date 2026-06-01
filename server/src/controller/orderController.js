import * as orderService from "../services/orderService.js";
import { validateCoupon } from "../services/couponService.js";
import {
    validateCouponBody,
    validateKitchenListQuery,
    validateListOrdersQuery,
    validatePlaceOrderBody,
} from "../validations/orderValidation.js";

export const scanMenu = async (req, res) => {
    const data = await orderService.scanQrAndGetMenu(req.params.qrToken);
    res.status(200).json(data);
};

export const previewOrder = async (req, res) => {
    const payload = validatePlaceOrderBody({ ...req.body, customerSessionId: "preview" });
    const totals = await orderService.previewOrder(req.params.qrToken, payload);
    res.status(200).json(totals);
};

export const placeOrder = async (req, res) => {
    const payload = validatePlaceOrderBody(req.body);
    const order = await orderService.placeOrder(req.params.qrToken, payload);
    res.status(201).json({ message: "Order placed successfully", order });
};

export const trackOrder = async (req, res) => {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ message: "sessionId is required" });
    const order = await orderService.getOrderForTracking(req.params.orderId, sessionId);
    res.status(200).json({ order });
};

export const validateCouponCode = async (req, res) => {
    const { code, subtotal } = validateCouponBody(req.body);
    const table = await orderService.scanQrAndGetMenu(req.params.qrToken);
    const result = await validateCoupon(table.restaurant.restaurantId, code, subtotal);
    res.status(200).json(result);
};

export const getOrders = async (req, res) => {
    const query = validateListOrdersQuery(req.query);
    const result = await orderService.getOrders(req.restaurantId, query);
    res.status(200).json(result);
};

export const getOrderStats = async (req, res) => {
    const stats = await orderService.getOrderStats(req.restaurantId);
    res.status(200).json({ stats });
};

export const getOrder = async (req, res) => {
    const order = await orderService.getOrderById(req.restaurantId, req.params.orderId);
    res.status(200).json({ order });
};

export const updateOrderStatus = async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "status is required" });
    const order = await orderService.updateOrderStatus(
        req.restaurantId,
        req.params.orderId,
        status,
    );
    res.status(200).json({ message: "Order status updated", order });
};

export const getKitchenBoard = async (req, res) => {
    const query = validateKitchenListQuery(req.query);
    const result = await orderService.getKitchenOrders(req.restaurantId, query);
    res.status(200).json(result);
};

export const kitchenUpdateStatus = async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "status is required" });
    const order = await orderService.updateOrderStatus(
        req.restaurantId,
        req.params.orderId,
        status,
    );
    res.status(200).json({ message: "Status updated", order });
};
