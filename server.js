import express from "express";
const morgan = require("morgan");
import cors from "cors";
import {readdirSync} from "fs";
import mongoose from "mongoose";
require("dotenv").config();

// Import routes

// Initialize app
const app = express();

// Connect to Database
mongoose
  .connect(process.env.MONGO_URI, {
    useUnifiedTopology: true,
  })
  .then(() => console.log("Successfully connected to the Database"))
  .catch((err) => console.log("Database connection error", err));


// Global middlewares (to be used on all routes)
app.use(morgan("dev"));

// Wildcard cors - anyone domain has access
// to the application
app.use(cors());
// Provides access to data on request body
app.use(express.json());

// Restrict cors - only specified domains
// have access to the application
// app.use(cors({ origin: process.env.CLIENT_URL }));

// Route middlewares

// Auto load route middlewares instead of importing routes manually
// Import and apply routes
readdirSync("./routes").map((route) =>
  app.use("/api", require(`./routes/${route}`))
);

const port = process.env.PORT || 8000;

app.listen(port, () => console.log(`Server is running on port ${port}`));
