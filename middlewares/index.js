/*
Protected route
A protected page that restrict only to logged in user
with valid token. In order to verify if token is valid, we
need to send a request to backend (browser will include token
in headers automatically). If authentication is successful,
the protected page is displayed to the user
*/

import { expressjwt } from "express-jwt";
// jwt-express will check for valid token in header
// if token is valid req.user is returned
// where we can access ._id via req.user._id
export const requireSignin = expressjwt({
    getToken: (req, res) => req.cookies.token,
    secret: process.env.JWT_SECRET,
    algorithms: ["HS256"],
    userProperty: "auth",
    });

// If using jwt.verify() instead of express-jwt, do not send Bearer token. Send only token
// import jwt from "jsonwebtoken"

// export const requireSignin = (req, res, next) => {
//   try {
//     var decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
//     req.auth = decoded;
//     next();
//   } catch (err) {
//     return res.status(401).json(err);
//   }
// };
