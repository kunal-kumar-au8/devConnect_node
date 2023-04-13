const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const auth = require("../../midelware/auth");

// @route  Get api/profile/me
// @desc   test route
// @access Public

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "profile"]
    );

    if (!profile) {
      res.status(400).json([{ msg: "There is n profile for this user" }]);
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error!");
  }
});

module.exports = router;