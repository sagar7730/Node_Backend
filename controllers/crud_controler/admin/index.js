const admin_model = require("../../../model/admin");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const FAQ = require("../../../model/FAQ");
const User = require("../../../model/user");
const transactiondata = require("../../../model/transactions");
const MarketStatus = require('../../../model/marketFreeze');
const Player = require("../../../model/player");
const JWT_SECRET = "admin_token";
const Text =require('../../../model/banner')


exports.signup = async (req, res) => {
  try {
    let { name, surname, email, password } = req.body;
    if (!name || !surname || !email || !password) {
      throw new Error("Enter your detail");
    }
    let uniqe_email = await admin_model.findOne({ email: email });
    if (uniqe_email) throw new Error("Email is alredy exits");
    let result = await admin_model.create({
      name: name,
      surname: surname,
      email: email,
      password: password,
    });
    return res.status(201).json({
      status: true,
      message: "succces",
      admin: {
        id: result._id,
        name: result.name,
        surname: result.surname,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: true,
      message: error.message,
    });
  }
};
// exports.login = async (req, res) => {
//   try {
//     let { email, password } = req.body;
//     if (!email || !password) {
//       throw new Error("Enter your detail");
//     }
//     let valid_email = await admin_model.findOne({ email: email });
//     if (!valid_email) {
//       throw new Error("Your Email is Not Found!");
//     }

//     let valid_password = await bcrypt.compare(password, valid_email.password);
//     if (!valid_password) {
//       throw new Error("password do not match!");
//     }
//     var token = await jwt.sign({ _id: valid_email._id }, JWT_SECRET);
//     console.log(token);

//     return res.status(200).json({
//       status: true,
//       message: "you are logdin",
//       token,
//     });
//   } catch (error) {
//     console.log(error.message);

//     return res.status(500).json({
//       status: true,
//       message: error.message,
//     });
//   }
// };

// exports.admin_auth = async (req, res, next) => {
//   try {
//     const token = req.headers.admin_token;
//     if (!token) {
//       return res.status(401).json({ error: "requirea a token" });
//     }
//     // console.log(token)

//     let valid_token = await jwt.verify(token, "rushabh");
//     if (!valid_token) {
//       throw new Error("require valid token ");
//     }

//     let admin = await admin_model.findOne({ _id: valid_token._id });
//     if (!admin) {
//       throw new Error("Admin not found");
//     }
//     req.admin = admin;
//     console.log("admin name===>" + req.admin.name);
//     next();
//   } catch (error) {
//     console.log(error.message);
//     return res.status(500).json({
//       status: false,
//       message: error.message,
//     });
//   }
// };


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new Error("Please enter your details.");
    }

    // Check if the email exists in the database
    const user = await admin_model.findOne({ email: email ,password: password });
    if (!user) {
      throw new Error("Your email is not found!");
    }

    // Compare the plaintext password directly
    if (user.password !== password) {
      throw new Error("Password does not match!");
    }

    // Generate a token
    const token = await jwt.sign({ _id: user._id }, JWT_SECRET);
    console.log(token);

    // Send the response
    return res.status(200).json({
      status: true,
      message: "You are logged in",
      token,
    });
  } catch (error) {
    console.error(error.message);

    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};


exports.admin_auth = async (req, res, next) => {
  const authHeader = req.headers['authorization']; // Extract the Authorization header

  if (!authHeader) {
    return res.status(401).json({ status: false, message: "Authorization header is missing" });
  }

  const tokenParts = authHeader.split(' '); // Split the token to check "Bearer <token>"
  
  if (tokenParts[0] !== 'Bearer' || tokenParts.length !== 2) {
    return res.status(401).json({ status: false, message: "Authorization header must be in the format: Bearer <token>" });
  }

  const token = tokenParts[1]; // Extract the token part

  try {
    const valid_token = jwt.verify(token, JWT_SECRET); // Verify token with the secret "rushabh"
    
    const admin = await admin_model.findOne({ _id: valid_token._id }); // Find admin using token's _id
    
    if (!admin) {
      return res.status(404).json({ status: false, message: "Admin not found" });
    }

    req.admin = admin; // Attach admin to the request object for further processing
    next(); // Proceed to the next middleware
  } catch (error) {
    console.error("Auth error:", error.message); // Log error for debugging

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ status: false, message: "Token has expired" });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ status: false, message: "Invalid token format or signature" });
    } else {
      return res.status(500).json({ status: false, message: "Internal Server Error" });
    }
  }
};


exports.userupdated_player =async (req, res) => {
  const { userId } = req.params;
  const { players } = req.body; // Expecting an array of { playerId, share_quantity, remove }

  // Validate the incoming data
  if (!Array.isArray(players)) {
    return res.status(400).json({
      status: false,
      message:
        "players should be an array of objects with playerId, share_quantity, and remove",
    });
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Iterate through players and perform update/remove operations
    players.forEach(({ playerId, share_quantity, remove }) => {
      const playerIndex = user.team.players.findIndex(
        (p) => p._id.toString() === playerId
      );

      // If player exists in the team
      if (playerIndex !== -1) {
        if (remove) {
          // Remove player from the team
          user.team.players.splice(playerIndex, 1);
        } else if (share_quantity !== undefined) {
          // Update player's share quantity
          user.team.players[playerIndex].share_quantity = share_quantity;
        }
      }
    });

    // Save the updated user object
    await user.save();

    return res.json({
      status: true,
      message: "Team players updated successfully",
      team: user.team,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}


exports.userUpdate_team_players =async (req, res) => {
  const { userId } = req.params;
  const { players } = req.body; // Expecting an array of { playerId, share_quantity, remove }

  // Validate the incoming data
  if (!Array.isArray(players)) {
    return res.status(400).json({
      status: false,
      message:
        "players should be an array of objects with playerId, share_quantity, and remove",
    });
  }

  try {
    // Find the user by ID
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Iterate through players and perform update/remove operations
    players.forEach(({ playerId, share_quantity, remove }) => {
      const playerIndex = user.team.players.findIndex(
        (p) => p._id.toString() === playerId
      );

      // If player exists in the team
      if (playerIndex !== -1) {
        if (remove) {
          // Remove player from the team
          user.team.players.splice(playerIndex, 1);
        } else if (share_quantity !== undefined) {
          // Update player's share quantity
          user.team.players[playerIndex].share_quantity = share_quantity;
        }
      }
    });

    // Save the updated user object
    await user.save();

    return res.json({
      status: true,
      message: "Team players updated successfully",
      team: user.team,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}


exports.updateTeam=async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from URL params
    const { addPlayers, removePlayers } = req.body;

    // Validate request data
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }
    if (!addPlayers && !removePlayers) {
      return res.status(400).json({
        error: "Either addPlayers or removePlayers must be provided.",
      });
    }

    // Fetch the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Handle removing players (only if removePlayers array is provided)
    if (removePlayers && removePlayers.length > 0) {
      removePlayers.forEach((playerId) => {
        user.team.players = user.team.players.filter(
          (player) => !player._id.equals(playerId)
        );
      });
    }

    // Handle adding/updating players (only if addPlayers array is provided)
    if (addPlayers && addPlayers.length > 0) {
      for (const { playerId, share_quantity } of addPlayers) {
        // Fetch the player from the Player database
        const playerData = await Player.findById(playerId);
        if (!playerData) {
          return res
            .status(404)
            .json({ error: `Player with ID ${playerId} not found.` });
        }

        // Check if the player already exists in the user's team
        const existingPlayerIndex = user.team.players.findIndex((player) =>
          player._id.equals(playerId)
        );

        if (existingPlayerIndex !== -1) {
          // If the player already exists, update the share quantity
          user.team.players[existingPlayerIndex].share_quantity =
            share_quantity;
        } else {
          // If the player does not exist, add the player to the team
          user.team.players.push({
            _id: playerData._id,
            name: playerData.name,
            profile_image: playerData.profile_image,
            value: playerData.value,
            share_quantity: share_quantity || 1, // Default to 1 if not provided
          });
        }
      }
    }

    // Save the updated user data
    await user.save();

    res.status(200).json({ message: "Team updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
}


exports.playerList=async(req, res)=> {
  try {
    // Fetch players from the database and sort them by the createdAt field (newest first)
    const players = await Player.find().sort({ createdAt: -1 });

    // Get the total count of players
    const playerCount = await Player.countDocuments();

    // Send response with the sorted players and total count
    res.status(200).json({
      success: true,
      count: playerCount,
      data: players,
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch players",
    });
  }
}

exports.playerCreate =async (req, res) => {
  try {
    // Extracting data from request body
    let { name, value } = req.body;

    // Check if the player already exists by name
    let existingPlayer = await Player.findOne({ name });
    if (existingPlayer) {
      return res.status(400).send({ message: "Player already exists" });
    }

    // Handle profile_image from the uploaded files
    let profile_image;
    if (req?.files) {
      req.files.map((file) => {
        if (file.fieldname === "profile_image") {
          profile_image = file.filename;
        }
      });
    }

    // Construct value_data array with a single object containing the value and createdAt
    const value_data = [
      {
        value: Number(value), // Ensure that value is a number
        createdAt: new Date(), // Automatically generate the timestamp
      },
    ];

    // Create a new player
    let playerdata = await Player.create({
      name,
      value: Number(value), // Ensure value is stored as a number
      value_data, // Pass value_data array as part of the player data
      profile_image,
    });

    // Respond with the created player data
    res.status(201).send(playerdata);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Error creating player", error: error.message });
  }
}

exports.faqCreate =async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res
      .status(400)
      .json({ message: "Both question and answer are required." });
  }

  try {
    const newFAQ = new FAQ({ question, answer });
    await newFAQ.save();
    res.status(201).json({ message: "FAQ created successfully", faq: newFAQ });
  } catch (error) {
    res.status(500).json({ message: "Error creating FAQ", error });
  }
}

exports.faqUpdate =async (req, res) => {
  const { id } = req.params;
  const { question, answer } = req.body;

  if (!question && !answer) {
    return res.status(400).json({
      message: "At least one field (question or answer) must be provided.",
    });
  }

  try {
    const updatedFAQ = await FAQ.findByIdAndUpdate(
      id,
      { $set: { ...(question && { question }), ...(answer && { answer }) } }, // Update only provided fields
      { new: true, runValidators: true } // Return the updated document and run validation
    );

    if (!updatedFAQ) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    res
      .status(200)
      .json({ message: "FAQ updated successfully", faq: updatedFAQ });
  } catch (error) {
    res.status(500).json({ message: "Error updating FAQ", error });
  }
}



exports.faqDelete =async (req, res) => {
  const { id } = req.params;

  try {
    const deletedFAQ = await FAQ.findByIdAndDelete(id);

    if (!deletedFAQ) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    res
      .status(200)
      .json({ message: "FAQ deleted successfully", faq: deletedFAQ });
  } catch (error) {
    res.status(500).json({ message: "Error deleting FAQ", error });
  }
}

exports.faqList =async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.status(200).json(faqs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching FAQs", error });
  }
}

exports.userTransation =async (req, res) => {
  try {
    // Fetch all transactions from the database
    const transactions = await transactiondata.find({});

    // Check if transactions exist
    if (!transactions.length) {
      return res.status(404).json({
        status: false,
        message: "No transactions found",
      });
    }

    // Return the transactions data
    res.status(200).json({
      status: true,
      message: "Transactions retrieved successfully",
      transactions: transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      status: false,
      message: "Error retrieving transactions",
      error: error.message,
    });
  }
}

exports.userTeamList =async (req, res) => {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;

    // Fetch user by ID, including the team details
    let user = await User.findById(userId).populate('team'); // Assuming you have a reference to the team in the User model
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

    // Check if the user has a team
    if (!user.team) {
      return res.status(404).json({ status: 404, message: "User has no team" });
    }

    // Return the user's team details
    res.status(200).json({
      status: true,
      message: "Team details retrieved successfully",
      team: user.team // Return the team details
    });
  } catch (error) {
    console.error("Error fetching team details:", error);
    res.status(500).json({
      status: false,
      message: "Error retrieving team details",
      error: error.message,
    });
  }
}

exports.updatePlayer =async (req, res) => {
  try {
    // Extracting data from request body
    let { name, value } = req.body;
    let player_id = req.params.id;

    // Convert the value to a number, and check if it's a valid number
    value = Number(value);
    if (isNaN(value)) {
      return res
        .status(400)
        .send({ message: "Invalid value. Must be a number." });
    }

    // Handle profile_image from the uploaded files
    let profile_image;
    if (req?.files) {
      req.files.forEach((file) => {
        if (file.fieldname === "profile_image") {
          profile_image = file.filename;
        }
      });
    }

    // Find the player by ID
    let player = await Player.findById(player_id);
    if (!player) {
      return res.status(404).send({ message: "Player not found" });
    }

    // Initialize value_data if it doesn't exist
    if (!player.value_data) {
      player.value_data = [];
    }

    // Append the new value to the value_data array with a timestamp
    player.value_data.push({
      value: value, // Make sure the value is a number
      createdAt: new Date(),
    });

    // Update the player's name, value, and profile_image, but keep value_data unchanged except the new value added
    player.name = name || player.name; // Only update if a new name is provided
    player.value = value; // Update the current value
    if (profile_image) {
      player.profile_image = profile_image; // Update profile_image if provided
    }

    // Save the updated player document
    await player.save();

    // Respond with the updated player data
    res.status(200).send(player);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Error updating player", error: error.message });
  }
}

exports.deletePlayer = async (req, res) => {
  try {
    let player_id = req.params.id;

    // Find the player by ID and delete it
    const deletedPlayer = await Player.findByIdAndDelete(player_id);

    // If player not found, return 404
    if (!deletedPlayer) {
      return res.status(404).send({ message: "Player not found" });
    }

    // Respond with a success message
    res
      .status(200)
      .send({ message: "Player deleted successfully", deletedPlayer });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Error deleting player", error: error.message });
  }
}


exports.userList =async(req,res)=>{
  try {
    const userDetails = await User.find();
    console.log(userDetails);
    res
      .status(200)
      .send({ message: "User List Sucessfully Getting", userDetails });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Error deleting player", error: error.message });
  }
}


exports.market_freeze = async (req, res) => {
  const { freeze } = req.body; // { freeze: true } or { freeze: false }

  if (typeof freeze !== 'boolean') {
    return res.status(400).json({ message: "Invalid value. 'freeze' must be true or false." });
  }

  try {
    // Find the market status entry (assuming only one document exists)
    let marketStatus = await MarketStatus.findOne();

    if (!marketStatus) {
      // If no status exists, create a new one
      marketStatus = new MarketStatus({ freeze });
    } else {
      // Update the existing status
      marketStatus.freeze = freeze;
      marketStatus.updatedAt = Date.now(); // Update the timestamp
    }

    // Save the updated market status
    await marketStatus.save();

    const statusMessage = freeze ? "Market is now frozen" : "Market is now unfrozen";
    res.json({ message: statusMessage });
  } catch (error) {
    console.error("Error setting market freeze state:", error);
    res.status(500).json({ message: "Failed to set market freeze state." });
  }
}


exports.userDeleted = async (req,res)=>{
  try {
    let user_id = req.params.id;

    // Find the player by ID and delete it
    const deletedPlayer = await User.findByIdAndDelete(user_id);

    // If player not found, return 404
    if (!deletedPlayer) {
      return res.status(404).send({ message: "Player not found" });
    }

    // Respond with a success message
    res
      .status(200)
      .send({ message: "Player deleted successfully", deletedPlayer });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Error deleting player", error: error.message });
  }
}

exports.bannertext = async(req,res)=>{
  const { text } = req.body;

  if (!text) {
    return res
      .status(400)
      .json({ message: "Both Text are required." });
  }

  try {
    const newText = new Text({ text});
    await newText.save();
    res.status(201).json({ message: "bannertext created successfully", newText });
  } catch (error) {
    res.status(500).json({ message: "Error creating bannertext", error });
  }
}

exports.bannerupdate = async(req,res)=>{
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      message: "At least one field (question or answer) must be provided.",
    });
  }

  try {
    const updatedText = await Text.findByIdAndUpdate(
      id,
      { $set: { ...(text && { text }) } }, // Update only provided fields
      { new: true, runValidators: true } // Return the updated document and run validation
    );

    if (!updatedText) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    res
      .status(200)
      .json({ message: "FAQ updated successfully", updatedText });
  } catch (error) {
    res.status(500).json({ message: "Error updating FAQ", error });
  }
}

exports.textdisplay = async(req,res)=>{
  try {
    const text = await Text.find();
    res.status(200).json(text);
  } catch (error) {
    res.status(500).json({ message: "Error fetching FAQs", error });
  }
}