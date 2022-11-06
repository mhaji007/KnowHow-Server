// Houses auth related utility functions

import bcrypt from "bcrypt";

export const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve(hash);
      });
    });
  });
};

// password: plain password from frontend
// hashedPassword: hashed password queried from database before user is logged in
export const comparePassword = (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
