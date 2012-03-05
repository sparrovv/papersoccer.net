
this.Field = (function() {

  function Field(width, height) {
    this.width = width;
    this.height = height;
    this.paper = Raphael($('#canvas')[0], this.width * 40, this.height * 40);
    this.dotDistance = 30;
    this.cellSize = 6;
    this.players = [];
  }

  Field.prototype.addPlayer = function(p) {
    if (this.players.length <= 2) {
      this.players.push(p);
      if (this.players.length === 2) {
        console.log("game-start");
        return $(window).trigger('game-start');
      }
    } else {
      return $(window).trigger('game-error', ["Too many players on the field"]);
    }
  };

  Field.prototype.removePlayer = function(player) {
    var removeIndex,
      _this = this;
    removeIndex = null;
    $.each(this.players, function(i, e) {
      if (e.id === player.id) return removeIndex = i;
    });
    return this.players.splice(removeIndex, 1);
  };

  Field.prototype.draw = function() {
    return this.drawDots();
  };

  Field.prototype.redraw = function() {
    this.paper.clear();
    return this.draw();
  };

  Field.prototype.drawDots = function() {
    var cirlcle, x, y, _ref, _results;
    this.field = {};
    _results = [];
    for (x = 1, _ref = this.width; 1 <= _ref ? x <= _ref : x >= _ref; 1 <= _ref ? x++ : x--) {
      this.field[x] = {};
      _results.push((function() {
        var _ref2, _results2;
        _results2 = [];
        for (y = 1, _ref2 = this.height; 1 <= _ref2 ? y <= _ref2 : y >= _ref2; 1 <= _ref2 ? y++ : y--) {
          if ((x === 1 && y === 1) || (x === 1 && y === this.height) || (x === this.width && y === 1) || (x === this.width && y === this.height)) {
            cirlcle = this.paper.circle(x * this.dotDistance, y * this.dotDistance, this.cellSize);
            _results2.push(this.field[x][y] = new CornerCell(cirlcle, [x, y], this.paper));
          } else if ((y === 1 || y === this.height) && (x === Math.round(this.width / 2))) {
            cirlcle = this.paper.circle(x * this.dotDistance, y * this.dotDistance, this.cellSize);
            _results2.push(this.field[x][y] = new InFrontOfGoalCell(cirlcle, [x, y], this.paper));
          } else {
            cirlcle = this.paper.circle(x * this.dotDistance, y * this.dotDistance, this.cellSize);
            _results2.push(this.field[x][y] = new Cell(cirlcle, [x, y], this.paper));
          }
        }
        return _results2;
      }).call(this));
    }
    return _results;
  };

  Field.prototype.setPlayersGoalAreas = function(p1, p2) {
    var x, y;
    x = Math.round(this.width / 2);
    y = 0;
    this.field[x][y] = new GoalCell(this.paper.circle(x * this.dotDistance, 5, this.cellSize), [x, y], this.paper);
    this.field[x][y].setPlayer(p1);
    this.field[x][this.height + 1] = new GoalCell(this.paper.circle(x * this.dotDistance, ((this.height + 1) * this.dotDistance) - 5, this.cellSize), [x, this.height + 1], this.paper);
    return this.field[x][this.height + 1].setPlayer(p2);
  };

  Field.prototype.getPlayers = function() {
    return this.players;
  };

  Field.prototype.setCurrentPlayer = function(p) {
    window.currentPlayer = p;
    return $(window).trigger('set-current-player', [p]);
  };

  Field.prototype.getCurrentPlayer = function() {
    return window.currentPlayer;
  };

  Field.prototype.isCurrentPlayer = function(p) {
    return this.getCurrentPlayer().id === p.id;
  };

  Field.prototype.whoIsNext = function(lastSessionPlayer) {
    var ball, noLastSessionPlayer;
    ball = this.getBall();
    noLastSessionPlayer = this.getPlayers().filter(function(p) {
      return p !== lastSessionPlayer;
    });
    if (this.canItBeMoved(ball)) {
      return this.setCurrentPlayer(lastSessionPlayer);
    } else {
      return this.setCurrentPlayer(noLastSessionPlayer[0]);
    }
  };

  Field.prototype.canItBeMoved = function(ball) {
    return ball.isOnEdge(this.width, this.height) || ball.sources.length > 1;
  };

  Field.prototype.getCell = function(x, y) {
    return this.field[x][y];
  };

  Field.prototype.getBall = function() {
    var g, x, y, _ref, _ref2;
    g = null;
    for (x = 1, _ref = this.width; 1 <= _ref ? x <= _ref : x >= _ref; 1 <= _ref ? x++ : x--) {
      for (y = 1, _ref2 = this.height; 1 <= _ref2 ? y <= _ref2 : y >= _ref2; 1 <= _ref2 ? y++ : y--) {
        if (this.field[x][y].taken) g = this.field[x][y];
      }
    }
    return g;
  };

  Field.prototype.placeBallOnTheField = function() {
    var c, x, y;
    x = Math.round(this.width / 2);
    y = Math.round(this.height / 2);
    c = this.field[x][y];
    return c.setTaken(x, y);
  };

  Field.prototype.notValidMove = function(x, y) {
    return this.nexMoveIsOnTheSameBorder(x, y) || this.isPathTaken(x, y) || !this.isInRange(x, y);
  };

  Field.prototype.setBallPosition = function(x, y, p) {
    var ball;
    if (!this.isCurrentPlayer(p)) return false;
    if (this.notValidMove(x, y)) return false;
    ball = this.getBall();
    ball.setNoTaken();
    this.drawPath([ball.x, ball.y], [x, y], p);
    this.getCell(x, y).setTaken(ball.x, ball.y);
    return $(window).trigger('end-of-round', [this.getCurrentPlayer()]);
  };

  Field.prototype.drawPath = function(from, to, player) {
    var f, p, str, t;
    f = this.getRealCoord(from[0], from[1]);
    t = this.getRealCoord(to[0], to[1]);
    str = "M" + f[0] + "," + f[1] + "L" + t[0] + "," + t[1];
    p = this.paper.path(str);
    p.toBack();
    return p.attr('stroke', player.color);
  };

  Field.prototype.dPath = function(from, to) {
    var f, p, t;
    f = this.getRealCoord(from[0], from[1]);
    t = this.getRealCoord(to[0], to[1]);
    return p = this.paper.path("M" + f[0] + "," + f[1] + "L" + t[0] + "," + t[1]);
  };

  Field.prototype.getRealCoord = function(x, y) {
    var cell;
    cell = this.getCell(x, y);
    return [cell.circle.attrs.cx, cell.circle.attrs.cy];
  };

  Field.prototype.nexMoveIsOnTheSameBorder = function(x, y) {
    var ball, nextCell;
    ball = this.getBall();
    nextCell = this.getCell(x, y);
    if (ball.isOnYBorder(this.height) && nextCell.isOnYBorder(this.height)) {
      return true;
    }
    if (ball.isOnXBorder(this.width) && nextCell.isOnXBorder(this.width)) {
      return true;
    }
    return false;
  };

  Field.prototype.isPathTaken = function(x, y) {
    var ball;
    ball = this.getBall();
    return this.field[x][y].isPathTaken(ball.x, ball.y) || ball.isPathTaken(x, y);
  };

  Field.prototype.isInRange = function(x, y) {
    var ball, bros, coord, temp_x, temp_y, _i, _len;
    ball = this.getBall();
    bros = [[-1, 0], [1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]];
    for (_i = 0, _len = bros.length; _i < _len; _i++) {
      coord = bros[_i];
      temp_x = ball.x + coord[0];
      temp_y = ball.y + coord[1];
      if (temp_x === x && temp_y === y) return true;
    }
    return false;
  };

  return Field;

})();
