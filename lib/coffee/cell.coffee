class @Cell
  constructor: (@circle, coord, @paper, @taken=false) ->
    @sources = []
    @circle.attr('stroke', '')
    @circle.attr('fill', '#e7e7e7')
    @circle.attr('fill-opacity', 0.01)
    @x = coord[0]
    @y = coord[1]

    this.bindEvents()

  bindEvents:() ->
    @circle[0].onclick = =>
      p = window.selfPlayer
      console.log(p.id + ' tries place a ball on me')
      $(window).trigger('cell-move-on',[@x,@y,p])

  setNoTaken:()->
    @taken = false
    if @ballImage
      @ballImage.remove()
      @circle.attr('fill', '#fff')
      @circle.attr('fill-opacity', 0.6)

  setTaken: (x, y) ->
    this.setSourcePath(x, y)
    @taken = true
    # TODO handle coord better
    coord = this.getPaperCoord()
    @ballImage = @paper.image('/public/ball.png', coord[0] - 8, coord[1] - 8, 15, 15)

  isNotClear: ->
    @sources.length > 0

  setSourcePath:(x,y)->
    @sources.push([x,y])

  getPaperCoord: ->
    [@circle.attrs.cx, @circle.attrs.cy]

  isPathTaken:(x,y)->
    flag=false
    for e in @sources
      flag = true if e[0] == x && e[1] == y
    flag

  isOnXBorder:(width) ->
    @x == 1 || @x == width

  isOnYBorder:(height) ->
    @y == 1 || @y == height

  isOnBorder:(width, height) ->
    this.isOnXBorder(width) || this.isOnYBorder(height)

  isOnEdge:(width, height) ->
    @x == 1 || @x == width || @y == 1 || @y == height


# NoopObject - do nothing
class @CornerCell extends Cell

  constructor: (@circle, coord, @paper, @taken=false) ->
    @circle.attr('stroke','')

# NoopObject - do nothing
class @InFrontOfGoalCell extends Cell

  isOnEdge:(widht, height) ->
    false

  isOnXBorder:(height) ->
    false

  isOnYBorder:(height) ->
    false

class @GoalCell extends Cell

  setPlayer:(player) ->
    @player = player
    @playerName = player.name
    @circle.attr('fill',player.color)
    @circle.attr('fill-opacity', 1)

  setTaken:(x,y) ->
    super(x,y)
    console.log "goal, scoreboard and reload"
    $(window).trigger('goal', [this])
