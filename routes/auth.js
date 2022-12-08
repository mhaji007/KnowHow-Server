import express from "express";
const router = express.Router();
// Controllers
import { register, login } from "../controllers/auth";

router.post("/register", register);
router.post("/login", login);

// Import validators

// Import controllers

module.exports = router;
