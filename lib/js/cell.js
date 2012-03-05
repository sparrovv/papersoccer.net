var __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

this.Cell = (function() {

  function Cell(circle, coord, paper, taken) {
    this.circle = circle;
    this.paper = paper;
    this.taken = taken != null ? taken : false;
    this.sources = [];
    this.circle.attr('stroke', '');
    this.circle.attr('fill', '#e7e7e7');
    this.circle.attr('fill-opacity', 0.01);
    this.x = coord[0];
    this.y = coord[1];
    this.bindEvents();
  }

  Cell.prototype.bindEvents = function() {
    var _this = this;
    return this.circle[0].onclick = function() {
      var p;
      p = window.selfPlayer;
      console.log(p.id + ' tries place a ball on me');
      return $(window).trigger('cell-move-on', [_this.x, _this.y, p]);
    };
  };

  Cell.prototype.setNoTaken = function() {
    this.taken = false;
    if (this.ballImage) {
      this.ballImage.remove();
      this.circle.attr('fill', '#fff');
      return this.circle.attr('fill-opacity', 0.6);
    }
  };

  Cell.prototype.setTaken = function(x, y) {
    var coord;
    this.setSourcePath(x, y);
    this.taken = true;
    coord = this.getPaperCoord();
    return this.ballImage = this.paper.image('/public/ball.png', coord[0] - 8, coord[1] - 8, 15, 15);
  };

  Cell.prototype.isNotClear = function() {
    return this.sources.length > 0;
  };

  Cell.prototype.setSourcePath = function(x, y) {
    return this.sources.push([x, y]);
  };

  Cell.prototype.getPaperCoord = function() {
    return [this.circle.attrs.cx, this.circle.attrs.cy];
  };

  Cell.prototype.isPathTaken = function(x, y) {
    var e, flag, _i, _len, _ref;
    flag = false;
    _ref = this.sources;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      e = _ref[_i];
      if (e[0] === x && e[1] === y) flag = true;
    }
    return flag;
  };

  Cell.prototype.isOnXBorder = function(width) {
    return this.x === 1 || this.x === width;
  };

  Cell.prototype.isOnYBorder = function(height) {
    return this.y === 1 || this.y === height;
  };

  Cell.prototype.isOnBorder = function(width, height) {
    return this.isOnXBorder(width) || this.isOnYBorder(height);
  };

  Cell.prototype.isOnEdge = function(width, height) {
    return this.x === 1 || this.x === width || this.y === 1 || this.y === height;
  };

  return Cell;

})();

this.CornerCell = (function(_super) {

  __extends(CornerCell, _super);

  function CornerCell(circle, coord, paper, taken) {
    this.circle = circle;
    this.paper = paper;
    this.taken = taken != null ? taken : false;
    this.circle.attr('stroke', '');
  }

  return CornerCell;

})(Cell);

this.InFrontOfGoalCell = (function(_super) {

  __extends(InFrontOfGoalCell, _super);

  function InFrontOfGoalCell() {
    InFrontOfGoalCell.__super__.constructor.apply(this, arguments);
  }

  InFrontOfGoalCell.prototype.isOnEdge = function(widht, height) {
    return false;
  };

  InFrontOfGoalCell.prototype.isOnXBorder = function(height) {
    return false;
  };

  InFrontOfGoalCell.prototype.isOnYBorder = function(height) {
    return false;
  };

  return InFrontOfGoalCell;

})(Cell);

this.GoalCell = (function(_super) {

  __extends(GoalCell, _super);

  function GoalCell() {
    GoalCell.__super__.constructor.apply(this, arguments);
  }

  GoalCell.prototype.setPlayer = function(player) {
    this.player = player;
    this.playerName = player.name;
    this.circle.attr('fill', player.color);
    return this.circle.attr('fill-opacity', 1);
  };

  GoalCell.prototype.setTaken = function(x, y) {
    GoalCell.__super__.setTaken.call(this, x, y);
    console.log("goal, scoreboard and reload");
    return $(window).trigger('goal', [this]);
  };

  return GoalCell;

})(Cell);
