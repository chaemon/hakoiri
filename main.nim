when defined SecondCompile:
  const DO_CHECK = false;const DEBUG = false
else:
  const DO_CHECK = true;const DEBUG = true
const
  USE_DEFAULT_TABLE = true

include lib/header/chaemon_header
# 同じ形のものは(i, j)の辞書順になってる
import os

type Board = seq[seq[int8]]

var dir = [(1, 0), (-1, 0), (0, 1), (0, -1)]

solveProc solve():
  let H, W, M = nextInt()
  var
    initA = Seq[H, W: int8(nextInt() - 1)]
    dsti = nextInt() - 1
    dstX, dstY = nextInt()
  proc getPos(a: Board):seq[tuple[x, y:int]] =
    result = Seq[M: (x: -1, y: -1)]
    for i in H:
      for j in W:
        let t = a[i][j]
        if t == -1: continue
        if result[t].x == -1:
          result[t] = (i, j)
  var
    posL = getPos(initA)
    posR = Seq[M: (x: -1, y: -1)]
  for i in H:
    for j in W:
      let t = initA[i][j]
      if t == -1: continue
      posR[t] = (i, j)
  var
    size = Seq[M: tuple[dX, dY:int]]
    sizeTB = initTable[(int, int), seq[int]]()
  for i in M:
    let
      dX = posR[i].x - posL[i].x + 1
      dY = posR[i].y - posL[i].y + 1
    size[i] = (dX, dY)
    sizeTB[size[i]].add i # 寸法 => インデックス
  # インデックス順にソートする
  for k, v in sizeTB.mpairs:
    v.sort
  proc normalize(a:Board):Board =
    result = a
    let posL = a.getPos()
    var map = (0 ..< M).toSeq
    for k, v in sizeTB:
      # vの順序
      var p: seq[tuple[posL: (int, int), i:int]]
      for i in v:
        p.add (posL[i], i)
      p.sort
      for i in v.len:
        map[p[i].i] = v[i]
    for i in H:
      for j in W:
        if result[i][j] == -1: continue
        result[i][j] = map[result[i][j]].int8
  proc move(a:Board, posL:seq[tuple[x, y:int]], i, d:int):Option[Board] =
    let (dX, dY) = size[i]
    # 下方向に動かす: x += 1
    proc moveVertical(d:int):Option[Board] =
      var
        ok = true
        x1, x0:int
      if d == 1:
        x0 = posL[i].x
        x1 = posL[i].x + dX
      elif d == -1:
        x0 = posL[i].x + dX - 1
        x1 = posL[i].x - 1
      if x1 notin 0 ..< H: ok = false
      else:
        for y in dY:
          if a[x1][posL[i].y + y] != -1: ok = false

      if ok:
        var a2 = a
        for y in dY:
          swap a2[x0][posL[i].y + y], a2[x1][posL[i].y + y]
        return a2.some
      else:
        return Board.none
    # 左右方向に動かす
    proc moveHorizontal(d:int):Option[Board] =
      var
        ok = true
        y1, y0:int
      if d == 1:
        y0 = posL[i].y
        y1 = posL[i].y + dY
      elif d == -1:
        y0 = posL[i].y + dY - 1
        y1 = posL[i].y - 1
      if y1 notin 0 ..< W: ok = false
      else:
        for x in dX:
          if a[posL[i].x + x][y1] != -1: ok = false
      if ok:
        var a2 = a
        for x in dX:
          swap a2[posL[i].x + x][y0], a2[posL[i].x + x][y1]
        return a2.some
      else:
        return Board.none
    case d:
      of 0:
        return moveVertical(1)
      of 1:
        return moveVertical(-1)
      of 2:
        return moveHorizontal(1)
      of 3:
        return moveHorizontal(-1)
      else:
        doAssert false

  proc toStr(a:Board):string =
    var r:seq[string]
    for i in H:
      r.add a[i].mapIt(it + 1).join(" ")
    return r.join("\n")

  proc write(a:Board) =
    echo a.toStr()
  proc revDir(X, Y, d:int):tuple[X, Y, d:int] =
    let
      X2 = X + dir[d][0]
      Y2 = Y + dir[d][1]
      d2 = if d in 0 .. 1: 1 - d else: 5 - d
    return (X2, Y2, d2)

  var
    dist = initTable[Board, tuple[dist, x, y, dir:int]]()
    q = initDeque[Board]()
    #prev = initTable[Board, tuple[prev: Board, x, y, d:int]]() # (x, y): 動かす座標, d: 方向
    ans: Board
  dist[initA] = (0, -1, -1, -1)
  q.addLast initA
  var ct = 0

  while q.len > 0:
    let
      a = q.popFirst()
      posL = getPos(a)
      da = dist[a].dist
    if posL[dsti] == (dstX, dstY):
      ans = a
      break
    ct.inc
    if ct mod 1000 == 0:
      stderr.writeLine ct, " ", da, " ", q.len, " ", dist.len
    for i in M:
      for d in 4:
        let
          (pX, pY) = posL[i]
          p = move(a, posL, i, d)
        if not p.isSome: continue
        var a2 = normalize(p.get())
        if a2 notin dist or dist[a2].dist > da + 1:
          let (pX2, pY2, d2) = revDir(pX, pY, d)
          dist[a2] = (da + 1, pX2, pY2, d2)
          #prev[a2] = (a, pX, pY, d)
          q.addLast(a2)
  var turn: seq[tuple[x, y, d:int]]
  block:
    var
      a = ans
      ct = 0
    while a != initA:
      ct.inc
      stderr.writeLine a.toStr
      let (ds, pX, pY, d) = dist[a]
      let
        i = a[pX][pY]
        posL = getPos(a)
      let p = move(a, posL, i, d)
      let a2 = p.get().normalize()
      #doAssert a2 == prev[a].prev
      let (pX2, pY2, d2) = revDir(pX, pY, d)
      #doAssert pX2 == prev[a].x
      #doAssert pY2 == prev[a].y
      turn.add (pX2, pY2, d2)
      a = a2
      #if ct == 20: quit(0)
    turn.reverse
  block:
    echo turn.len + 1
    var a = initA
    for (x, y, d) in turn:
      echo a.toStr
      let
        posL = getPos(a)
        i = a[x][y]
        p = move(a, posL, i, d)
      doAssert p.isSome
      a = p.get
    echo a.toStr

  discard

when not defined(DO_TEST):
  solve()
else:
  discard

