import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

const app = express();

// HTTP request logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Detailed logs in development
} else {
  app.use(morgan("combined")); // Standard Apache combined log format in production
}

app.use(express.json({ limit: "16kb" })); // Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // Middleware to parse URL-encoded bodies with a size limit
app.use(express.static("public")); // Middleware to serve static files from the "public" directory
app.use(cookieParser()); // Middleware to parse cookies

// cors configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// import the routes
import healthCheckRouter from "./src/routes/healthcheck.routes.js";
import patientRouter from "./src/routes/patient.routes.js";
import ocrRouter from "./src/routes/ocr.routes.js";
import parametersRouter from "./src/routes/parameters.routes.js";
import errorHandler from "./src/middlewares/error.middleware.js";

app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1", patientRouter);
app.use("/api/v1/patients", ocrRouter);
app.use("/api/v1", parametersRouter);

app.get("/", (req, res) => {
  res.send("Welcome to MediGuard");
});

// Global error handler - must be after all routes
app.use(errorHandler);

export default app;
