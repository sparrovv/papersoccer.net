class @Field
  constructor: (@width, @height) ->
    @paper = Raphael($('#canvas')[0], @width * 40, @height * 40)
    @dotDistance = 30
    @cellSize = 6
    @players = []

  addPlayer:(p)->
    if @players.length <= 2
      @players.push(p)
      if @players.length == 2
        console.log("game-start")
        $(window).trigger('game-start')
    else
      $(window).trigger('game-error', ["Too many players on the field"])

  removePlayer:(player)->
    removeIndex = null
    $.each @players, (i, e)=>
      if e.id == player.id
        removeIndex = i 
    @players.splice(removeIndex, 1)
        
  draw: ->
    this.drawDots()

  redraw: ->
    @paper.clear()
    this.draw()

  drawDots: ->
    @field = {}
    for x in [1..@width]
      @field[x] = {}
      for y in [1..@height]

        if (x == 1 && y == 1) || (x == 1 && y == @height) || (x == @width && y ==1) || (x == @width && y == @height)

          cirlcle = @paper.circle(x * @dotDistance, y * @dotDistance, @cellSize)
          @field[x][y] = new CornerCell(cirlcle,[x,y], @paper)

        else if (y == 1 || y == @height) && (x == Math.round(@width / 2))
          cirlcle = @paper.circle(x * @dotDistance, y * @dotDistance, @cellSize)
          @field[x][y] = new InFrontOfGoalCell(cirlcle,[x,y], @paper)
        else
          cirlcle = @paper.circle(x * @dotDistance, y * @dotDistance, @cellSize)
          @field[x][y] = new Cell(cirlcle,[x,y], @paper)

  setPlayersGoalAreas:(p1, p2)->
    #TODO FIX positions
    x = Math.round @width/2
    y = 0
    
    @field[x][y] = new GoalCell(@paper.circle(x * @dotDistance, 5, @cellSize),[x,y], @paper)
    @field[x][y].setPlayer(p1)

    @field[x][@height + 1] = new GoalCell(@paper.circle(x * @dotDistance, ((@height + 1 ) * @dotDistance) - 5, @cellSize),[x, @height + 1], @paper)

    @field[x][@height + 1].setPlayer(p2)

  getPlayers:->
    @players

  setCurrentPlayer:(p) ->
    window.currentPlayer = p
    $(window).trigger 'set-current-player', [p]

  getCurrentPlayer:() ->
    window.currentPlayer

  isCurrentPlayer:(p) ->
    this.getCurrentPlayer().id == p.id

  whoIsNext:(lastSessionPlayer) ->
    ball = this.getBall()

    noLastSessionPlayer = this.getPlayers().filter (p) ->
      p != lastSessionPlayer

    #TODO make it only event who is next
    if this.canItBeMoved(ball)
      this.setCurrentPlayer(lastSessionPlayer)
    else
      this.setCurrentPlayer(noLastSessionPlayer[0])

  canItBeMoved:(ball)->
    ball.isOnEdge(@width, @height) || ball.sources.length > 1

  getCell:(x,y) ->
    @field[x][y]

  getBall: ->
    #find taken cell, which mean that ball is on it
    g = null
    for x in [1..@width]
      for y in [1..@height]
        g = @field[x][y] if @field[x][y].taken
    g

  placeBallOnTheField: ->
    x = Math.round @width/2
    y = Math.round @height/2

    c = @field[x][y]
    c.setTaken(x,y)

  notValidMove:(x,y) ->
    this.nexMoveIsOnTheSameBorder(x,y) || this.isPathTaken(x,y) || !this.isInRange(x,y)

  setBallPosition:(x,y,p)->
    return false if !this.isCurrentPlayer(p)
    return false if this.notValidMove(x,y)

    ball = this.getBall()
    ball.setNoTaken()
    this.drawPath([ball.x,ball.y],[x,y], p)
    this.getCell(x,y).setTaken(ball.x, ball.y)

    $(window).trigger('end-of-round', [this.getCurrentPlayer()])

  drawPath:(from, to, player) ->
    f = this.getRealCoord(from[0],from[1])
    t = this.getRealCoord(to[0],to[1])

    str="M#{f[0]},#{f[1]}L#{t[0]},#{t[1]}"
    p = @paper.path(str)
    p.toBack()
    p.attr('stroke',player.color)

  dPath:(from,to) ->
    f = this.getRealCoord(from[0],from[1])
    t = this.getRealCoord(to[0],to[1])
    p = @paper.path("M#{f[0]},#{f[1]}L#{t[0]},#{t[1]}")

  getRealCoord:(x,y) ->
    cell = this.getCell(x,y)
    [cell.circle.attrs.cx, cell.circle.attrs.cy]

  nexMoveIsOnTheSameBorder:(x,y)->
    ball = this.getBall()
    nextCell = this.getCell(x,y)

    return true if ball.isOnYBorder(@height) && nextCell.isOnYBorder(@height)
    return true if ball.isOnXBorder(@width) && nextCell.isOnXBorder(@width)
    return false

  isPathTaken:(x,y)->
    ball = this.getBall()
    @field[x][y].isPathTaken(ball.x,ball.y) || ball.isPathTaken(x,y)

  isInRange:(x,y)->
    ball = this.getBall()
    bros = [[-1, 0], [1, 0], [0, 1], [0, -1], [1,1], [-1, 1], [-1, -1], [1, -1]]
    for coord in bros
      temp_x = ball.x + coord[0]
      temp_y = ball.y + coord[1]

      return true if temp_x == x && temp_y == y

    false
