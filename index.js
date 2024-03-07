// Imports
const express = require("express");
const morgan = require("morgan");
require("express-async-errors");
require("dotenv").config();
const connectDB = require("./database/connect");

// Security imports
const helmet = require("helmet");
const cors = require("cors");
const rateLimiter = require("express-rate-limit");
const mogoSanitize = require("express-mongo-sanitize");

// Routes imports
const authRoutes = require("./routes/auth");

// Middleware imports
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

// App
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(
  rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
app.use(helmet());
app.use(cors());
app.use(mogoSanitize());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);

// Error handling
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    // Connecting to database
    await connectDB(process.env.MONGODB_URI).then(() =>
      console.log("Database connected")
    );
    // Starting the server
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
