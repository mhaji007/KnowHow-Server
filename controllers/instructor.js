import User from "../models/user";
import stripe from "stripe";
import queryString from "query-string";

export const makeInstructor = async (req, res) => {
  try {
    // Find user from db
    const user = await User.findById(req.auth._id).exec();
    // If user dont have stripe_account_id yet, then create new
    // Check to make sure if user has tried onboarding again, 
    // but left the process before finishing onboarding (i.e., user
    // already has stripe_account_id)
    if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({ type: "express", email:user.email });
      console.log('ACCOUNT => ', account.id)
      user.stripe_account_id = account.id;
      user.save();
    }
    // Create account link based on account id (for frontend to complete onboarding)
    const accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: process.env.STRIPE_REDIRECT_URL,
      return_url: process.env.STRIPE_REDIRECT_URL,
      type: "account_onboarding",
    });
      console.log(accountLink)
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
