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
      res.status(401).send("User is not Authorized");
    }

    if (!post) {
      res.status(404).json({ msg: "Post not found" });
    }

    await post.deleteOne();
    res.send({msg: 'Post Deleted'});
  } catch (err) {
    if (err.kind === "ObjectId") {
      res.status(404).json({ msg: "Post not found" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route  Post api/posts/post/like
// @desc   like & unlike
// @access Private
router.post('/like/:id',auth,async(req,res)=>{
  try {
    const post = Post.findById(req.params.id);

    // Check if the post has already been liked
    if(post.like.filter(like=>like.user.toString() === req.params.id).length > 0){
      return res.status(400).send({msg:'Post already liked'})
    }

    post.unshift({user:req.user.id});
    await post.save();
    res.send(post.like)

  } catch (err) { 
    console.error(err.message);
    res.status(500).send('Server Error')
  }
})

// @route  Post api/posts/post/comment
// @desc   post comments
// @access Private
router.put('/comment/:post_id',[
  check('text','Text is required').not().isEmpty(),
],auth,async(req,res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).send({errors:errors.array()});
  }

  const [text] = req.body;
  const newComment = {text};

  try {
    const post = await Post.findById(req.params.post_id);
    post.comments.unshift(newComment);
    await post.save();
    res.json(post);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error')
  }
})

module.exports = router;
