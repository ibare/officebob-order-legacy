var express = require('express');
var app = express();
var server = require('http').Server(app);
var mongo = require('mongodb').MongoClient;
var io = require('socket.io')(server);

var mongodb = null;
var numOrders = {
  '1st': 0,
  '2th': 0,
  '3rd': 0
};

mongo.connect('mongodb://officebob:officeboborder@ds011251.mlab.com:11251/heroku_q9xb9lk4', function(err, db) {
  if (err) {
    return console.error(err);
  }

  mongodb = db;
  console.log("Connected mongodb");
});

app.use(express.static('public'));

app.get('/api/reset', (req, res) => {
  numOrders = {
    '1st': 0,
    '2th': 0,
    '3rd': 0
  };
});

app.get('/api/backup', (req, res) => {

});

app.get('/api/restore', (req, res) => {

});

io.sockets.on('connection', function(socket) {
  socket.join('orders');

  socket.emit('current orders', numOrders);
  socket.to('orders').emit('current orders', numOrders);

  socket.on('new order', function(time) {
    if (numOrders[time] < 30) {
      numOrders[time]++;
      socket.emit('new order:response', time);
    }

    socket.emit('current orders', numOrders);
    socket.to('orders').emit('current orders', numOrders);
  });

  socket.on('cancel order', function(time) {
    if (numOrders[time] > 0) {
      numOrders[time]--;
      socket.emit('cancel order:response', time);
    }

    socket.emit('current orders', numOrders);
    socket.to('orders').emit('current orders', numOrders);
  });

  console.log('connect');
  // so.on('mongo/test', function () {
  //   var collection = mongodb.collection('test');
  //   // Find some documents
  //   collection.find({}).toArray(function(err, docs) {
  //     so.emit('mongo/test', docs);
  //   });
  // });
  socket.on('disconnect', function () {
    console.log('disconnect');
  });
});

server.listen(process.env.PORT || 8080, () => console.log('start server'));