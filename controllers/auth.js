import User from "../models/user";
import { hashPassword, comparePassword } from "../utils/auth";
import jwt from "jsonwebtoken";
import AWS from "aws-sdk";
import { nanoid } from "nanoid";

// AWS config for passing access key and secret, etc.

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

// New instance of SES service required for using AWS SES
const SES = new AWS.SES(awsConfig);

// Register

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
      return res.status(400).send("Wrong Password. Try again");
    } else {
      // Create signed token
      // First argument is the data to include in the signed token
      // (e.g., here user id is being included).
      // Once the token is verified later, we
      // will have access to user id as well.
      // This is the token that browsers will automatically
      // send to the server on each request
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION_TIME,
      });
      // Return user and token to client, excluding the hashed password
      user.password = undefined;
      // Only works on https - for production
      // once we have https with ssl certificate we can use the following
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
    return res.json({ ok: true });
  } catch (err) {
    console.log(err);
  }
};

// Reset Email
export const sendEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const shortCode = nanoid(6).toUpperCase();
    const user = await User.findOneAndUpdate(
      { email },
      { passwordResetCode: shortCode }
    );
    if (!user) return res.status(400).send("User not found");

    const params = {
      Source: process.env.EMAIL_FROM,
      // These email addresses should be verified when in sandbox mode
      Destination: {
        ToAddresses: [email],
      },
      // Email addresses that will receive the response
      ReplyToAddresses: [process.env.EMAIL_FROM],
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            // Message body
            Data: `
          <html>
            <h1>Reset Your password</h1>
            <p>We just received a request for a new password from your account.</p>
            <p>To reset your password, just enter the code below</p>
            <h2 style="color:black; background-color:yellow; width: intrinsic; width:-moz-max-content; width:-webkit-max-content;width: max-content;">${shortCode}</h2>
            <p>If you did NOT request a new password, ignore this email and your password will remain unchanged.</p>
            <i>KnoHow</i>
          </html>
      `,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: `Password reset link`,
        },
      },
    };

    const emailSent = SES.sendEmail(params).promise();
    emailSent
      .then((data) => {
        console.log(data);
        res.json({ ok: true });
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
};

// Reset Password

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    // console.table({ email, code, newPassword });
    const hashedPassword = await hashPassword(newPassword);

    const user = User.findOneAndUpdate(
      {
        email,
        passwordResetCode: code,
      },
      {
        password: hashedPassword,
        passwordResetCode: "",
      }
    ).exec();
    /*
    const registeredUser = await User.findOne({ email }).exec();
    if (registeredUser.passwordResetCode.toString() === code) {
      const user = await User.findOneAndUpdate(
        { passwordResetCode: code },
        { password: hashedPassword, passwordResetCode: "" }
      ).exec();
    } else {
      return response.status(400).send("Code does not match.");
    }
    */
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(400).send("Error! Try again.");
  }
};