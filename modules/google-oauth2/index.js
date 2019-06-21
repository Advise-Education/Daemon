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
const database = require('../../database');
const {google} = require('googleapis');
const key = require("./serviceaccount.json");
const admin = google.admin('directory_v1');

const googleJWT = new google.auth.JWT(
    key.client_email,
    '113955699327788437848',
    key.private_key,
    ['https://www.googleapis.com/auth/admin.directory.user', 'https://www.googleapis.com/auth/admin.directory.orgunit'],
    config.gsuite_admin_email
);
google.options({
    auth: googleJWT
});

//Functions



function createUser(user_obj, callback) {
    var dbUser = new database.User({ 
        userid: user_obj.id,
        email: user_obj.email,
        firstname: user_obj.firstname,
        lastname: user_obj.lastname,
        suspended: user_obj.suspended,
        archived: user_obj.archived,
        picture: user_obj.picture,
        position: {
            title: user_obj.position.title,
            department: user_obj.position.department
        } 
    });
    
    dbUser.save(function (err, dbUser) {
        if (err) return console.error(err);
        callback(dbUser);
    });
}
function getUser(userKey, callback) {
    admin.users.get({
        userKey: userKey,
        projection: 'full',
    },
    function (err, response) {
        if (err) {
            return callback(err);
        }
        else {
            return callback(null, response.data)
        }
    });
} 
function orgUnitList(orgUnitPath, callback) {

    admin.orgunits.list({
        customerId: "my_customer",
        orgUnitPath: orgUnitPath,
        type: "all"
    })
    .then(res => {
        return callback(null, res.data); 
    })
    .catch(error => {
        return callback(error);
    });
}
 function orgUnitUsers(orgUnitPath, callback) {
    admin.users.list({
        customer: "my_customer",
        query: "orgUnitPath="+orgUnitPath,
        orderBy: "familyName"
    })
    .then(res => {
        return callback(null, res.data);
    })
    .catch(error => {
        return callback(error);
    });
}

//Initialize OAuth2 Strategy
let client = new OAuth2Strategy({
    authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
    tokenURL: 'https://accounts.google.com/o/oauth2/token',
    clientID: config.OAuth.clientID,
    clientSecret: config.OAuth.clientSecret,
    callbackURL: '/module/google-oauth2/callback'
}, function(accessToken, refreshToken, profile, done) { //Refresh token = ?
    done(null, {
        profile: profile,
        token: accessToken
    });
});
client.userProfile = function (accessToken, done) {
    this._oauth2.get('https://www.googleapis.com/plus/v1/people/me', accessToken, function (err, body, res) {
        if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }

        try {
            var profile = JSON.parse(body);

            done(null, profile);  
        } catch(e) {
            done(e);
        }
    });
};    

//Make Passport use OAUth2 Data
passport.use(client);
router.use(passport.initialize());
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

//Callback Route
router.get('/callback',
    passport.authenticate('oauth2', {
        failureRedirect: '/',
}),
(req, res) => {
        if (global_config.domain.indexOf(req.user.profile.domain) >= 0) { //Check if logging in with proper domain name.
            
            getUser(req.user.profile.id, function(err, googleResponse) {
                var user = new Object();
                user.id = googleResponse.externalIds[0].value;
                user.email = googleResponse.primaryEmail;
                user.firstname = googleResponse.name.givenName;
                user.lastname = googleResponse.name.familyName;
                user.suspended = googleResponse.suspended;
                user.archived = googleResponse.archived;
                user.picture = req.user.profile.image.url;
                for (const org of googleResponse.organizations) {
                    if (org.primary == true) {
                        try {
                            user.position = {
                                title: org.title,
                                department: org.department
                            }

                        }
                        catch(err) {
                            console.log(err);
                        }
                    }
                    else {
                        var response = {
                            "error": "Failed to fetch profile data"
                        }
                        res.redirect(global_config.webui + "login/callback?response=" + JSON.stringify(response));
                    }
                }

                if (err) {
                    var response = {
                        "error": "Failed to fetch profile data"
                    }
                    res.redirect(global_config.webui + "login/callback?response=" + JSON.stringify(response));
                }
                else {

                    function respond(data) {
                        jwt.sign({
                            data: data
                        }, global_config.token_secret, { expiresIn: global_config.token_duration}, (err, token) => {
                            if(err) {
                                console.log(err);
                                res.json(err);
                            }
                            else {
                                if (typeof token === 'undefined' || token === null) {
                                    var response = {
                                        "error": "Failed to generate token"
                                    }
                                    res.redirect(global_config.webui + "login/callback?response=" + JSON.stringify(response));
                                }
                                else {
                                   
                                    res.redirect(global_config.webui + "login/callback?token=" + token);
                                }
                            }
                        });
                    }

                    database.User.findOne({ userid: user.id }, function (err, data) {
                        if (data == null) {
                            createUser(user, function(newUser) {
                                respond(newUser);
                            });
                        }
                        else {
                            //!!!! Update User -- Not working as of now !!!!
                            database.User.updateOne({ userid: user.id }, { user }, function (err, response) {
                                console.log(response);
                                respond(data);
                            });
                            
                        }
                        
                    });

                    
                }
            });

            
        }
        else {
            var response = {
                "error": "Invalid Account"
            }
            res.redirect(global_config.webui + "login/callback?response=" + JSON.stringify(response));
        }     
}); 
router.get('/login', passport.authenticate('oauth2', {
    scope: ['profile', 'email'], 
    accessType: 'offline', 
    prompt: 'select_account' 
    })
);
module.exports = router;