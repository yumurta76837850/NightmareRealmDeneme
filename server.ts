import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { router as userRouter } from "./routes/userRoutes.js";
import { router as productRouter } from "./routes/productRoutes.js";
import { router as orderRouter } from "./routes/orderRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { connectDB } from "./config/db.js";

console.log("Server is starting...");

const app = express();
const PORT = process.env.PORT || 5000;

// DB bağlantısı
(async () => {
    try {
        await connectDB();
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1); // Hata varsa sunucuyu kapat
    }
})();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);

// 404 ve Hata yakalama
app.use(notFoundHandler);
app.use(errorHandler);

// Sunucuyu dinle
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});

export default app;
