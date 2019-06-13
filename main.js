var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require("body-parser");
var jwt        = require("jsonwebtoken");
var path = require("path");
var glob = require('glob');
var config = require('./config.json');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});

// Load Modules
var getModules = function (callback) {
  glob('modules/*', callback);
};
getModules(function (err, modules) {
  if (err) {
    console.log('Error', err);
  } else {
    modules.forEach(mod => {
      var name = mod.substring(8)
      if (require("./"+mod+"/config.json").enabled === "true") {
        app.use("/module/"+name, require("./"+mod));
        console.log("[Module] "+name + " loaded.");
      }
    });
  }
});


function verifyToken(req, res, next){
  console.log(req.query.token);
  //Request header with authorization key
  const bearerHeader = req.headers['authorization'];
  //Check if there is  a header
  if(typeof bearerHeader !== 'undefined'){
      const bearer = bearerHeader.split(' ');
      
      //Get Token arrray by spliting
      const bearerToken = bearer[1];
      req.query.token = bearerToken;
      //call next middleware
      next();
  }else{
      console.log(1);
      res.sendStatus(403);
  }
}



//Test the Token
// app.get('/api/test', verifyToken, (req, res) => {
app.get('/api/test', (req, res) => {

  jwt.verify(req.query.token, config.token_secret, (err, authData)=>{
      if(err) {
          res.json(err);
          console.log(err);
      } else{
          res.json({
              msg: "Success, you are signed in!",
              authData
          });
      }
  });
});

//Socket.io stuff for later
io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

server.listen(3000, function() {
  console.log("Advise Daemon running on port 3000");
});