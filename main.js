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