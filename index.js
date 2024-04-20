// Imports
const express = require("express");
const morgan = require("morgan");
require("express-async-errors");
require("dotenv").config({
  path:
    process.env.NODE_ENV === "development " ? "./.env.development" : "./.env",
});
const cookieParser = require("cookie-parser");

// Security imports
const helmet = require("helmet");
const cors = require("cors");
const rateLimiter = require("express-rate-limit");
const mogoSanitize = require("express-mongo-sanitize");

// Routes imports
const authRoutes = require("./routes/auth");
const workoutsRoutes = require("./routes/workouts");
const tournamentRoutes = require("./routes/tournaments");
const userRoutes = require("./routes/user");
const friendsRoutes = require("./routes/friends");
const challengesRoutes = require("./routes/challenges");
const exercisesRoutes = require("./routes/exercises");

// Middleware imports
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const { requireAuth } = require("./middleware/auth");

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
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/workouts", requireAuth, workoutsRoutes);
app.use("/tournaments", requireAuth, tournamentRoutes);
app.use("/user", requireAuth, userRoutes);
app.use("/friends", requireAuth, friendsRoutes);
app.use("/challenges", requireAuth, challengesRoutes);
app.use("/exercises", requireAuth, exercisesRoutes);

// Error handling
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    // Starting the server
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
