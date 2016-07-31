var express = require('express');
var app = express();
var server = require('http').Server(app);
var mongo = require('mongodb').MongoClient;
var io = require('socket.io')(server);

var orderdate = '2016-08-01';
var mongodb = null;
var numConnection = 0;
var numOrders = {
  '1st': 0,
  '2th': 0,
  '3rd': 0,
  slug: 'A'
};

function updateOrders() {
  var orders = mongodb.collection('orders');

  orders.updateOne({ orderdate: orderdate }, {
      $set: {
        '1st': numOrders['1st'],
        '2th': numOrders['2th'],
        '3rd': numOrders['3rd']
      }}, function(err, result) {
      console.log('update!');
    }
  );
}

mongo.connect('mongodb://officebob:officeboborder@ds011251.mlab.com:11251/heroku_q9xb9lk4', function(err, db) {
  if (err) {
    return console.error(err);
  }

  mongodb = db;

  var orders = mongodb.collection('orders');

  orders.find({ orderdate: orderdate }).toArray((err, docs) => {
    if (err) {
      return console.error(err);
    }

    numOrders['1st'] = docs[0]['1st'];
    numOrders['2th'] = docs[0]['2th'];
    numOrders['3rd'] = docs[0]['3rd'];
    numOrders['slug'] = docs[0]['slug'];

    console.log("Connected mongodb");
  });
});

app.use(express.static('public'));

io.sockets.on('connection', function(socket) {
  numConnection++;

  socket.join('orders');

  socket.emit('connection status', numConnection);
  socket.to('orders').emit('connection status', numConnection);

  socket.emit('current orders', numOrders);
  socket.to('orders').emit('current orders', numOrders);

  socket.on('init', function() {
    socket.emit('init:response', numOrders);
  });

  socket.on('new order', function(time) {
    if (numOrders[time] < 30) {
      numOrders[time]++;
      updateOrders();
      socket.emit('new order:response', time);
    }

    socket.emit('current orders', numOrders);
    socket.to('orders').emit('current orders', numOrders);
  });

  socket.on('cancel order', function(time) {
    if (numOrders[time] > 0) {
      numOrders[time]--;
      updateOrders();
      socket.emit('cancel order:response', time);
    }

    socket.emit('current orders', numOrders);
    socket.to('orders').emit('current orders', numOrders);
  });

  console.log('connect');

  socket.on('disconnect', function () {
    numConnection--;
    console.log('disconnect');
    socket.emit('connection status', numConnection);
    socket.to('orders').emit('connection status', numConnection);
  });
});

server.listen(process.env.PORT || 8080, () => console.log('start server'));
