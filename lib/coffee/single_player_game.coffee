class @AIPlayer extends Player
  constructor: (@id, @name, @color) ->
    @name = "Computer"
    @bros = [[0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [0, 1], [1, 1], [-1, 1]]
    @rightDirections =[ [0, -1], [-1, -1], [1, -1] ]


  createMap:(cell) ->

  localizeBroCells:(cell, field) ->
    # checking bros
    validBros = []
    for bro in @bros
      try
        x = cell.x + bro[0]
        y = cell.y + bro[1]

        c = field.getCell(x,y)
        if c
          validBros.push(c)
      catch error
        c = false

    validBros



  # ORDER:
  # valid Bros
  # If it can be bounced and go in right direction
  # Get In right direction
  # Bounced and right dir

  canItBeBounced:(broCells, field) ->
    ball = field.getBall()
    canBeBouncedCells = []

    for broCell in broCells
      console.log broCell

      if broCell.isOnBorder(field.width, field.height) || broCell.isNotClear()
        if !field.notValidMove(broCell.x, broCell.y)
          canBeBouncedCells.push(broCell)

    canBeBouncedCells

  filterByDirection:(cell, cells) ->
    cellsWithGoodDir = []

    for c in cells
      for b in @rightDirections
        x = cell.x + b[0]
        y = cell.y + b[1]

        if c.x == x && c.y == y
          cellsWithGoodDir.push(c)

    cellsWithGoodDir


  getGoalDir:(cells, field) ->
    ball = field.getBall()
    goal = [5, 0]

    rightDir = []
    if ball.x > goal[0]
      for cell in cells
        if cell.x < ball.x
          rightDir.push(cell)

    if ball.x < goal[0]
      for cell in cells
        if cell.x > ball.x
          rightDir.push(cell)

    if ball.x == goal[0]
      for cell in cells
        if cell.x == ball.x
          rightDir.push(cell)

    rightDir


  makeMove:(field) ->
    ball = field.getBall()
    bros = this.localizeBroCells(ball, field)
    goodDirections = this.filterByDirection(ball, bros)
    canBeBouncedCells = this.canItBeBounced(goodDirections, field)

    cellsToGo = { bounced: [], normal:[] }

    if canBeBouncedCells.length > 0
      for cell in canBeBouncedCells
        if !field.notValidMove(cell.x, cell.y)
          cellsToGo.bounced.push(cell)

    for cell in goodDirections
      if !field.notValidMove(cell.x, cell.y)
        cellsToGo.normal.push(cell)

    if cellsToGo.bounced.length > 0 || cellsToGo.normal.length > 0
      # TODO find smart way to keeping bouncing and going forward!
      #
      #cell = this.getGoalDir(cellsToGo.bounced, field)[0]
      cell = cellsToGo.bounced[0]

      if cell
        $(window).trigger('cell-move-on',[cell.x, cell.y, this])
        return false

    this.makeMoveOld(field)

  makeMoveOld:(field) ->
    ball = field.getBall()
    bros = [[0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0], [0, 1], [1, 1], [-1, 1]]

    # checking bros
    for bro in bros
      try
        x = ball.x + bro[0]
        y = ball.y + bro[1]

        cell = field.getCell(x,y)
      catch error
        cell = false

      if cell
        if !field.notValidMove(cell.x, cell.y)
          console.log(x,y)

          $(window).trigger('cell-move-on',[cell.x, cell.y, this])
          break


class @SinglePlayerGame extends Game
  constructor:() ->
    @p1Color = '#0089ff'
    @p2Color = '#ff7f00'

    @field = ''
    @scoreBoard = new ScoreBoard()
    @userConsole = new UserConsole()

    this.windowEvents()
    this.setupField()
    this.assignPlayers()
    this.playerEvents()

  assignPlayers: ->
    window.selfPlayer = new Player(1, "Player1", @p1Color)
    @field.addPlayer(window.selfPlayer)
    @scoreBoard.addPlayer(selfPlayer)
    window.remotePlayer = new AIPlayer(2, "Player2", @p2Color)
    @field.addPlayer(window.remotePlayer)
    @scoreBoard.addPlayer(remotePlayer)

  setGoalAreas: ->
    @field.setPlayersGoalAreas(this.getPlayerById(1), this.getPlayerById(2))
    if selfPlayer.id == 1
      @field.setCurrentPlayer(selfPlayer)
    else
      @field.setCurrentPlayer(remotePlayer)

  windowEvents: ->

    $(window).bind 'game-start', (e)=>
      this.setGoalAreas()
      @scoreBoard.setupAttackDirection(selfPlayer)

    $(window).bind 'cell-move-on',(e, x, y, player) =>
      @field.setBallPosition(x,y,player)

    $(window).bind 'end-of-round',(e,p) =>
      console.log("end of round")
      @field.whoIsNext(p)

    $(window).bind 'goal', (e, cell)=>
      playerGoal = if cell.player == window.selfPlayer
        window.remotePlayer
      else
        window.selfPlayer 

      @scoreBoard.updateScoreBoard(playerGoal)
      @scoreBoard.animateGoal(playerGoal)

      this.reload()

    $(window).bind 'set-current-player', (e, player)=>
      @scoreBoard.nextMove(player)

      if player == window.remotePlayer
        f = @field

        setTimeout ( -> window.remotePlayer.makeMove(f)), 300
