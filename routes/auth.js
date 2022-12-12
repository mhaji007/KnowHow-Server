import express from "express";
const router = express.Router();
// Controllers
import { register, login, logout } from "../controllers/auth";

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);

// Import validators

// Import controllers

module.exports = router;
