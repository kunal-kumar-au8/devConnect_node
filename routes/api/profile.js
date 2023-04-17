const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const auth = require("../../midelware/auth");
const { check, validationResult } = require("express-validator");

// @route  Get api/profile/me
// @desc   get profile by token
// @access Public

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "profile"]
    );

    if (!profile) {
      res.status(400).json([{ msg: "There is no profile for this user" }]);
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error!");
  }
});

// @route  Post api/profile
// @desc   Get current profile
// @access Public

router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      skills,
      githubusername,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills)
      profileFields.skills = skills.split(",").map((skill) => skill.trim());

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = Profile.findOne({ user: req.user.id });

      if (profile) {
        // Update
        profile = await profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        res.send(profile);
      }
      //  Create
      profile = new Profile(profileFields);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   Post api/profile
// @desc    Get all profiles
// @access  Public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   Post api/profile/user/:user_id
// @desc    Get profiles by user_id
// @access  Public

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);
    if (!profile) return res.status(400).send([{ msg: "Profile not found" }]);
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).send([{ msg: "Profile not found" }]);
    }
    res.status(500).send("Server Error");
  }
});

// @route   Delete api/profile
// @desc    Delete profiles,user & posts
// @access  Private

router.delete("/", auth, async (req, res) => {
  try {
    // Remove Profie
    await Profile.findOneAndDelete({ user: req.user.id });
    // Remove User
    await User.findOneAndRemove({ _id: req.user.id });
    res.json([{ msg: "User deleted" }]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/profile/experience
// @desc    Add/Update profiles experience
// @access  Private
router.put(
  "/experience",
  auth,
  [
    check("title", "Title is required").not().isEmpty(),
    check("company", "Company is required").not().isEmpty(),
    check("from", "From date is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { title, company, location, from, to, current, description } =
        req.body;
      const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
      }
    try {
      const profile =await Profile.findOne({user:req.user.id});
      console.log("profile:",profile.experience)
      profile.experience.unshift(newExp);
      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
