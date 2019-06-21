// database.js for local database

const mongoose = require("mongoose"),
    mongodserver = require('mongod'),
    path = require("path");
var config = require("./config");

// try to spawn local database if mongodb property is found in config
if (config.database.mongodb != undefined) {
    console.log("Attempting to connect to local database...")
    const mongod = new mongodserver({
        port: config.database.dbport,
        bin: config.database.mongodb,
        dbpath: path.join(__dirname, "/database")
    });

    mongod.open((err) => {
        if (err === null) {
            mongoose.connect("mongodb://"+config.database.IP+":"+config.database.dbport+"/"+config.database.dbname, { useNewUrlParser: true}, function(error) {
                if (error) {
                    console.log("Failed to connect to local database.");
                    console.log(error);
                    process.exit();
                }
                else {
                    console.log("Connected to local database.");
                }
                
            });
        }
        else {
            console.error(err);
        }
    });
}
else {
    // otherwise, connect to external database
    console.log("Attempting to connect to external database...");
    mongoose.connect(config.database.existing_url, { useNewUrlParser: true}, function(error) {
        if (error) {
            console.log("Failed to connect to external database.");
            console.log(error);
            process.exit();
        }
        else {
            console.log("Connected to external database.");
        }
      });
}

// Mongoose models

var UserSchema = new mongoose.Schema({
    userid: { type : String, unique : true, required : true, dropDups: true },
    firstname: String,
    lastname: String,
    suspended: String,
    archived: String,
    picture: String,
    position: [{title: String, department: String}],
    permissions: [ String ],
    classes: [ mongoose.Schema.Types.ObjectId ],
    chats: [ mongoose.Schema.Types.ObjectId ],
    cachedChatList: [{ chatid: String, title: String, lastMessage: {text: String, date: String}, unread: Boolean }],
    chatUnreadCount: { type: Number, default: 0 }
});

UserModel = mongoose.model("User", UserSchema);

var ClassSchema = new mongoose.Schema({
    title: String,
    subtitle: { type: String, default: "" },
    instructors: [ mongoose.Schema.Types.ObjectId ],
    students: [ mongoose.Schema.Types.ObjectId ]
});

ClassModel = mongoose.model("Class", ClassSchema);

var ChatSchema = new mongoose.Schema({
    chatid: { type : String, unique : true, required : true, dropDups: true },
    participants: [ mongoose.Schema.Types.ObjectId ],
    title: String,
    messages: [{ userid: String, body: String, date: Date }]
});

ChatModel = mongoose.model("Chat", ChatSchema);


var RouteSchema = new mongoose.Schema({
    route: { type : String, unique : true, required : true, dropDups: true },
    file: { type: String, require: true},
    title: String,
    permission: [ String ],
    variables: [ String ]
});

RouteModel = mongoose.model("Route", RouteSchema);




// functions

createNewClass = function(title, instructors, students) {
    var dbClass = new database.Class({ title: title, instructors: instructors, students: students });

    // assign class to each instructor
    UserModel.find({'_id': {$in: instructors}}, function(err, userData) {
        let i = 0;
        let subtitle = "";
        
        // generate a comma-separated list of instructor names to use as the subtitle
        userData.forEach(data => {
            // don't add a comma before the first one
            if (i != 0) {
                subtitle += ", ";
            }

            subtitle += data.givenName + " " + data.familyName;
            i++;

            // add the class to the user's class list
            data.classes.push(dbClass._id);
            data.save();
        });

        dbClass.subtitle = subtitle;
        dbClass.save();
    });
    
    // assign class to each student
    UserModel.find({'_id': {$in: students}}, function(err, userData) {
        userData.forEach(data => {
            data.classes.push(dbClass._id);
            data.save();
        });
    });
}

perm_addGroup = function(group, unit) {

}

module.exports = {
    // models
    User: UserModel,
    Class: ClassModel,
    Chat: ChatModel,
    Route: RouteModel,

    // functions
    createNewClass: createNewClass
};
