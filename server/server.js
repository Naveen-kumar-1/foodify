import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/authRoutes.js";
import restaurantRoutes from "./src/routes/restaurantRoutes.js";
import timeSlotRoutes from "./src/routes/timeSlotRoutes.js";
import menuRoutes from "./src/routes/menuRoutes.js";
import tableRoutes from "./src/routes/tableRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import revenueRoutes from "./src/routes/revenueRoutes.js";
import { connectDB } from "./src/config/db.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { initSocket } from "./src/socket/socketServer.js";
import { getAppBaseUrl } from "./src/config/appUrl.js";

const app = express();

app.use(cors());
app.use(express.json());
await connectDB();

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/restaurant", restaurantRoutes);
app.use("/api/timeslots", timeSlotRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/revenue", revenueRoutes);
app.get("/", (req, res) => {
    res.send("Welcome to Foodify...😀");
});

app.use(errorHandler);

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...🚀`);
    console.log(`Customer app URL (QR codes, emails): ${getAppBaseUrl()}`);
});
