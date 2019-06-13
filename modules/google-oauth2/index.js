var path = require('path');
const config = require( path.resolve( __dirname, "./config.json" ) );
const global_config = require( path.resolve("./config.json" ) );
var jwt        = require("jsonwebtoken");
var express = require('express');
var router = express.Router();
const OAuth2Strategy = require('passport-oauth2');
const InternalOAuthError = require('passport-oauth2').InternalOAuthError;
const passport = require('passport');
const request = require('request');


router.use(passport.initialize());
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});
let client = new OAuth2Strategy({
    authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
    tokenURL: 'https://accounts.google.com/o/oauth2/token',
    clientID: config.OAuth.clientID,
    clientSecret: config.OAuth.clientSecret,
    callbackURL: '/module/google-oauth2/callback'
},
function(accessToken, refreshToken, profile, done) {
    done(null, {
        profile: profile,
        token: accessToken
    });
});
passport.use(client);

router.get('/callback',
    passport.authenticate('oauth2', {
        failureRedirect: '/',
}),
(req, res) => {
    request('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token='+req.user.token, { json: true }, (err, profile) => {
        if (err) { 
            res.json({error: "Failed to retrieve Google oauth2 data."});
        }
        else {
            if (global_config.domain.indexOf(profile.body.hd) >= 0) { //Check if logging in with proper domain name.
                jwt.sign({
                    data: profile.body
                }, global_config.token_secret, { expiresIn: global_config.token_duration}, (err, token) => {
                    if(err) {
                        console.log(err);
                        res.json(err);
                    }
                    else {
                        if (typeof token === 'undefined' || token === null) {
                            res.json({error: "Failed to generate token"}); //Token does not exist
                        }
                        else {
                            res.json(token); //Token exists, send response
                        }
                        
                    }
                });
            }
            else {
                res.json({error: "Invalid Account."});
            }
        }
            
            

            
            
    })
                
}); 

router.get('/login', passport.authenticate('oauth2', {
    scope: ['profile', 'email'], 
    accessType: 'offline', 
    prompt: 'select_account' 
    })
);
module.exports = router;