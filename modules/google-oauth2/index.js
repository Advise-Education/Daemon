var path = require('path');
const config = require( path.resolve( __dirname, "./config.json" ) );
const global_config = require( path.resolve("./config.json" ) );
var jwt        = require("jsonwebtoken");
var express = require('express');
var router = express.Router();
const OAuth2Strategy = require('passport-oauth2');
const InternalOAuthError = require('passport-oauth2').InternalOAuthError;
const passport = require('passport');

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
        verified_domain: false,
        profile: profile,
        token: accessToken
    });
});
passport.use(client);

router.get('/callback',
        passport.authenticate('oauth2', {
            failureRedirect: '/',
            hd: 'advise.pw'
        }),
        (req, res) => {
            console.log(1);
            jwt.sign(req.user.profile, global_config.token_secret, global_config.token_duration, (err, token) => {
                if(err) {
                    res.send(err);
                }
                else {
                    console.log(token);
                    res.json(token);
                }
                
            });
            const fs = require('fs');
            fs.writeFile(path.resolve( __dirname, "./google-oauth2.json"), JSON.stringify(req.user), function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("The file was saved!");
            }); 
            
        }
    );
router.get('/login', passport.authenticate('oauth2', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/admin.directory.orgunit.readonly','https://www.googleapis.com/auth/calendar.readonly', 'openid'], 
    accessType: 'offline', 
    prompt: 'select_account' 
    })
);
module.exports = router;