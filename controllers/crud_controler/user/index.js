const User = require("../../../model/user");
const bcrypt = require("bcrypt");
const Player = require("../../../model/player");
const transactiondata = require("../../../model/transactions");
const FAQ = require("../../../model/FAQ");
const MarketStatus = require('../../../model/marketFreeze');
const { default: mongoose } = require("mongoose");
const player = require("../../../model/player");
const Text =require('../../../model/banner')

// User registration api

// async function userUpdated(req, res, next) {
//   try {
//     const userId = req.params.id;
//     let { name, email, password } = req.body;

//     // Fetch the user from the database
//     let user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         status: false,
//         message: "User not found",
//       });
//     }

//     // Handle profile_image update if provided
//     let profile_image = user.profile_image; // Keep the existing image by default
//     if (req?.files) {
//       req.files.map((file) => {
//         if (file.fieldname === "profile_image") {
//           profile_image = file.filename;
//         }
//       });
//     }

//     // Update fields only if they are provided in the request body
//     if (name) user.name = name;
//     if (email) user.email = email;
//     if (password) user.password = await bcrypt.hash(password, 12); // Hash password if provided
   
// console.log(password);

//     // Handle profile image update
//     user.profile_image = profile_image;

//     // Save updated user data in the database
//     let updatedUser = await user.save();

//     // Return success response with updated user data
//     return res.status(200).json({
//       status: true,
//       message: "User updated successfully",
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       status: false,
//       message: error.message,
//     });
//   }
// }

async function userUpdated(req, res, next) {
  try {
    const userId = req.params.id;
    let { name, email, password,credits } = req.body;

    // Fetch the user from the database
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Handle profile_image update if provided
    let profile_image = user.profile_image; // Keep the existing image by default
    if (req?.files) {
      req.files.map((file) => {
        if (file.fieldname === "profile_image") {
          profile_image = file.filename;
        }
      });
    }

    // Update fields only if they are provided in the request body
    if (name) user.name = name;
    if (email) user.email = email;
    if (credits) user.credits = credits;
    if (password) user.password = password; // Save password in plain text

    console.log(password);

    // Handle profile image update
    user.profile_image = profile_image;

    // Save updated user data in the database
    let updatedUser = await user.save();

    // Return success response with updated user data
    return res.status(200).json({
      status: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}

async function addTeam(req, res) {
  try {
    const userId = req.params.userId;
    const teamName = req.body.teamName;
    const profileImage =
      req.files && req.files.length > 0
        ? req.files[0].filename
        : "default_team.png";

    const playersData = JSON.parse(req.body.players);

    if (!Array.isArray(playersData)) {
      return res
        .status(400)
        .json({ message: "Invalid players data. It should be an array." });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Correct the check for an existing team
    if (user.team && user.team.players && user.team.players.length > 0) {
      return res.status(400).json({
        message: "Team already exists. You cannot create another team.",
      });
    }

    // Proceed with the team creation logic...
    const playerIds = playersData.map((player) => player.id);
    const playersFromDb = await Player.find({ _id: { $in: playerIds } });

    if (playersFromDb.length !== playerIds.length) {
      return res.status(404).json({ message: "One or more players not found" });
    }

    const playersToAdd = playersFromDb.map((player) => {
      const incomingPlayer = playersData.find(
        (p) => p.id === player._id.toString()
      );
      return {
        _id: player._id,
        name: player.name,
        profile_image: player.profile_image,
        value: player.value,
        share_quantity: incomingPlayer.share_quantity || 1,
        createdAt: new Date(),
      };
    });

    let totalCost = 0;
    let grandTotalCredits = 0;
    playersToAdd.forEach((player) => {
      const playerCost = player.value * player.share_quantity;
      totalCost += playerCost;
      grandTotalCredits += player.share_quantity;
    });

    if (user.credits < totalCost) {
      return res.status(400).json({
        message: "Insufficient credits to add these players.",
        requiredCredits: totalCost,
        availableCredits: user.credits,
      });
    }

    const openingCredits = user.credits;
    user.credits -= totalCost;
    const closingCredits = user.credits;

    if (playersToAdd.length > 8) {
      return res
        .status(400)
        .json({ message: "Cannot add more than 8 players to the team." });
    }

    const teamData = {
      name: teamName,
      profile_image: profileImage,
      players: playersToAdd,
    };

    user.team = teamData;

    await user.save();

    const transaction = new transactiondata({
      user_data: {
        user_id: user._id,
        name: user.name,
        email: user.email,
        profile_image: user.profile_image,
        credits: openingCredits,
      },
      players_data: playersToAdd.map((player) => ({
        player_id: player._id,
        name: player.name,
        profile_image: player.profile_image,
        value: player.value,
        share_quantity: player.share_quantity,
      })),
      opening_credits: openingCredits,
      closing_credits: closingCredits,
      total_credits: totalCost,
      grand_total_credits: grandTotalCredits,
    });

    await transaction.save();

    res.status(200).json({
      message: "Team created and players added successfully",
      teamData: user.team,
      remainingCredits: user.credits,
      transaction,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

async function playerList(req, res) {
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

async function addPlayer(req, res) {
  try {
    const { userId } = req.params; // Extract userId from URL params
    const { playerId, share_quantity } = req.body;

    // Validate request data
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }
    if (!playerId) {
      return res.status(400).json({ error: "Player ID is required." });
    }

    // Fetch the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Fetch the player from the Player database
    const playerData = await Player.findById(playerId);
    if (!playerData) {
      return res
        .status(404)
        .json({ error: `Player with ID ${playerId} not found.` });
    }

    // Calculate the total cost of adding the player (player's value * share quantity)
    const totalCost = playerData.value * (share_quantity || 1);

    // Check if the user has enough credit
    if (user.credits < totalCost) {
      return res
        .status(400)
        .json({ error: "Insufficient credits to add this player." });
    }

    // Check if the player already exists in the user's team
    const existingPlayerIndex = user.team.players.findIndex((player) =>
      player._id.equals(playerId)
    );

    if (existingPlayerIndex !== -1) {
      // If the player already exists, update the share quantity
      user.team.players[existingPlayerIndex].share_quantity =
        share_quantity || 1;
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

    // Deduct the total cost from the user's credits
    user.credits -= totalCost;

    // Save the updated user data
    await user.save();

    res
      .status(200)
      .json({
        message: "Player added to team successfully, credits deducted.",
        remainingCredits: user.credits,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
}

async function overrall(req, res) {
  try {
    // Retrieve user ID from request parameters
    const userId = req.params.id;

    // Retrieve the specific user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract player values from the user's team
    const playerValues = user.team && user.team.players 
      ? user.team.players.map(player => ({
          _id: player._id,
          share_quantity: player.share_quantity,
          value: player.value // Assuming user value is stored here
        })) 
      : [];

    // Log the retrieved player values for debugging
    console.log("Player Values:", playerValues);

    // Extract player IDs for querying the Player model
    const playerIds = playerValues.map(player => player._id);
    
    // Retrieve players from the database that match the extracted player IDs
    const playersFromDb = await Player.find({ _id: { $in: playerIds } });

    // Log the players retrieved from the database for debugging
    console.log("Players from DB:", playersFromDb);

    // Calculate value differences and store in a variable
    const valueDifferences = playerValues.map(playerValue => {
      const playerFromDb = playersFromDb.find(player => player._id.toString() === playerValue._id.toString());
      if (playerFromDb) {
        const value_difference =playerFromDb.value - playerValue.value ; // Calculate the difference
        const totalValue = value_difference * playerValue.share_quantity; // Multiply by share_quantity
        return {
          _id: playerValue._id,
          name: playerFromDb.name, // Include player name from the database
          share_quantity: playerValue.share_quantity,
          user_playerValue: playerValue.value,
          player_value: playerFromDb.value,
          value_difference,
          total_value: totalValue // Store the total value
        };
      }
      return null; // Handle missing players as needed
    }).filter(Boolean); // Filter out any null values if player not found

    // Log the value differences for debugging
    console.log("Value Differences:", valueDifferences);

    // Calculate the sum of total_values
    const totalValueSum = valueDifferences.reduce((sum, player) => sum + player.total_value, 0);
    
    // Send response back with the combined data
    res.status(200).send({ 
      message: "Player values retrieved successfully", 
      valueDifferences,
      grand_total_value: totalValueSum // This can be modified if you have additional criteria for grand total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
}


async function in_play_value(req, res) {
  try {
    const { id } = req.params; // Extract user_id from request params

    // Retrieve the specific user by ID
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract player values and user credits from the user's team
    const playerValues = user.team && user.team.players ? user.team.players.map(player => ({
      _id: player._id,
      share_quantity: player.share_quantity,
      value: player.value // Assuming user value is stored here
    })) : [];

    // Log the player data for debugging
    console.log("User Player Data:", playerValues);

    // Extract player IDs for querying the Player model
    const playerIds = playerValues.map(player => player._id);

    // Retrieve players from the database that match the extracted player IDs
    const playersFromDb = await Player.find({ _id: { $in: playerIds } });

    // Log the players retrieved from the database for debugging
    console.log("Players from DB:", playersFromDb);

    // Calculate value differences for each player
    const valueDifferences = playerValues.map(playerValue => {
      const playerFromDb = playersFromDb.find(player => player._id.toString() === playerValue._id.toString());
      if (playerFromDb) {
        const totalValue = playerFromDb.value * playerValue.share_quantity; // Multiply player's value from DB by share_quantity
        const valueDifference =playerFromDb.value - playerValue.value ; // Calculate the difference

        return {
          _id: playerValue._id,
          share_quantity: playerValue.share_quantity,
          user_playerValue: playerValue.value,
          player_value: playerFromDb.value,
          value_difference: valueDifference,
          total_value: totalValue // Store the total value
        };
      }
      return null; // or handle missing players as needed
    }).filter(Boolean); // Filter out any null values if player not found

    // Calculate the sum of player_value for this user
    const playerValueSum = valueDifferences.reduce((sum, player) => sum + player.player_value, 0);

    // Calculate the sum of total_values for this user
    const grandTotalValue = valueDifferences.reduce((sum, player) => sum + player.total_value, 0);

    // Log the user value differences for debugging
    console.log("User Value Differences:", valueDifferences);

    // Send response back with the combined data
    res.status(200).send({
      message: "Player values and user credits retrieved successfully",
      user_id: user._id,
      name: user.name,
      credits: user.credits || 0, // Assuming credits field exists in user schema
      valueDifferences,
      player_value_sum: playerValueSum, // Include the sum of player values
      grand_total_value: grandTotalValue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
}

async function userProfile(req, res) {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;

    // Fetch user by ID
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 404, message: "User not found" });
    }

   
    // Log user's access (optional: if you want to track profile access)
    await User.findByIdAndUpdate(user._id, {
      $push: {
        login_detail: {
          ip_address: req.user_ip || req.ip, // Use `req.ip` if `req.user_ip` is not available
          time: Date.now(),
        },
      },
    });

    // Return full user details
    return res.status(200).json({
      status: true,
      message: "User profile retrieved successfully",
      userDetails: {
        _id: user._id,
        name: user.name,
        email: user.email,
        password:user.password,
        profile_image: user.profile_image,
        credits: user.credits,
        user_status: user.user_status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        login_detail: user.login_detail, // Optional: You can limit login details
        team:user.team
        // Add any other fields from user schema
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}

async function faqList (req, res){
  try {
    const faqs = await FAQ.find();
    res.status(200).json(faqs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching FAQs", error });
  }
}

async function market_Status (req, res) {
  try {
    const marketStatus = await MarketStatus.findOne({});
    const isFrozen = marketStatus ? marketStatus.freeze : false;
    res.json({ isFrozen });
  } catch (error) {
    console.error("Error checking market status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}




async function selected_teamlist(req, res) {
  try {
    // Extract user ID from request parameters
    const userId = req.params.id;

    // Fetch user by ID, including the team details
    let user = await User.findById(userId).populate('team'); // Assuming you have a reference to the team in the User model
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Check if the user has a team
    if (!user.team || !user.team.players || user.team.players.length === 0) {
      return res.status(404).json({ status: false, message: "User has no team" });
    }

    // Fetch player values from the player database
    const players = await Player.find({ _id: { $in: user.team.players.map(player => player._id) } }); // Assuming team contains player IDs

    // Store value differences in an array
    const valueDifferences = [];

    // Loop through the user's team players
    for (const teamPlayer of user.team.players) {
      // Find the corresponding player in the players fetched
      const matchedPlayer = players.find(player => player._id.equals(teamPlayer._id));

      if (matchedPlayer) {
        // Calculate the value difference (assuming you have a value field in Player)
        const valueDifference = matchedPlayer.value - teamPlayer.value; // Adjust as necessary

        // Push player data along with value difference and share_quantity
        valueDifferences.push({
          player_id: teamPlayer._id,
          name: matchedPlayer.name, // Include player name
          profile_image: matchedPlayer.profile_image, // Include player image
          value: matchedPlayer.value, // Include current value of the player
          share_quantity: teamPlayer.share_quantity, // Include user's share quantity for the player
          valueDifference: valueDifference,
        });
      }
    }

    // Return the user's team details along with value differences
    res.status(200).json({
      status: true,
      message: "Team details retrieved successfully",
      team: user.team, // Return the team details
      valueDifferences, // Return the calculated value differences with player data
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


async function status_updated(req, res) {
    const { id } = req.params; // Get playerId from URL parameters
    
    try {
        // Find the player by ID (whether it's ObjectId or string)
        let player = await Player.findById(id);
        console.log(player);
        
        
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }

        // Toggle the 'selected' status
        player.selected = !player.selected;

        // Save the updated player
        await player.save();

        return res.status(200).json({
            message: `Player selection status updated to ${player.selected}`,
            player
        });
    } catch (error) {
        console.error('Error updating player status:', error); // Log the error for debugging
        return res.status(500).json({ message: 'Server error', error });
    }
}
async function userList(req,res){
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
// async function playerBuy(req, res) {
//   try {
//     const { userId } = req.params; // Extract userId from URL params
//     const { addPlayers } = req.body;

//     // Validate request data
//     if (!userId) {
//       return res.status(400).json({ error: "User ID is required." });
//     }

//     // Fetch the user from the database
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: "User not found." });
//     }

//     // Initialize an array for new players if it exists
//     let newPlayers = [];

//     // Handle adding/updating players (only if addPlayers array is provided)
//     if (addPlayers && addPlayers.length > 0) {
//       for (const { playerId, share_quantity } of addPlayers) {
//         // Fetch the player from the Player database
//         const playerData = await Player.findById(playerId);
//         if (!playerData) {
//           return res.status(404).json({ error: `Player with ID ${playerId} not found.` });
//         }

//         // Check if the player already exists in the user's team
//         const existingPlayerIndex = user.team.players.findIndex((player) =>
//           player._id.equals(playerId)
//         );

//         if (existingPlayerIndex !== -1) {
//           // Update existing player's share quantity
//           user.team.players[existingPlayerIndex].share_quantity = share_quantity; // Update share quantity
//         } else {
//           // If the player does not exist, check the team size limit
//           if (user.team.players.length >= 8) {
//             return res.status(400).json({
//               error: "Cannot add more than 8 players to the team.",
//             });
//           }

//           // If there's space in the team, add the player
//           newPlayers.push({
//             _id: playerData._id,
//             name: playerData.name,
//             profile_image: playerData.profile_image,
//             value: playerData.value,
//             share_quantity: share_quantity || 1, // Default to 1 if not provided
//           });
//         }
//       }
//     }

//     // Handle adding new players after updating existing ones
//     for (const newPlayer of newPlayers) {
//       const totalCost = newPlayer.value * newPlayer.share_quantity;

//       // Check if the user has enough credits
//       if (user.credits < totalCost) {
//         return res.status(400).json({
//           error: "Insufficient credits to add this player.",
//         });
//       }

//       // Add the player to the team
//       user.team.players.push(newPlayer);
//       // Subtract the total cost from the user's credits
//       user.credits -= totalCost;
//     }

//     // Save the updated user data
//     await user.save();

//     res.status(200).json({ message: "Team updated successfully." });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error." });
//   }
// }

async function playerBuy(req, res) {
  try {
    const { userId } = req.params; // Extract userId from URL params
    const { addPlayers } = req.body;

    // Validate request data
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    // Fetch the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Initialize an array for new players if it exists
    let newPlayers = [];
    let totalCost = 0; // Variable to track total cost for updating credits

    // Handle adding/updating players (only if addPlayers array is provided)
    if (addPlayers && addPlayers.length > 0) {
      for (const { playerId, share_quantity } of addPlayers) {
        // Fetch the player from the Player database
        const playerData = await Player.findById(playerId);
        if (!playerData) {
          return res.status(404).json({ error: `Player with ID ${playerId} not found.` });
        }

        // Check if the player already exists in the user's team
        const existingPlayerIndex = user.team.players.findIndex((player) =>
          player._id.equals(playerId)
        );

        if (existingPlayerIndex !== -1) {
          // Update existing player's share quantity
          const existingPlayer = user.team.players[existingPlayerIndex];
          const oldShareQuantity = existingPlayer.share_quantity;

          // Calculate cost difference
          totalCost += (share_quantity - oldShareQuantity) * playerData.value;

          // Update the share quantity
          existingPlayer.share_quantity = share_quantity;
        } else {
          // If the player does not exist, check the team size limit
          if (user.team.players.length >= 8) {
            return res.status(400).json({
              error: "Cannot add more than 8 players to the team.",
            });
          }

          // If there's space in the team, add the player
          newPlayers.push({
            _id: playerData._id,
            name: playerData.name,
            profile_image: playerData.profile_image,
            value: playerData.value,
            share_quantity: share_quantity || 1, // Default to 1 if not provided
          });

          // Update total cost for the new player
          totalCost += playerData.value * (share_quantity || 1); // Add cost for new player
        }
      }
    }

    // Check if the user has enough credits before updating
    if (user.credits < totalCost) {
      return res.status(400).json({
        error: "Insufficient credits to update players.",
      });
    }

    // Handle adding new players after updating existing ones
    for (const newPlayer of newPlayers) {
      // Add the player to the team
      user.team.players.push(newPlayer);
    }

    // Subtract the total cost from the user's credits
    user.credits -= totalCost;

    // Save the updated user data
    await user.save();

    res.status(200).json({ message: "Team updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
}







async function sellPlayer(req, res) {
  try {
    const { userId } = req.params; // Extract userId from URL params
    const { playerId, removePlayers, share_quantity } = req.body; // Destructure playerId, removePlayers, and share_quantity

    // Fetch the user from the database
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: "User not found.",
        details: `No user exists with the provided userId: ${userId}`,
      });
    }

    // Check if playerId or removePlayers array is provided
    if (!playerId && (!removePlayers || removePlayers.length === 0)) {
      return res.status(400).json({ error: "Player ID or removePlayers array is required." });
    }

    // Handle removing multiple players if removePlayers array is provided
    if (removePlayers && removePlayers.length > 0) {
      for (const removePlayerId of removePlayers) {
        // Find the player in the user's team
        const playerInTeam = user.team.players.find((player) =>
          player._id.equals(removePlayerId)
        );

        if (playerInTeam) {
          // Fetch the player from the Player database to get their value
          const playerData = await Player.findById(removePlayerId);
          if (!playerData) {
            return res.status(404).json({ error: `Player with ID ${removePlayerId} not found.` });
          }

          // Add the player’s total value (all shares) back to the user's credits
          const totalValue = playerInTeam.share_quantity * playerData.value;
          user.credits += totalValue; // Add value back to credits

          // Remove the player entirely since the operation is to remove the whole player
          user.team.players = user.team.players.filter(
            (player) => !player._id.equals(removePlayerId)
          );
        }
      }
    }

    // Handle selling part of a player's shares (and possibly removing the player if their shares drop to zero)
    if (playerId && typeof share_quantity === 'number') {
      // Find the player in the user's team
      const playerInTeam = user.team.players.find((player) =>
        player._id.equals(playerId)
      );

      if (playerInTeam) {
        // Fetch the player from the Player database to get their value
        const playerData = await Player.findById(playerId);
        if (!playerData) {
          return res.status(404).json({ error: `Player with ID ${playerId} not found.` });
        }

        // Check if the user has enough shares to sell
        if (playerInTeam.share_quantity >= share_quantity) {
          // Calculate the value of the shares being sold
          const totalValue = share_quantity * playerData.value;
          
          // Add the value of sold shares to user's credits
          user.credits += totalValue;

          // Reduce the player's share_quantity by the number of shares being sold
          playerInTeam.share_quantity -= share_quantity;

          // If share_quantity becomes 0, remove the player from the team
          if (playerInTeam.share_quantity === 0) {
            user.team.players = user.team.players.filter(
              (player) => !player._id.equals(playerId)
            );
          }
        } else {
          return res.status(400).json({ error: "Not enough shares to sell." });
        }
      } else {
        return res.status(404).json({ error: "Player not found in the team." });
      }
    }

    // Save the updated user data
    await user.save();

    // Respond with the updated credits and team information
    res.status(200).json({ 
      message: "Player(s) shares sold successfully.",
      updatedCredits: user.credits, // This will reflect the updated credits after the sale
      updatedTeam: user.team.players // This will reflect the updated player list and share_quantity
    });
  } catch (error) {
    console.error(error);

    // Enhanced error logging for internal server error
    res.status(500).json({
      error: "Internal server error.",
      message: error.message,
      stack: error.stack, // You can remove this in production to avoid leaking stack traces
    });
  }
}

async function textList(req,res) {
  try {
    const text = await Text.find();
    res.status(200).json(text);
  } catch (error) {
    res.status(500).json({ message: "Error fetching FAQs", error });
  }
}




module.exports = {
  userUpdated,
  addTeam,
  playerList,
  addPlayer,
  overrall,
  in_play_value,
  userProfile,
  faqList,
  market_Status,
  selected_teamlist,
  status_updated,
  playerBuy,
  sellPlayer,
  userList,
  textList

};
