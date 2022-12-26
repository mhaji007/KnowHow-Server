import express from "express";
const router = express.Router();

// Import validators

// Import middlewares
import { requireSignin } from "../middlewares";

// Import controllers
import {
  register,
  login,
  logout,
  currentUser,
  sendEmail,
  resetPassword,
} from "../controllers/auth";

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/current-user", requireSignin, currentUser);
router.post("/forgot-password", sendEmail);
router.post("/reset-password", resetPassword);

module.exports = router;