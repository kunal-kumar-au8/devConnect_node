const express = require("express");
const router = express.Router();
const auth = require("../../midelware/auth");
const User = require("../../models/User");

// @route  Get api/auth
// @desc   test route
// @access Public

router.get("/",auth, async (req, res) =>{
    try{
        const user = await User.findById(req.user.id).select('-password')
        res.send(user)
    }catch(err){
         console.error(err.message);
         res.status(500).send('Server Error!')
    }
});
module.exports = router;