import express from "express";
const morgan = require("morgan");
import cors from "cors";
import { readdirSync } from "fs";
import mongoose from "mongoose";
import csrf from "csurf";
import cookieParser from "cookie-parser";
require("dotenv").config();

const csrfProtection = csrf({ cookie: true });

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


app.use(cookieParser());


// Provides access to data on request body
app.use(express.json());

// Wildcard cors - anyone domain has access
// to the application
// app.use(cors());

// Restrict cors - only specified domains
// have access to the application
// app.use(cors({ origin: process.env.CLIENT_URL }))
// If you want to allow credentials then your Access-Control-Allow-Origin must not use *.
// You will have to specify the exact protocol + domain + port.
//  app.use(cors({
//   origin:[
//   "http://localhost:3000",
//   "http://10.0.0.101:3000",
//   "http://10.0.0.101",
//   ],
//   origin: process.env.CLIENT_URL,
//   credentials: true,
//   exposedHeaders: ["set-cookie"],
//   }))
// app.use(cors({ origin: true, credentials: true }))

// app.use(function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL);
//   res.header('Access-Control-Allow-Credentials', true);
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//   next();
// });

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  }))

// Route middlewares

// Auto load route middlewares instead of importing routes manually
// Import and apply routes
readdirSync("./routes").map((route) =>
  app.use("/api", require(`./routes/${route}`))
);

// Protect from CSRF
app.use(csrfProtection);

app.get("/api/csrf-token", (req, res) => {
  console.log("req ====>", req.csrfToken());
  // Send back csrf token
  res.json({ csrfToken: req.csrfToken() });
});

const port = process.env.PORT || 8000;

app.listen(port, () => console.log(`Server is running on port ${port}`));
