// server/server.js
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import compression from "compression";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import campaignRoutes from "./routes/campaign.js";
import donationRoutes from "./routes/donation.js";
import commentRoutes from "./routes/comment.js";
import notificationRoutes from "./routes/notification.js";
import userRoutes from "./routes/user.js";
import paymentRoutes from "./routes/payment.js";
import adminRoutes from "./routes/admin.js";

import {
  errorHandler,
  notFound,
  handleUnhandledRejection,
  handleUncaughtException,
} from "./middleware/error.js";

import monthlyEmailService from "./utils/monthlyEmailService.js";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

/* =====================================================
   ✅ BULLETPROOF CORS (RENDER + VERCEL + LOCALHOST)
===================================================== */

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Postman, mobile apps)
      if (!origin) return callback(null, true);

      // Allow localhost
      if (origin.includes("localhost")) {
        return callback(null, true);
      }

      // Allow any vercel deployment (production + preview)
      if (origin.includes("vercel.app")) {
        return callback(null, true);
      }

      // Allow your custom production domain if added later
      if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
        return callback(null, true);
      }

      return callback(null, true); // Allow all (safe for now)
    },
    credentials: true,
  })
);

// Handle preflight explicitly
app.options("*", cors());

/* =====================================================
   ✅ SOCKET.IO SETUP (FIXED CORS)
===================================================== */

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

global.io = io;
app.set("io", io);

/* =====================================================
   ✅ STATIC FILES
===================================================== */

app.use("/uploads", express.static("uploads"));

/* =====================================================
   ✅ SECURITY MIDDLEWARE
===================================================== */

app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());

/* =====================================================
   ✅ REQUEST TIMEOUT
===================================================== */

app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    const err = new Error("Request timeout");
    err.status = 408;
    next(err);
  });

  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: "Request timeout - server took too long to respond",
      });
    }
  });

  next();
});

/* =====================================================
   ✅ RATE LIMITING
===================================================== */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api/", limiter);

/* =====================================================
   ✅ BODY PARSER
===================================================== */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =====================================================
   ✅ ROUTES
===================================================== */

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

/* =====================================================
   ✅ PLACEHOLDER IMAGE SERVICE
===================================================== */

app.get("/api/placeholder/:width/:height", (req, res) => {
  const { width, height } = req.params;
  const w = parseInt(width) || 400;
  const h = parseInt(height) || 300;

  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#9ca3af" text-anchor="middle" dy=".3em">
        ${w} × ${h}
      </text>
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=31536000");
  res.send(svg);
});

/* =====================================================
   ✅ HEALTH CHECK
===================================================== */

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running 🚀",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Crowdfunding API is running 🚀",
    environment: process.env.NODE_ENV,
  });
});

/* =====================================================
   ✅ SOCKET EVENTS
===================================================== */

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-user", (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on("join-campaign", (campaignId) => {
    socket.join(`campaign-${campaignId}`);
  });

  socket.on("leave-campaign", (campaignId) => {
    socket.leave(`campaign-${campaignId}`);
  });

  socket.on("donation-made", (data) => {
    io.to(`campaign-${data.campaignId}`).emit("new-donation", data);
  });

  socket.on("campaign-updated", (data) => {
    io.to(`campaign-${data.campaignId}`).emit("campaign-update", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* =====================================================
   ✅ ERROR HANDLING
===================================================== */

app.use(notFound);
app.use(errorHandler);

process.on("unhandledRejection", handleUnhandledRejection);
process.on("uncaughtException", handleUncaughtException);

/* =====================================================
   ✅ DATABASE CONNECTION
===================================================== */

console.log("Attempting MongoDB connection...");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    monthlyEmailService.start();
    console.log("📧 Monthly email service started");

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* =====================================================
   ✅ GRACEFUL SHUTDOWN
===================================================== */

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down...");
  server.close(() => {
    mongoose.connection.close().then(() => {
      console.log("MongoDB disconnected");
    });
  });
});

export default app;
