const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the Favorite Schema
const favoriteSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    campsites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Campsite", // Reference to the Campsite model
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Create the Favorite Model
const Favorite = mongoose.model("Favorite", favoriteSchema);

// Export the Model
module.exports = Favorite;
