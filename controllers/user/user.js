const User = require("../../model/user");
// const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "user_token";
const sendMail   = require('../../helper/mail_sender');

// exports.chnage_password = async (req, res, next) => {
//   try {

//     let { password, new_password, confirm_password } = req.body
//     if (!password || !new_password || !confirm_password) {
//       throw new Error('enter your details')
//     }
//     if (new_password !== confirm_password) {
//       throw new Error('your new password and confirm password are diffrent!')
//     }
//     const current_password = await bcrypt.compare(password, req.user.password);
//     if (!current_password) {
//       throw new Error('your current password is wrong')
//     }

//     new_password = await bcrypt.hash(new_password, 8)
//     let result = await User.findByIdAndUpdate({ _id: req.user._id }, {
//       password: new_password
//     }, { new: true })
//     return res.status(200).json({
//       status: true,
//       message: "Your password has been successfully changed",
//       result
//     })
//   } catch (error) {
//     console.log(error.message)
//     return res.status(500).json({
//       status: false,
//       message: error.message
//     });
//   }
// }



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ status: 400, message: "Email and password are required" });
    }

    // Fetch user by email
    let user = await User.findOne({ email: email,password: password });
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    console.log(user);

    // Check if the user has a valid password stored
    if (!user.password || typeof user.password !== 'string') {
      return res.status(500).json({ status: 500, message: "User password is invalid" });
    }

    // Log user's login details if the login is successful
    await User.findByIdAndUpdate(user._id, {
      $push: {
        login_detail: {
          ip_address: req.user_ip || req.ip, // Fallback to req.ip if req.user_ip is undefined
          time: Date.now(),
        },
      },
    });

    // Generate token (commented out for now, can be re-enabled as needed)
 
    const authToken = await jwt.sign(
      {  _id: user._id },
      JWT_SECRET
    );

    return res.status(200).json({
      status: true,
      message: "Login successfully",
      token: authToken, // Commented out until token logic is needed again
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}

// exports.user_auth = async (req, res, next) => {
//   try {
//     const token = req.headers.user_token;
//     console.log("t ===>", req.headers.user_token);

//     if (!token) {
//       return res.status(401).json({
//         status: false,
//         message: "require a user token",
//       });
//     }
//     const valid_token = jwt.verify(token, JWT_SECRET);
//     if (!valid_token) throw new Error("Please authenticate a valid token");
//     let user = await User.findOne({ _id: valid_token._id });
//     if (!user) {
//       throw new Error("user not found");
//     }
//     console.log("user name ===>", user.name);
//     req.user = user;
//     next();
//   } catch (error) {
//     console.log(error.message);
//     return res.status(500).json({
//       status: false,
//       message: error.message,
//     });
//   }
// };


// exports.user_auth = async (req, res, next) => {
//   try {
//     const authHeader = req.headers['user_token'];
    
//     if (!authHeader) {
//       return res.status(401).json({ status: false, message: "Authorization header is missing" });
//     }

//     const tokenParts = authHeader.split(' ');
//     if (tokenParts[0] !== 'Bearer' || tokenParts.length !== 2) {
//       return res.status(401).json({ status: false, message: "Authorization header must be in the format: Bearer <token>" });
//     }

//     const token = tokenParts[1];
//     console.log("Extracted Token:", token); // Log token for debugging

//     const valid_token = jwt.verify(token, JWT_SECRET); // Verify the token
//     console.log(valid_token,"token====");
    

//     const user = await User.findOne({ _id: valid_token._id });
//     if (!user) {
//       return res.status(404).json({ status: false, message: "User not found" });
//     }

//     req.user = user; // Attach user to request
//     next(); // Proceed to next middleware
//   } catch (error) {
//     console.error("Auth error:", error.message); // Log the error
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ status: false, message: "Token has expired" });
//     } else if (error.name === 'JsonWebTokenError') {
//       return res.status(400).json({ status: false, message: "Invalid token format or signature" });
//     } else {
//       return res.status(500).json({ status: false, message: "Internal Server Error" });
//     }
//   }
// };


  exports.user_auth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ status: false, message: "Authorization header is missing" });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts[0] !== 'Bearer' || tokenParts.length !== 2) {
      return res.status(401).json({ status: false, message: "Authorization header must be in the format: Bearer <token>" });
    }

    const token = tokenParts[1];

    try {
      const valid_token = jwt.verify(token, JWT_SECRET);
      const user = await User.findOne({ _id: valid_token._id });

      if (!user) {
        return res.status(404).json({ status: false, message: "User not found" });
      }

      req.user = user; // Attach user to request
      next(); // Proceed to the next middleware
    } catch (error) {
      console.error("Auth error:", error.message);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ status: false, message: "Token has expired" });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({ status: false, message: "Invalid token format or signature" });
      } else {
        return res.status(500).json({ status: false, message: "Internal Server Error" });
      }
    }
  };


// exports.registerUser = async(req, res, next) => {
//   try {
//     let { name, email, password } = req.body;

//     // Check if user already exists
//     let user = await User.findOne({ email });
//     if (user) {
//       return res.status(409).json({
//         status: 409,
//         message: "Email already exists",
//       });
//     }

//     // Hash password before storing it
//     password = await bcrypt.hash(password, 12);

//     // Handle profile_image from the uploaded files
//     let profile_image = "default_profile.png"; // Default profile image
//     if (req?.files) {
//       req.files.map((file) => {
//         if (file.fieldname === "profile_image") {
//           profile_image = file.filename;
//         }
//       });
//     }

//     // Create the user in the database
//     let userData = await User.create({
//       name,
//       email,
//       password,
//       profile_image,
//     });

//     // Construct the full user name response
//     let user_full_name = `${userData.name} User Created`;

//     // Respond with success and the created user's data
//     return res.status(201).json({
//       status: true,
//       message: "User created successfully",
//       userData,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       status: false,
//       message: error.message,
//     });
//   }
// }

exports.registerUser = async (req, res, next) => {
  try {
    let { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({
        status: 409,
        message: "Email already exists",
      });
    }

    // Handle profile_image from the uploaded files
    let profile_image = "default_profile.png"; // Default profile image
    if (req?.files) {
      req.files.map((file) => {
        if (file.fieldname === "profile_image") {
          profile_image = file.filename;
        }
      });
    }

    // Create the user in the database with the password in plain text
    let userData = await User.create({
      name,
      email,
      password, // Save password directly without hashing
      profile_image,
    });

    // Construct the full user name response
    let user_full_name = `${userData.name} User Created`;

    // Respond with success and the created user's data
    return res.status(201).json({
      status: true,
      message: "User created successfully",
      userData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};


// exports.ForgotPassword = async (req, res, next) => {
//   try {
//     const { email, newPassword, confirmPassword, OTP } = req.body;

//     // Check if all fields are provided
//     if (!email || !newPassword || !confirmPassword || !OTP) {
//       return res.status(400).json({ message: 'Please provide email, newPassword, confirmPassword, and OTP.' });
//     }

//     // Check if both password fields match
//     if (newPassword !== confirmPassword) {
//       return res.status(400).json({ message: 'Passwords do not match.' });
//     }

//     // Find the user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     // Check if OTP matches and if it has not expired
//     if (user.OTP !== parseInt(OTP)) {
//       return res.status(400).json({ message: 'Invalid OTP.' });
//     }
//     if (user.resetPasswordExpire < Date.now()) {
//       return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
//     }

//     // Update the password directly without hashing
//     user.password = newPassword;

//     // Clear OTP and expiration after password reset
//     user.OTP = undefined;
//     user.resetPasswordExpire = undefined;

//     // Save the updated user document
//     await user.save();

//     res.json({ message: 'Password successfully updated.' });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error. Please try again later.' });
//   }
// };
// exports.ForgotPassword = async (req, res, next) => {
//   try {
//     const { email, newPassword, confirmPassword, OTP } = req.body;

//     // Check if all fields are provided
//     if (!email || !newPassword || !confirmPassword || !OTP) {
//       return res.status(400).json({ message: 'Please provide email, newPassword, confirmPassword, and OTP.' });
//     }

//     // Check if both password fields match
//     if (newPassword !== confirmPassword) {
//       return res.status(400).json({ message: 'Passwords do not match.' });
//     }

//     // Find the user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }

//     // Check if OTP matches and if it has not expired
//     if (user.OTP !== parseInt(OTP)) {
//       return res.status(400).json({ message: 'Invalid OTP.' });
//     }
//     if (user.resetPasswordExpire < Date.now()) {
//       return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
//     }

//     // Update the password directly without hashing
//     user.password = newPassword;

//     // Clear OTP and expiration after password reset
//     user.OTP = undefined;
//     user.resetPasswordExpire = undefined;

//     // Save the updated user document
//     await user.save();

//     res.json({ message: 'Password successfully updated.' });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error. Please try again later.' });
//   }
// };


exports.ForgotPassword = async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Check if all fields are provided
    if (!email || !newPassword || !confirmPassword ) {
      return res.status(400).json({ message: 'Please provide email, newPassword, confirmPassword.' });
    }

    // Check if both password fields match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Update the password directly without hashing
    user.password = newPassword;

    // Clear OTP and expiration after password reset
    user.OTP = undefined;
    user.resetPasswordExpire = undefined;

    // Save the updated user document
    await user.save();

    res.json({ message: 'Password successfully updated.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};


// exports.SendOtp = async (req, res) => {
//   try {
//     const { email } = req.body;

//     // Find the user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }
// console.log(email,"email");

//     // Generate a 6-digit OTP and set expiration (e.g., 10 minutes)
//     const otpDigit = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit random number
//     const otpExpire = Date.now() + 10 * 60 * 1000; // Set expiration for 10 minutes

//     // Save OTP and expiration time in user document
//     user.OTP = otpDigit;
//     user.resetPasswordExpire = otpExpire;
//     await user.save();

//     // Send OTP to user's email
//     const message = `Your password reset OTP is: ${otpDigit}. It will expire in 10 minutes.`;
//     const result = await sendMail(user.email, 'Password Reset OTP', message);

//     if (result.success) {
//       res.json({ message: 'OTP sent to your email address.' });
//     } else {
//       res.status(500).json({ message: result.message });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error. Please try again later.' });
//   }
// };

exports.SendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    console.log(email, "email");

    // Generate a 6-digit OTP and set expiration (10 minutes)
    const otpDigit = Math.floor(100000 + Math.random() * 900000);
    const otpExpire = Date.now() + 10 * 60 * 1000;

    // Save OTP and expiration in user document
    user.OTP = otpDigit;
    user.resetPasswordExpire = otpExpire;
    await user.save();

    // Email content with formatted message (matching structure from the image)
    const message = `Hello,\n\n\<br>` +
      `You have recently received instructions to enter a one-time authentication code in order to reset your Top Tennis account password. Your code is:\n\n<br>` +
      `[${otpDigit}]\n\n<br>` +
      `If you did not request this code, you should change or reset your Top Tennis password immediately. ` +
      `You may also wish to contact support@toptennis.uk to ensure your account is secure.\n\n<br>` +
      `Sincerely,\n\n<br>` +
      `The Top Tennis Team`;

    // Send email
    const result = await sendMail(user.email, 'Top Tennis - Password Reset OTP', message);

    if (result.success) {
      res.json({ message: 'OTP sent to your email address.' });
    } else {
      res.status(500).json({ message: result.message || 'Failed to send OTP. Please try again later.' });
    }
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

exports.otpVerified = async (req, res) => {
  try {
    const { OTP } = req.body;

    // Check if OTP is provided
    if (!OTP) {
      return res.status(400).json({ message: 'OTP is required.' });
    }

    // Find the user by OTP and check if it's still valid
    const user = await User.findOne({
      OTP,
      resetPasswordExpire: { $gt: Date.now() }, // Check if OTP is not expired
    });

    if (!user) {
      return res.status(404).json({ message: 'Invalid or expired OTP.' });
    }

    console.log(OTP, "verified for user:", user.email);

    // Clear OTP and expiration after successful verification
    user.OTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'OTP verified successfully.', success: true });
  } catch (error) {
    console.error('Error in OTP verification:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};
