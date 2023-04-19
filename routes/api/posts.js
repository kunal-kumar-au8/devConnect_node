const express = require("express");
const auth = require("../../midelware/auth");
const { check, validationResult } = require("express-validator");

const Post = require("../../models/Post");
const User = require("../../models/User");
const Profile = require("../../models/Profile");

const router = express.Router();

// @route  Get api/posts
// @desc   Get all posts
// @access Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.send(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route  Get api/posts/:id
// @desc   Get post by Id
// @access Private
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ msg: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route  Post api/posts
// @desc   add post
// @access Private
router.post(
  "/",
  auth,
  [check("text", "Text is required").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      const post = await newPost.save();
      res.send(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route  Delete api/posts
// @desc   delete post
// @access Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (post.user.toString() !== req.user.id) {
      res.status(401).send("User is not authorized");
    }

    if (!post) {
      res.status(404).json({ msg: "Post not found" });
    }

    await post.deleteOne();
    res.send({ msg: "Post Deleted" });
  } catch (err) {
    if (err.kind === "ObjectId") {
      res.status(404).json({ msg: "Post not found" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route  Post api/posts/post/like
// @desc   like
// @access Private
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).send({ msg: "Post already liked" });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.send(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route  Post api/posts/post/like
// @desc   unlike
// @access Private
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).send({ msg: "Post already liked" });
    }

    // Get Remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString)
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);

    await post.save();
    res.send(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route  Post api/posts/post/comment
// @desc   post comments
// @access Private
router.put(
  "/comment/:post_id",
  [check("text", "Text is required").not().isEmpty()],
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }

    try {
      const post = await Post.findById(req.params.post_id);
      const user = await User.findById(req.user.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };
      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route  Delete api/comment/:id
// @desc   delete post
// @access Private
router.delete("/comment/:id", auth, async (req, res) => {
  try {
    const post = await Post.findOne({ user: req.user.id });
    if (post.comments.user === req.user.id) {
      res.status(401).send({ msg: "User is not authorized" });
    }
    if (!post) {
      res.status(404).send({ msg: "comment not found" });
    }

    const removeIndex = post.comments
      .map((comment) => comment.id)
      .indexOf(req.params.id);
    post.comments.splice(removeIndex, 1);
    await post.save();

    res.send({ msg: "Comment removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
