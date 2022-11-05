import express from "express";
const router = express.Router();
// Controllers
import {register} from "../controllers/auth"

router.get("/register", register);



// Import validators

// Import controllers


module.exports = router;