var __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

this.AIPlayer = (function(_super) {

  __extends(AIPlayer, _super);

  function AIPlayer(id, name, color) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.name = "Computer";
    this.bros = [[0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [0, 1], [1, 1], [-1, 1]];
    this.rightDirections = [[0, -1], [-1, -1], [1, -1]];
  }

  AIPlayer.prototype.createMap = function(cell) {};

  AIPlayer.prototype.localizeBroCells = function(cell, field) {
    var bro, c, validBros, x, y, _i, _len, _ref;
    validBros = [];
    _ref = this.bros;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      bro = _ref[_i];
      try {
        x = cell.x + bro[0];
        y = cell.y + bro[1];
        c = field.getCell(x, y);
        if (c) validBros.push(c);
      } catch (error) {
        c = false;
      }
    }
    return validBros;
  };

  AIPlayer.prototype.canItBeBounced = function(broCells, field) {
    var ball, broCell, canBeBouncedCells, _i, _len;
    ball = field.getBall();
    canBeBouncedCells = [];
    for (_i = 0, _len = broCells.length; _i < _len; _i++) {
      broCell = broCells[_i];
      console.log(broCell);
      if (broCell.isOnBorder(field.width, field.height) || broCell.isNotClear()) {
        if (!field.notValidMove(broCell.x, broCell.y)) {
          canBeBouncedCells.push(broCell);
        }
      }
    }
    return canBeBouncedCells;
  };

  AIPlayer.prototype.filterByDirection = function(cell, cells) {
    var b, c, cellsWithGoodDir, x, y, _i, _j, _len, _len2, _ref;
    cellsWithGoodDir = [];
    for (_i = 0, _len = cells.length; _i < _len; _i++) {
      c = cells[_i];
      _ref = this.rightDirections;
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        b = _ref[_j];
        x = cell.x + b[0];
        y = cell.y + b[1];
        if (c.x === x && c.y === y) cellsWithGoodDir.push(c);
      }
    }
    return cellsWithGoodDir;
  };

  AIPlayer.prototype.getGoalDir = function(cells, field) {
    var ball, cell, goal, rightDir, _i, _j, _k, _len, _len2, _len3;
    ball = field.getBall();
    goal = [5, 0];
    rightDir = [];
    if (ball.x > goal[0]) {
      for (_i = 0, _len = cells.length; _i < _len; _i++) {
        cell = cells[_i];
        if (cell.x < ball.x) rightDir.push(cell);
      }
    }
    if (ball.x < goal[0]) {
      for (_j = 0, _len2 = cells.length; _j < _len2; _j++) {
        cell = cells[_j];
        if (cell.x > ball.x) rightDir.push(cell);
      }
    }
    if (ball.x === goal[0]) {
      for (_k = 0, _len3 = cells.length; _k < _len3; _k++) {
        cell = cells[_k];
        if (cell.x === ball.x) rightDir.push(cell);
      }
    }
    return rightDir;
  };

  AIPlayer.prototype.makeMove = function(field) {
    var ball, bros, canBeBouncedCells, cell, cellsToGo, goodDirections, _i, _j, _len, _len2;
    ball = field.getBall();
    bros = this.localizeBroCells(ball, field);
    goodDirections = this.filterByDirection(ball, bros);
    canBeBouncedCells = this.canItBeBounced(goodDirections, field);
    cellsToGo = {
      bounced: [],
      normal: []
    };
    if (canBeBouncedCells.length > 0) {
      for (_i = 0, _len = canBeBouncedCells.length; _i < _len; _i++) {
        cell = canBeBouncedCells[_i];
        if (!field.notValidMove(cell.x, cell.y)) cellsToGo.bounced.push(cell);
      }
    }
    for (_j = 0, _len2 = goodDirections.length; _j < _len2; _j++) {
      cell = goodDirections[_j];
      if (!field.notValidMove(cell.x, cell.y)) cellsToGo.normal.push(cell);
    }
    if (cellsToGo.bounced.length > 0 || cellsToGo.normal.length > 0) {
      cell = cellsToGo.bounced[0];
      if (cell) {
        $(window).trigger('cell-move-on', [cell.x, cell.y, this]);
        return false;
      }
    }
    return this.makeMoveOld(field);
  };

  AIPlayer.prototype.makeMoveOld = function(field) {
    var ball, bro, bros, cell, x, y, _i, _len, _results;
    ball = field.getBall();
    bros = [[0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [0, 1], [1, 1], [-1, 1]];
    _results = [];
    for (_i = 0, _len = bros.length; _i < _len; _i++) {
      bro = bros[_i];
      try {
        x = ball.x + bro[0];
        y = ball.y + bro[1];
        cell = field.getCell(x, y);
      } catch (error) {
        cell = false;
      }
      if (cell) {
        if (!field.notValidMove(cell.x, cell.y)) {
          console.log(x, y);
          $(window).trigger('cell-move-on', [cell.x, cell.y, this]);
          break;
        } else {
          _results.push(void 0);
        }
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  return AIPlayer;

})(Player);

this.SinglePlayerGame = (function(_super) {

  __extends(SinglePlayerGame, _super);

  function SinglePlayerGame() {
    this.p1Color = '#0089ff';
    this.p2Color = '#ff7f00';
    this.field = '';
    this.scoreBoard = new ScoreBoard();
    this.userConsole = new UserConsole();
    this.windowEvents();
    this.setupField();
    this.assignPlayers();
    this.playerEvents();
  }

  SinglePlayerGame.prototype.assignPlayers = function() {
    window.selfPlayer = new Player(1, "Player1", this.p1Color);
    this.field.addPlayer(window.selfPlayer);
    this.scoreBoard.addPlayer(selfPlayer);
    window.remotePlayer = new AIPlayer(2, "Player2", this.p2Color);
    this.field.addPlayer(window.remotePlayer);
    return this.scoreBoard.addPlayer(remotePlayer);
  };

  SinglePlayerGame.prototype.setGoalAreas = function() {
    this.field.setPlayersGoalAreas(this.getPlayerById(1), this.getPlayerById(2));
    if (selfPlayer.id === 1) {
      return this.field.setCurrentPlayer(selfPlayer);
    } else {
      return this.field.setCurrentPlayer(remotePlayer);
    }
  };

  SinglePlayerGame.prototype.windowEvents = function() {
    var _this = this;
    $(window).bind('game-start', function(e) {
      _this.setGoalAreas();
      return _this.scoreBoard.setupAttackDirection(selfPlayer);
    });
    $(window).bind('cell-move-on', function(e, x, y, player) {
      return _this.field.setBallPosition(x, y, player);
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
      var f;
      _this.scoreBoard.nextMove(player);
      if (player === window.remotePlayer) {
        f = _this.field;
        return setTimeout((function() {
          return window.remotePlayer.makeMove(f);
        }), 300);
      }
    });
  };

  return SinglePlayerGame;

})(Game);
