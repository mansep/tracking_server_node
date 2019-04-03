const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');

const config = require('./config.json')

mongoose.connect(config.mongo.connection_string, {useNewUrlParser: true});
const Tracking = mongoose.model('Tracking', { lat: Number, long: Number, of: String, imei: String });

app.get('/', function(req, res){
  res.sendFile(__dirname + '/html/index.html');
});

function sendData(){
  Tracking.find(function(err, tracking){
    if (err) return console.error(err);
    io.sockets.emit("get_data", tracking);
  });
}

io.on('connection', function(socket){
  socket.on('send_data', function(position){
    sendData();
  });
  socket.on('tracking', function(position){
    position = typeof position == "string" ? JSON.parse(position) : position;
    var position_add = {
      "lat": position.lat,
      "long": position.long,
      "of": position.of,
      "imei": position.imei,
    }
    const storage = new Tracking(position_add);
    storage.save().then(function(){
      sendData();
    });
  });
});

http.listen(config.express.port, function(){
  console.log('listening on *:' + config.express.port);
});