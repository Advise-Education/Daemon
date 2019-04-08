// Local Auth System using Mongodb

var path = require('path');
const config = require( path.resolve( __dirname, "./config.json" ) );
var jwt        = require("jsonwebtoken");
var express = require('express');
var router = express.Router();


router.get('/login', (req, res) => {
    const user = {
        id: 1,
        username: "johndoe",
        email: "john.doe@test.com"
    }
    jwt.sign({user},'SuperSecRetKey', { expiresIn: 60 * 60 }, (err, token) => {
        res.json({token});
    });
});
module.exports = router;