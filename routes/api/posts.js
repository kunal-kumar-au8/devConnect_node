const express = require('express');
const router = express.Router();

// @route  Get api/post
// @desc   test route
// @access Public


router.get('/',(req,res)=> res.send('Posts route'));
 
module.exports = router;