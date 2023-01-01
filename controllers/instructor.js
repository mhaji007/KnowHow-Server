import User from "../models/user";
import queryString from "query-string";
const stripe = require("stripe")(process.env.STRIPE_SECRET);

export const makeInstructor = async (req, res) => {
  try {
    // Find user from db
    console.log("req.auth._id from make instructor ========> " + req.auth._id);
    const user = await User.findById(req.auth._id).exec();
    // If user dont have stripe_account_id yet, then create new
    // Check to make sure if user has tried onboarding again,
    // but left the process before finishing onboarding (i.e., user
    // already has stripe_account_id)
    if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
      });
      console.log("ACCOUNT => ", account.id);
      user.stripe_account_id = account.id;
      user.save();
    }
    // Create account link based on account id (for frontend to complete onboarding)
    let accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: process.env.STRIPE_REDIRECT_URL,
      return_url: process.env.STRIPE_REDIRECT_URL,
      type: "account_onboarding",
    });
    console.log(accountLink);
    // Pre-fill any info such as email (optional), then send url resposne to frontend
    accountLink = Object.assign(accountLink, {
      "stripe_user[email]": user.email,
    });
    // Then send the account link as response to frontend
    res.send(`${accountLink.url}?${queryString.stringify(accountLink)}`);
  } catch (err) {
    console.log("Make instructor error ", err);
  }
};

export const getAccountStatus = async (req, res) => {
  try {
    const user = await User.findById(req.auth._id).exec();
    // Find the account from Stripe to get the updated account information
    const account = await stripe.accounts.retrieve(user.stripe_account_id);
    console.log("ACCOUNT => ", account);
    // Check if the charges have been enabled (they have completed the onboarding process)
    if (!account.charges_enabled) {
      return res.staus(401).send("Unauthorized");
    } else {
      // Take the updated information and save it in the database
      const statusUpdated = await User.findByIdAndUpdate(
        user._id,
        {
          stripe_seller: account,
          // Add instructor role to user roles array
          // $addtoSet makes sure there is no duplicates
          // Otherwise we could use $set or $push methods
          $addToSet: { role: "Instructor" },
        },
        // Makes sure information has been updated
        { new: true }
      )
        .select("-password")
        .exec();
      res.json(statusUpdated);
    }
  } catch (err) {
    console.log(err);
  }
};

export const currentInstructor = async (req, res) => {
  try {
    let user = await User.findById(req.auth._id).select("-password").exec();
    if (!user.role.includes("Instructor")) {
      return res.status(403);
    } else {
      res.json({ ok: true });
    }
  } catch (err) {
    console.log(err);
  }
};
