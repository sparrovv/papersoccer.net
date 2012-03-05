class @Player
  constructor: (@id, @name, @color) ->

class UserConsole
  constructor:(debug = true) ->
    @console = console

  info:(txt) ->
    @console.log(txt)

class ScoreBoard
  constructor: ->
    @scoreboard = $('#scoreboard')

  playerContainer:(player)->
    $('.wrapper').find('#p'+player.id)

  playerScoreboard:(player) ->
    @scoreboard.find(".p"+player.id)

  goalImage:(player) ->
    $('.wrapper').find('img.p'+player.id)


  addPlayer:(player)->
    this.playerContainer(player).find('.title').text(player.name)
    this.playerContainer(player).find('.title').css('color', player.color)
    this.scoreboard.find('.p'+player.id).css('color', player.color)
    this.playerScoreboard(player).css('color', player.color)
    this.playerScoreboard(player).find('.player-name').text(player.name)
    this.playerScoreboard(player).find('.goals').text('0')

  removePlayer:(player)->
    p = this.playerContainer(player)
    p.find('.title').text('THERE IS NO')
    this.playerScoreboard(player).css('color', '')
    this.playerScoreboard(player).find('.goals').text('-')
    this.playerScoreboard(player).find('.player-name').text('NO PLAYER')

  updateScoreBoard:(player) ->
    goals = this.scoreboard.find('.p'+player.id+' .goals')
    tempScore = parseInt(goals.text()) + 1
    goals.text(tempScore)

  nextMove:(player) ->
    $('.wrapper .current-move').text('')
    this.playerContainer(player).find('.current-move').text("has ball")

  setupAttackDirection: (player) ->
    if player.id == 1
      $('#attack').text('V')
    else
      $('#attack').text('/\\')

  animateGoal:(player)->
    img = this.goalImage(player)
    img.show()
    setTimeout (-> img.hide()) , 2000

class @Game
  constructor:(id, socket) ->
    @id = id
    @socket = socket
    @p1Color = '#0089ff'
    @p2Color = '#ff7f00'

    @field = ''
    @scoreBoard = new ScoreBoard()
    @userConsole = new UserConsole()

    this.setupField()
    this.assignPlayers()

    this.playerEvents()
    this.windowEvents()
    this.socketEvents()


  assignPlayers: ->
    $.getJSON "/games/#{@id}", (data)=>
      return if window.selfPlayer

      if data && data.players.length == 0
        console.log "there are no playa for this game"
        window.selfPlayer = new Player(1, "player1", @p1Color)
        this.addAndEmitPlayer(window.selfPlayer)

      else if data && data.players[0] && data.players.length == 1
        console.log "there is one player"
        p1 = data.players[0]

        window.remotePlayer = new Player(p1.id, p1.name, p1.color)
        @field.addPlayer(window.remotePlayer)
        @scoreBoard.addPlayer(window.remotePlayer)

        if p1.id == 1
          window.selfPlayer = new Player(2, "Player2", @p2Color)
        else
          window.selfPlayer = new Player(1, "Player1", @p1Color)

        this.addAndEmitPlayer(window.selfPlayer)

      else 
        @userConsole.info("there are too many players")
        console.log("close board")

  addAndEmitPlayer:(player) ->
    @field.addPlayer(player)
    @scoreBoard.addPlayer(player)
    @socket.emit "join-to-match", {id:@id, player: {id: player.id, name:player.name, color: player.color}}

  setupField: ->
    @field = new Field(9, 11)
    @field.draw()
    @field.placeBallOnTheField()
    @field

  getPlayerById:(id) ->
    if selfPlayer.id == id
      selfPlayer
    else
      remotePlayer

  setGoalAreas: ->
    @field.setPlayersGoalAreas(this.getPlayerById(1), this.getPlayerById(2))
    if selfPlayer.id == 1
      @field.setCurrentPlayer(selfPlayer)
    else
      @field.setCurrentPlayer(remotePlayer)

  reload: ->
    # TODO figure out how to separate levave game from reload after goal
    @field.redraw()
    @field.placeBallOnTheField()
    this.setGoalAreas()
    console.log "reloading"
  
  leaveGame: ->
    @socket.emit 'leave-game', {id: @id, player: window.selfPlayer.id}
    @field.redraw()

  playerEvents: ->
    $('#reload').click (e)=>
      e.stopPropagation()
      this.reload()
      false

    $('#exit-game').click (e)=>
      e.stopPropagation()
      this.leaveGame()
      false

  windowEvents: ->

    $(window).bind 'game-start', (e)=>
      this.setGoalAreas()
      @scoreBoard.setupAttackDirection(selfPlayer)

    $(window).bind 'cell-move-on',(e, x, y, p) =>
      @socket.emit 'cell-move-on', {id: @id, x:x, y:y, player:p}

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

  socketEvents: ->
    @socket.on 'cell-move-on-'+@id, (data) =>
      @field.setBallPosition(data.x,data.y,data.player)

    @socket.on "join-to-match-#{@id}", (player)=>
      console.log(player.name + "join game")
      if window.selfPlayer.id != player.id
        @userConsole.info(player.name + "join to the game")
        window.remotePlayer = new Player(player.id, player.name, player.color)
        @field.addPlayer(window.remotePlayer)
        @scoreBoard.addPlayer(player)

    @socket.on "player-left-game", (player)=>
      console.log("remote player left game")
      @scoreBoard.removePlayer(player)
      @field.removePlayer(player)
      window.remotePlayer = null
      @field.redraw()
      @field.placeBallOnTheField()

