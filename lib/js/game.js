var ScoreBoard, UserConsole;

this.Player = (function() {

  function Player(id, name, color) {
    this.id = id;
    this.name = name;
    this.color = color;
  }

  return Player;

})();

UserConsole = (function() {

  function UserConsole(debug) {
    if (debug == null) debug = true;
    this.console = console;
  }

  UserConsole.prototype.info = function(txt) {
    return this.console.log(txt);
  };

  return UserConsole;

})();

ScoreBoard = (function() {

  function ScoreBoard() {
    this.scoreboard = $('#scoreboard');
  }

  ScoreBoard.prototype.playerContainer = function(player) {
    return $('.wrapper').find('#p' + player.id);
  };

  ScoreBoard.prototype.playerScoreboard = function(player) {
    return this.scoreboard.find(".p" + player.id);
  };

  ScoreBoard.prototype.goalImage = function(player) {
    return $('.wrapper').find('img.p' + player.id);
  };

  ScoreBoard.prototype.addPlayer = function(player) {
    this.playerContainer(player).find('.title').text(player.name);
    this.playerContainer(player).find('.title').css('color', player.color);
    this.scoreboard.find('.p' + player.id).css('color', player.color);
    this.playerScoreboard(player).css('color', player.color);
    this.playerScoreboard(player).find('.player-name').text(player.name);
    return this.playerScoreboard(player).find('.goals').text('0');
  };

  ScoreBoard.prototype.removePlayer = function(player) {
    var p;
    p = this.playerContainer(player);
    p.find('.title').text('THERE IS NO');
    this.playerScoreboard(player).css('color', '');
    this.playerScoreboard(player).find('.goals').text('-');
    return this.playerScoreboard(player).find('.player-name').text('NO PLAYER');
  };

  ScoreBoard.prototype.updateScoreBoard = function(player) {
    var goals, tempScore;
    goals = this.scoreboard.find('.p' + player.id + ' .goals');
    tempScore = parseInt(goals.text()) + 1;
    return goals.text(tempScore);
  };

  ScoreBoard.prototype.nextMove = function(player) {
    $('.wrapper .current-move').text('');
    return this.playerContainer(player).find('.current-move').text("has ball");
  };

  ScoreBoard.prototype.setupAttackDirection = function(player) {
    if (player.id === 1) {
      return $('#attack').text('V');
    } else {
      return $('#attack').text('/\\');
    }
  };

  ScoreBoard.prototype.animateGoal = function(player) {
    var img;
    img = this.goalImage(player);
    img.show();
    return setTimeout((function() {
      return img.hide();
    }), 2000);
  };

  return ScoreBoard;

})();

this.Game = (function() {

  function Game(id, socket) {
    this.id = id;
    this.socket = socket;
    this.p1Color = '#0089ff';
    this.p2Color = '#ff7f00';
    this.field = '';
    this.scoreBoard = new ScoreBoard();
    this.userConsole = new UserConsole();
    this.setupField();
    this.assignPlayers();
    this.playerEvents();
    this.windowEvents();
    this.socketEvents();
  }

  Game.prototype.assignPlayers = function() {
    var _this = this;
    return $.getJSON("/games/" + this.id, function(data) {
      var p1;
      if (window.selfPlayer) return;
      if (data && data.players.length === 0) {
        console.log("there are no playa for this game");
        window.selfPlayer = new Player(1, "player1", _this.p1Color);
        return _this.addAndEmitPlayer(window.selfPlayer);
      } else if (data && data.players[0] && data.players.length === 1) {
        console.log("there is one player");
        p1 = data.players[0];
        window.remotePlayer = new Player(p1.id, p1.name, p1.color);
        _this.field.addPlayer(window.remotePlayer);
        _this.scoreBoard.addPlayer(window.remotePlayer);
        if (p1.id === 1) {
          window.selfPlayer = new Player(2, "Player2", _this.p2Color);
        } else {
          window.selfPlayer = new Player(1, "Player1", _this.p1Color);
        }
        return _this.addAndEmitPlayer(window.selfPlayer);
      } else {
        _this.userConsole.info("there are too many players");
        return console.log("close board");
      }
    });
  };

  Game.prototype.addAndEmitPlayer = function(player) {
    this.field.addPlayer(player);
    this.scoreBoard.addPlayer(player);
    return this.socket.emit("join-to-match", {
      id: this.id,
      player: {
        id: player.id,
        name: player.name,
        color: player.color
      }
    });
  };

  Game.prototype.setupField = function() {
    this.field = new Field(9, 11);
    this.field.draw();
    this.field.placeBallOnTheField();
    return this.field;
  };

  Game.prototype.getPlayerById = function(id) {
    if (selfPlayer.id === id) {
      return selfPlayer;
    } else {
      return remotePlayer;
    }
  };

  Game.prototype.setGoalAreas = function() {
    this.field.setPlayersGoalAreas(this.getPlayerById(1), this.getPlayerById(2));
    if (selfPlayer.id === 1) {
      return this.field.setCurrentPlayer(selfPlayer);
    } else {
      return this.field.setCurrentPlayer(remotePlayer);
    }
  };

  Game.prototype.reload = function() {
    this.field.redraw();
    this.field.placeBallOnTheField();
    this.setGoalAreas();
    return console.log("reloading");
  };

  Game.prototype.leaveGame = function() {
    this.socket.emit('leave-game', {
      id: this.id,
      player: window.selfPlayer.id
    });
    return this.field.redraw();
  };

  Game.prototype.playerEvents = function() {
    var _this = this;
    $('#reload').click(function(e) {
      e.stopPropagation();
      _this.reload();
      return false;
    });
    return $('#exit-game').click(function(e) {
      e.stopPropagation();
      _this.leaveGame();
      return false;
    });
  };

  Game.prototype.windowEvents = function() {
    var _this = this;
    $(window).bind('game-start', function(e) {
      _this.setGoalAreas();
      return _this.scoreBoard.setupAttackDirection(selfPlayer);
    });
    $(window).bind('cell-move-on', function(e, x, y, p) {
      return _this.socket.emit('cell-move-on', {
        id: _this.id,
        x: x,
        y: y,
        player: p
      });
    });
    $(window).bind('end-of-round', function(e, p) {
      console.log("end of round");
      return _this.field.whoIsNext(p);
    });
    $(window).bind('goal', function(e, cell) {
      var playerGoal;
      playerGoal = cell.player === window.selfPlayer ? window.remotePlayer : window.selfPlayer;
      _this.scoreBoard.updateScoreBoard(playerGoal);
      _this.scoreBoard.animateGoal(playerGoal);
      return _this.reload();
    });
    return $(window).bind('set-current-player', function(e, player) {
      return _this.scoreBoard.nextMove(player);
    });
  };

  Game.prototype.socketEvents = function() {
    var _this = this;
    this.socket.on('cell-move-on-' + this.id, function(data) {
      return _this.field.setBallPosition(data.x, data.y, data.player);
    });
    this.socket.on("join-to-match-" + this.id, function(player) {
      console.log(player.name + "join game");
      if (window.selfPlayer.id !== player.id) {
        _this.userConsole.info(player.name + "join to the game");
        window.remotePlayer = new Player(player.id, player.name, player.color);
        _this.field.addPlayer(window.remotePlayer);
        return _this.scoreBoard.addPlayer(player);
      }
    });
    return this.socket.on("player-left-game", function(player) {
      console.log("remote player left game");
      _this.scoreBoard.removePlayer(player);
      _this.field.removePlayer(player);
      window.remotePlayer = null;
      _this.field.redraw();
      return _this.field.placeBallOnTheField();
    });
  };

  return Game;

})();
