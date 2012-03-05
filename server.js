var express = require('express'),
   app = express.createServer(),
   redis = require('redis'),
   rclient = redis.createClient(),
   jade = require('jade'),
   _und = require('underscore'),
   io = require('socket.io').listen(app);

rclient.on("error", function (err) {
  console.log("Error " + err);
});

app.configure('production', function(){
  app.listen(8081);
});

app.configure('development', function(){
  app.listen(8080);
});

var REDIS_PAPERSOCCER_KEY = 'papersoccer-game';
var ROOM_KEY = 'game-room-';
var AUTOINCREMENT_KEY = 'papersoccer-game-id';

app.use("/public", express.static(__dirname + '/public'));
app.use("/lib", express.static(__dirname + '/lib'));
app.use(express.favicon());

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'thesecret' }));
});

app.dynamicHelpers({
  flashMessages: function(request) { return request.flash('error'); },
  history: function(request) { return request.session.history; }
});


app.get('/', function (req, res) {
  res.redirect('/games');
});

app.get('/games/new', function(req, res){

  rclient.incr(AUTOINCREMENT_KEY, function(err, gameId){
    var gameIdObject = redisGameRecord(gameId);
    var gameInfo = {id: gameId, players: []};
    rclient.set(gameIdObject, JSON.stringify(gameInfo));
    res.redirect("/games/"+gameId);
  });

});

app.get('/games/single', function(req, res){
  res.render('single.jade');
});

app.get('/games/:id', function (req, res) {
  var gameIdObject = REDIS_PAPERSOCCER_KEY + ":" +req.params.id;

  rclient.get(gameIdObject, function(err, rawResults){
    var result = JSON.parse(rawResults);
    if(req.xhr){
      res.writeHead(200, {'content-type': 'text/json' });
      res.write( JSON.stringify(result) );
      res.end('\n');
    }else{
      if(!result){
        res.send('no such game', 404);
      }else if(result.players.length < 2){
        res.render('game.jade', { id: req.params.id });
      }else{
        req.flash('error', 'There are already 2 players');
        res.redirect('/games');
      }
    }
  });
});

app.get('/games', function (req, res) {
  var key = REDIS_PAPERSOCCER_KEY + ":*";

  rclient.keys(key, function(err, rawResults){
    if(rawResults){
      rclient.mget(rawResults, function(err, results){
        var r = null;
        if(results){
          r = _und.map(results, function(e){ return JSON.parse(e); });
        }
        res.render('games.jade', { games: r || [] });
      });
    }else{
      res.render('games.jade', { games: [] });
    }
  });
});

var PaperSoccer = {
  leaveGame: function(socket, gameId, player){
    var gameIdObject = redisGameRecord(gameId);

    rclient.get(gameIdObject, function(err, rawResults){
      var gameInfo = JSON.parse(rawResults);
      var keep='';

      if (gameInfo && gameInfo.players.length == 2){

        if (gameInfo.players[0].id == player.id){
          gameInfo.players.splice(0,1);
        }else{
          gameInfo.players.splice(1,1);
        }

        console.log("leaving game");
        console.log(gameInfo);

        keep = JSON.stringify(gameInfo);
        rclient.set(gameIdObject, keep);
        socket.broadcast.to(roomId(gameId)).emit("player-left-game", player);

      }else if(gameInfo){
        rclient.del(gameIdObject);
      }
    });
  },

  redisGameRecord: function(id){
    return REDIS_PAPERSOCCER_KEY + ":" + id;
  },

  roomId: function(id){
    return ROOM_KEY + id;
  },
};

io.sockets.on('connection', function (socket) {

  socket.on('join-to-match', function(data){
    var gameIdObject = redisGameRecord(data.id);

    rclient.get(gameIdObject, function(err, rawResults){
      var gameInfo = JSON.parse(rawResults);

      if(gameInfo.players.length < 2){
        gameInfo.players.push(data.player);
        rclient.set(gameIdObject, JSON.stringify(gameInfo));
        socket.join(roomId(data.id));
        socket.set('playerInfo', { gameId: data.id, player: data.player});
        io.sockets.emit('join-to-match-'+data.id, data.player);
      }else{
        io.sockets.emit('join-to-match-'+data.id, {error: "probably to many players", info: gameInfo});
      }
    });
  });

  socket.on('disconnect', function () {
    socket.get('playerInfo', function(err, playerInfo){
      if(playerInfo){
        PaperSoccer.leaveGame(socket, playerInfo.gameId, playerInfo.player);
      }else{
        console.log('no player info');
      }
    });
  });

  socket.on("cell-move-on", function(data){
    io.sockets.in(roomId(data.id)).emit("cell-move-on-"+data.id,{x:data.x,y:data.y,player: data.player});
  });

  socket.on("leave-game", function(data){
    PaperSoccer.leaveGame(socket, data.id, data.player);
  });

});

