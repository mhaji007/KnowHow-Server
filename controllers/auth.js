import User from "../models/user";
import { hashPassword, comparePassword } from "../utils/auth";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name) {
      return res.satus(400).send("Name is required");
    }
    if (!password || password.length < 6) {
      return res
        .satus(400)
        .send("Password is required and should be at least 6 characters");
    }
    let userExist = await User.findOne({ email }).exec();
    if (userExist) return res.status(400).send("Email is taken");
    // Hash password
    const hashedPassword = await hashPassword(password);
    // Register user
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return re.status(400).send("Error. Try again");
  }
};

// Login

// Check if user's password is correct.
// Take user's password, hash it and compare it against
// the already hashed password stored in the database.
// Generate json web token / JWT and send it to client.
// This JWT will be sent in as cookie headers and
// allows users access to protected routes

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check if user exists in database
    const user = await User.findOne({ email }).exec();
    if (!user) res.status(404).send("No user found");
    // Compare passwords
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(400).send("Error. Try again");
    } else {
      // Create signed token
      // First argument is the data to include in the signed token
      // (e.g., here user id is being included).
      // Once the token is verified later, we
      // will have access to user id as well.
      // This is the token that browsers will automatically
      // sends to the server on each request
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION_TIME,
      });
      // Return user and token to client, excluding the hashed password
      user.password = undefined;
      // Only works on https - for production
      // once we have https with ssl certificate
      // secure: true
      res.cookie("token", token, {
        httpOnly: true,
      });
      //  Send user as json response
      res.json(user);
    }
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error. Try again.");
  }
};

// Logout

// Once user logs in we need to clear the cookie on the server
// and clear the local storage and context on the frontend

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.json({ message: "Signout success" });
  } catch (err) {
    console.log(err);
  }
};

// Protected Route

export const currentUser = async (req, res) => {
  try {
    // user id is made available on req.user by requireSignin middleware
    // the "-"" before password deselects password before sending in the user
    // using req.auth here instead of req.user beacuse the decoded JWT payload
    // is now available as req.auth rather than req.user (Migration from v6)
    const user = await User.findById(req.auth._id).select("-password").exec();
    // console.log("Current user", user)
    // return res.json(user);
    return res.json({ok:true})
  } catch (err) {
    console.log(err);
  }
};

// Test Email

export const sendTestEmail = async (req, res) => {
  console.log("send email using SES");
  res.json({ ok: true });
};
