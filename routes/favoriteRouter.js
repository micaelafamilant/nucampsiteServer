const express = require("express");
const cors = require("./cors");
const authenticate = require("../authenticate");
const Favorite = require("../models/favorite");

const favoriteRouter = express.Router();

// Set up CORS for /favorites and /favorites/:campsiteId routes
favoriteRouter.options("/", cors.corsWithOptions, (req, res) =>
  res.status(200).end()
);
favoriteRouter.options("/:campsiteId", cors.corsWithOptions, (req, res) =>
  res.status(200).end()
);

// Handle GET request for /favorites
favoriteRouter
  .route("/")
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
      .populate("user campsites")
      .then((favorites) => {
        res.status(200).json(favorites);
      })
      .catch((err) => next(err));
  })

  // Handle POST request for /favorites
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          // Check if campsites already exist in the array
          req.body.forEach((campsite) => {
            if (!favorite.campsites.includes(campsite._id)) {
              favorite.campsites.push(campsite._id);
            }
          });
          favorite
            .save()
            .then((favorite) => {
              res.status(200).json(favorite);
            })
            .catch((err) => next(err));
        } else {
          // Create a new favorite document if none exists
          Favorite.create({
            user: req.user._id,
            campsites: req.body.map((campsite) => campsite._id),
          })
            .then((favorite) => {
              res.status(200).json(favorite);
            })
            .catch((err) => next(err));
        }
      })
      .catch((err) => next(err));
  })

  // Handle DELETE request for /favorites
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          res.status(200).json(favorite);
        } else {
          res
            .status(200)
            .contentType("text/plain")
            .end("You do not have any favorites to delete.");
        }
      })
      .catch((err) => next(err));
  });

// Handle POST request for /favorites/:campsiteId
favoriteRouter
  .route("/:campsiteId")
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          // Check if the campsite already exists
          if (!favorite.campsites.includes(req.params.campsiteId)) {
            favorite.campsites.push(req.params.campsiteId);
            favorite
              .save()
              .then((favorite) => {
                res.status(200).json(favorite);
              })
              .catch((err) => next(err));
          } else {
            res
              .status(200)
              .json({
                message: "That campsite is already in the list of favorites!",
              });
          }
        } else {
          // Create new favorite document if none exists
          Favorite.create({
            user: req.user._id,
            campsites: [req.params.campsiteId],
          })
            .then((favorite) => {
              res.status(200).json(favorite);
            })
            .catch((err) => next(err));
        }
      })
      .catch((err) => next(err));
  })

  // Handle DELETE request for /favorites/:campsiteId
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          const campsiteIndex = favorite.campsites.indexOf(
            req.params.campsiteId
          );
          if (campsiteIndex > -1) {
            favorite.campsites.splice(campsiteIndex, 1);
            favorite
              .save()
              .then((favorite) => {
                res.status(200).json(favorite);
              })
              .catch((err) => next(err));
          } else {
            res
              .status(200)
              .contentType("text/plain")
              .end("Campsite not found in favorites.");
          }
        } else {
          res
            .status(200)
            .contentType("text/plain")
            .end("You do not have any favorites to delete.");
        }
      })
      .catch((err) => next(err));
  });

// Unsupported routes: GET and PUT for /favorites and /favorites/:campsiteId
favoriteRouter
  .route("/:campsiteId")
  .get((req, res) => {
    res
      .status(403)
      .json({
        message: "GET operation is not supported on /favorites/:campsiteId",
      });
  })
  .put((req, res) => {
    res
      .status(403)
      .json({
        message: "PUT operation is not supported on /favorites/:campsiteId",
      });
  });

favoriteRouter.route("/").put((req, res) => {
  res
    .status(403)
    .json({ message: "PUT operation is not supported on /favorites" });
});

module.exports = favoriteRouter;
