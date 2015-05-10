#!/usr/bin/env node
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */
"use strict";

var express = require("express");
var app = express(),
    http = require("http"),
    server = http.createServer(app),
    socketIO = require("socket.io"),
    io = socketIO(server);

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require("express-session");

var routes = require('./routes/index');
var users = require('./routes/users');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/acronymble');

// this line will generate error 
var User = require("./models/user");
var Game = require("./models/game");


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");
app.engine('html', require('ejs').renderFile);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// needed to create user sessions
app.use(session({
  secret: "BetEmerge7Verge",
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);


// source: http://stackoverflow.com/questions/16123346/generate-random-letters-in-javascript-and-count-how-many-times-each-letter-has-o
function generateLetter(){
  var index, temp;
  var array = [];
  // TODO: uncomment this after done testing
  // var numLetter = Math.floor((Math.random() * 5) + 3);
  var numLetter = 3;
  for(index=0; index < numLetter; index++){
    temp = String.fromCharCode(97 + Math.floor(Math.random()*26));
    array.push(temp.toUpperCase());
  }
  return array.join(".");
};

// check and update player rank
function update_rank(score)
{
  if(score <= 20){
    return "Beginner";
  } else if (score <=40){
    return "Bronze";
  } else if(score <=100){
    return "Silver";
  } else if(score <200){
    return "Gold";
  } else if(score <500){
    return "Platinum";
  } else if(score <1000){
    return "Diamond";
  } else {
    return "Master";
  }
}


// a varibale that keep all phrase added by user
var list_phrase=[];


// to keep track of sockets
var connected_sockets = [];

var game_in_progress = "false";

// uncomment the below if you need to keep track of users connected to the server
var connected_users = [];

// Event handlers
io.sockets.on("connection", function (socket) {
  connected_sockets.push(socket);
  connected_users.push(socket.handshake.query.userName);
  
  socket.on("start_new_game", function () {
    // check if there is a game already in progress
    if (game_in_progress === "true") {
      socket.emit("game_started", {game_in_progress: "true"});
    } else {
      game_in_progress = "true";
      connected_sockets.forEach(function (sock) {
        sock.emit("game_started", {game_in_progress: "false"});
      });  
    }
    
  });


  socket.on("join_game", function (data) {
    // uncomment the below if you need to keep track of users connected to the server
    // connected_users.push(data);
    // console.log("join_game, received from client: " + data);

    connected_sockets.forEach(function (sock) {
      sock.emit("user_joined_game", data);
    });
    // socket.emit("user_joined_game", data);
    // socket.broadcast.emit("user_joined_game", data);
  });

  socket.on("generate_acronym", function () {
    var acro = generateLetter();
    // console.log("acronym: " + acro);
    connected_sockets.forEach(function (sock) {
      sock.emit("acronym_generated", acro);
    });
  });


  socket.on("add_phrase", function(data){
    list_phrase.push({author: data.user, phrase: data.phrase, vote:0});
    // console.log(list_phrase);
    socket.broadcast.emit("phrase_added", data);
  });

// after timeout is done on client side, the client emits game_ended event 
  socket.on("game_ended",function(){
    connected_sockets.forEach(function (sock) {
      sock.emit("vote_started", list_phrase);
    });
  });// end game_ended

  socket.on("voted_phrase", function(author){
    var i;
    // console.log(author+" has been voted");
    for(i=0; i < list_phrase.length; i++) { 
      if(list_phrase[i].author === author) {
        list_phrase[i].vote +=1;
      }
    }
    connected_sockets.forEach(function(sock){
      sock.emit("update_vote", list_phrase);
    });
    //socket.broadcast.emit("update_vote", list_phrase);
  });

  socket.on("vote_ended", function() {
    if (list_phrase.length > 0) {
      // loop through list_phrase to find the winner
      var winner = list_phrase[0], i;
      for(i=1;i<list_phrase.length;i++){
        if(winner.vote < list_phrase[i].vote){
          winner = list_phrase[i];
        }
      }// end for

      // update score for winner
      User.findOne({username: winner.author}, function(err, result){
        if(err){
          console.log(err);
        } else{
          result.score += 5;
          result.rank = update_rank(result.score);
          result.save(function(err){
            if(err){
              console.log(err);
            }else{
              // console.log("winner score has been updated ");
            }
          });
        }
      });


      for(i=0;i<list_phrase.length;i++){
        if(list_phrase[i].author !== winner.author){
          User.findOne({username: list_phrase[i].author}, function(err, result){
            if(err){
              console.log(err);
            } else{
              result.score += 1;
              result.rank = update_rank(result.score);
              result.save(function(err){
                if(err){
                  console.log(err);
                }else{
                  // console.log("winner score has been updated ");
                }
              });
            }
          });
        }
      }

      connected_sockets.forEach(function(sock){
        sock.emit("winner", winner);
      });
    }
    // game is over
    game_in_progress = "false";
  }); // end vote_ended
  
  socket.on("another_game_started", function () {
    // console.log("another_game_started");
    list_phrase = [];
    game_in_progress = "true";
    connected_sockets.forEach(function (sock) {
      sock.emit("server_another_game_started");
    });
  });

  socket.on("sendChat", function(message, username){
    socket.broadcast.emit("recieveMessage", message, username);
  });

  socket.on("sendWhisper", function(target, message, username){
    console.log(target);
    console.log(message);
    var i = connected_users.indexOf(target);
    if(i !== -1){
      connected_sockets[i].emit("recieveWhisper", message, username);
    }
  });

});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

server.listen(3000);
console.log("listening on port 3000");

module.exports = app;
