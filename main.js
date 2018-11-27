var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.get('*', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send("Advise Daemon Running");
});

io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

server.listen(3000, function() {
  console.log("Advise Daemon running on port 3000");
});