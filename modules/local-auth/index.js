// Local Auth System using Mongodb

var path = require('path');
const config = require( path.resolve( __dirname, "./config.json" ) );
const global_config = require( path.resolve("./config.json" ) );
var jwt        = require("jsonwebtoken");
var express = require('express');
var router = express.Router();


router.get('/login', (req, res) => {
    const user = {
        id: 1,
        username: "johndoe",
        email: "john.doe@test.com"
    }
    jwt.sign({user}, global_config.token_secret, global_config.token_duration, (err, token) => {
        res.json({token});
    });
});
module.exports = router;