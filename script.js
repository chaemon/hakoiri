let lastTouchX = 0;
let lastTouchY = 0;
let fireworkP5;

function showCongratsMessage() {
  let msg = document.getElementById('congrats-message');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'congrats-message';
    msg.textContent = '🎉 Congratulations! 🎉';
    msg.style.position = 'fixed';
    msg.style.top = '15%';
    msg.style.left = '50%';
    msg.style.transform = 'translate(-50%, -50%)';
    msg.style.fontSize = '48px';
    msg.style.fontWeight = 'bold';
    msg.style.color = 'white';
    msg.style.textShadow = '2px 2px 4px #000';
    msg.style.zIndex = '9999';
    document.body.appendChild(msg);
  }
  msg.style.display = 'block';

  // 数秒後に自動で非表示にする
  setTimeout(() => {
    if (msg) msg.style.display = 'none';
  }, 5000);
}

const fireworkSketch = (p) => {
  let fireworks = [];
  let gravity;

  class Firework {
    constructor() {
      this.hu = p.random(255);
      this.firework = new Particle(p.random(p.width), p.height * 0.7, this.hu, true);

      this.exploded = false;
      this.particles = [];
    }

    done() {
      return this.exploded && this.particles.length === 0;
    }

    update() {
      if (!this.exploded) {
        this.firework.applyForce(gravity);
        this.firework.update();

        if (this.firework.vel.y >= 0) {
          this.exploded = true;
          this.explode();
        }
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].applyForce(gravity);
        this.particles[i].update();
        if (this.particles[i].done()) {
          this.particles.splice(i, 1);
        }
      }
    }

    explode() {
      for (let i = 0; i < 100; i++) {
        const pNew = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
        this.particles.push(pNew);
      }
    }

    show() {
      if (!this.exploded) {
        this.firework.show();
      }

      for (let particle of this.particles) {
        particle.show();
      }
    }
  }

  class Particle {
    constructor(x, y, hu, firework) {
      this.pos = p.createVector(x, y);
      this.firework = firework;
      this.lifespan = 255;
      this.hu = hu;
      this.acc = p.createVector(0, 0);

      if (this.firework) {
        this.vel = p.createVector(0, p.random(-12, -8));
      } else {
        this.vel = p5.Vector.random2D();
        this.vel.mult(p.random(2, 10));
      }
    }

    applyForce(force) {
      this.acc.add(force);
    }

    update() {
      if (!this.firework) {
        this.vel.mult(0.9);
        this.lifespan -= 4;
      }

      this.vel.add(this.acc);
      this.pos.add(this.vel);
      this.acc.mult(0);
    }

    done() {
      return this.lifespan < 0;
    }

    show() {
      p.colorMode(p.HSB);
      if (!this.firework) {
        p.strokeWeight(2);
        p.stroke(this.hu, 255, 255, this.lifespan);
      } else {
        p.strokeWeight(4);
        p.stroke(this.hu, 255, 255);
      }

      p.point(this.pos.x, this.pos.y);
    }
  }

  p.setup = () => {
    p.createCanvas(window.innerWidth, window.innerHeight);
    gravity = p.createVector(0, 0.2);
    p.colorMode(p.HSB);
    p.background(0);
  };

  p.draw = () => {
    p.colorMode(p.RGB);
    p.background(0, 0, 0, 25);
    if (p.random(1) < 0.05) {
      fireworks.push(new Firework());
    }

    for (let i = fireworks.length - 1; i >= 0; i--) {
      fireworks[i].update();
      fireworks[i].show();
      if (fireworks[i].done()) {
        fireworks.splice(i, 1);
      }
    }
  };
};

function startFireworks() {
  if (!fireworkP5) {
    const container = document.getElementById('fireworks-container');
    const message = document.getElementById('congrats-message');

    // 表示
    container.style.display = 'block';
    message.style.opacity = '1';

    // 花火描画先を container に
    fireworkP5 = new p5(fireworkSketch, container);

    // 数秒後に非表示
    setTimeout(() => {
      fireworkP5.remove();
      fireworkP5 = null;

      message.style.opacity = '0';
      setTimeout(() => {
        container.style.display = 'none';
      }, 1000);
    }, 5000);
  }
}


// ====================
// ユーティリティ
// ====================
function parseInputData(inputText) {
  const lines = inputText.trim().split('\n');
  const [H, W, M] = lines[0].trim().split(/\s+/).map(Number);

  const board = [];
  for (let i = 1; i <= H; i++) {
    board.push(lines[i].trim().split(/\s+/).map(Number));
  }

  // ★ b p の行
  const [goalPiece, leftMargin] = lines[H + 1].trim().split(/\s+/).map(Number);

  // ★ pieceNames
  const pieceNames = [''].concat(lines[H + 2].trim().split(/\s+/));
  return { H, W, M, board, pieceNames, goalPiece, leftMargin };
}

function parseOutputData(outputText, H) {
  const lines = outputText.trim().split('\n');
  const L = Number(lines[0]);
  let states = [], idx = 1;
  for (let i = 0; i < L; i++) {
    let state = [];
    for (let r = 0; r < H; r++) {
      state.push(lines[idx].trim().split(/\s+/).map(Number));
      idx++;
    }
    states.push(state);
  }
  return states;
}

function generateColors(numPieces) {
  let colors = ['white'];
  for (let i = 0; i < numPieces; i++) {
    colors.push(`hsl(${(i * 360) / numPieces},70%,60%)`);
  }
  return colors;
}

function getPieceBounds(board) {
  const pieces = {};
  board.flat().forEach(num => {
    if(num !== 0) pieces[num] = pieces[num] || {minRow: Infinity, maxRow: -1, minCol: Infinity, maxCol: -1};
  });
  board.forEach((row,r) => row.forEach((val,c) => {
    if(val !== 0) {
      pieces[val].minRow = Math.min(pieces[val].minRow,r);
      pieces[val].maxRow = Math.max(pieces[val].maxRow,r);
      pieces[val].minCol = Math.min(pieces[val].minCol,c);
      pieces[val].maxCol = Math.max(pieces[val].maxCol,c);
    }
  }));
  return pieces;
}

// ====================
// 描画
// ====================
function drawBoard(board,H,W,pieceNames,colors,ctx,goalPiece,leftMargin) {
  ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
  const cellSize = 50;

  // 各セル塗りつぶし
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      ctx.fillStyle = colors[board[r][c]];
      ctx.fillRect(c*cellSize, r*cellSize, cellSize, cellSize);
    }
  }

  // 細線（駒間の線）
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#666";
  ctx.beginPath();
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const val = board[r][c];
      if (r === 0 || board[r-1][c] !== val) ctx.moveTo(c*cellSize,r*cellSize), ctx.lineTo((c+1)*cellSize,r*cellSize);
      if (c === 0 || board[r][c-1] !== val) ctx.moveTo(c*cellSize,r*cellSize), ctx.lineTo(c*cellSize,(r+1)*cellSize);
      if (r === H-1 || board[r+1][c] !== val) ctx.moveTo(c*cellSize,(r+1)*cellSize), ctx.lineTo((c+1)*cellSize,(r+1)*cellSize);
      if (c === W-1 || board[r][c+1] !== val) ctx.moveTo((c+1)*cellSize,r*cellSize), ctx.lineTo((c+1)*cellSize,(r+1)*cellSize);
    }
  }
  ctx.stroke();

  // ★ 出口のあるゴール部分だけ下枠を消す
  const bounds = getPieceBounds(board)[goalPiece];
  const goalWidth = (bounds.maxCol - bounds.minCol + 1);
  const exitStartX = (leftMargin) * cellSize;
  const exitEndX = (leftMargin + goalWidth) * cellSize;

  ctx.lineWidth = 6;
  ctx.strokeStyle = "#333";
  ctx.beginPath();
  // 上枠
  ctx.moveTo(0,0); ctx.lineTo(W*cellSize,0);
  // 左枠
  ctx.moveTo(0,0); ctx.lineTo(0,H*cellSize);
  // 右枠
  ctx.moveTo(W*cellSize,0); ctx.lineTo(W*cellSize,H*cellSize);
  // ★ 下枠 (出口部分は描かない)
  ctx.moveTo(0,H*cellSize); ctx.lineTo(exitStartX,H*cellSize);  // 出口左
  ctx.moveTo(exitEndX,H*cellSize); ctx.lineTo(W*cellSize,H*cellSize); // 出口右
  ctx.stroke();

  // 駒名
  const pieces = getPieceBounds(board);
  ctx.fillStyle = "#222";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let num in pieces) {
    const p = pieces[num];
    const cx = (p.minCol + p.maxCol + 1) / 2 * cellSize;
    const cy = (p.minRow + p.maxRow + 1) / 2 * cellSize;

    // goalPieceだけ太字にする
    if (Number(num) === goalPiece) {
      ctx.font = "bold 30px Arial";
    } else {
      ctx.font = "normal 18px Arial";
    }

    ctx.fillText(pieceNames[num], cx, cy);
  }
}

// ====================
// 移動
// ====================
// （以下、movePiece, canMove などはそのまま）

function canMove(board,pieceNum,dir,H,W){
  let pos=[];
  for(let r=0;r<H;r++){for(let c=0;c<W;c++){if(board[r][c]===pieceNum)pos.push({r,c});}}
  return pos.every(p=>{
    let nr=p.r+dir.dy, nc=p.c+dir.dx;
    return (nr>=0 && nr<H && nc>=0 && nc<W && (board[nr][nc]===0||board[nr][nc]===pieceNum));
  });
}
function movePiece(board,pieceNum,dir,H,W){
  if(!canMove(board,pieceNum,dir,H,W)) return false;
  let pos=[];
  for(let r=0;r<H;r++){for(let c=0;c<W;c++){if(board[r][c]===pieceNum)pos.push({r,c});}}
  pos.forEach(p=>board[p.r][p.c]=0);
  pos.forEach(p=>board[p.r+dir.dy][p.c+dir.dx]=pieceNum);
  return true;
}

// ====================
// アニメーション、データセット読み込み、イベントリスナー
// ====================
// （以下はそのままです。長いので割愛）

// この drawBoard の呼び出しに goalPiece, leftMargin を渡すように、
// initPlayMode やアニメーション部分も修正してください：


// ====================
// アニメーション
// ====================
let timerId=null;
let animationSpeed = 5;

function animate(states,H,W,pieceNames,colors,ctx,turnDiv,undoBtn){
  if(timerId) {
    clearTimeout(timerId);
    timerId=null;
  }
  let idx=0;
  undoBtn.disabled = true;
  enableDrag(false);
  isPlayMode = false;

  function step(){
    if(idx>=states.length){
      clearTimeout(timerId); timerId=null;
      enableDrag(true); undoBtn.disabled=false; isPlayMode=true;
          // 終了判定を追加
      if (isGoal(currentBoard, goalPiece, leftMargin)) {
        showCongratsMessage();
        startFireworks();
      }
      return;
    }
    drawBoard(states[idx],H,W,pieceNames,colors,ctx,goalPiece,leftMargin);
    turnDiv.textContent=`ターン: ${idx}`;
    idx++;
    timerId=setTimeout(step,1100-animationSpeed*100);
  }
  step();
}

// ====================
// データセット読み込み
// ====================
function loadDataSet(num) {
  const basePath = './data/';
  fetch(`${basePath}in_${num}.txt?t=${Date.now()}`)
    .then(res => { if(!res.ok) throw new Error(`in_${num}.txt not found`); return res.text(); })
    .then(txt => { inputTextArea.value = txt; initPlayMode(txt); })
    .catch(err => alert(`in_${num}.txt の読み込みに失敗: ${err}`));
  
  fetch(`${basePath}out_${num}.txt?t=${Date.now()}`)
    .then(res => { if(!res.ok) throw new Error(`out_${num}.txt not found`); return res.text(); })
    .then(txt => { outputTextArea.value = txt; })
    .catch(err => alert(`out_${num}.txt の読み込みに失敗: ${err}`));
}

// ====================
// メイン
// ====================
let H,W,M,pieceNames,colors,currentBoard;
let isPlayMode=true, dragStart=null, draggedPiece=0, turn=0, history=[];
const canvas=document.getElementById('board'), ctx=canvas.getContext('2d'), turnDiv=document.getElementById('turn');
const inputTextArea=document.getElementById('inputData'), outputTextArea=document.getElementById('outputData');
const undoBtn=document.getElementById('undoBtn');
const speedSlider=document.getElementById('speedSlider');

// Undo
function undo() {
  if(!isPlayMode) return;
  if(history.length>0){
    currentBoard=history.pop();
    turn--;
    drawBoard(currentBoard,H,W,pieceNames,colors,ctx,goalPiece,leftMargin);
    turnDiv.textContent=`ターン: ${turn}`;
  }
}

// Drag & drop
function getPieceNumAtPos(board,x,y){
  let cellSize=50;
  let c=Math.floor(x/cellSize), r=Math.floor(y/cellSize);
  if(r<0||r>=board.length||c<0||c>=board[0].length) return 0;
  return board[r][c];
}
function onMouseDown(e){
  if(!isPlayMode) return;
  let rect=canvas.getBoundingClientRect();
  dragStart={ x:e.clientX-rect.left, y:e.clientY-rect.top };
  draggedPiece=getPieceNumAtPos(currentBoard,dragStart.x,dragStart.y);
}
function onMouseUp(e) {
  if(!isPlayMode||!dragStart||draggedPiece===0) { dragStart=null; draggedPiece=0; return; }
  let rect=canvas.getBoundingClientRect();
  let dx=e.clientX-rect.left-dragStart.x;
  let dy=e.clientY-rect.top-dragStart.y;

  // クリックと見なす
  if(Math.abs(dx)<10&&Math.abs(dy)<10){
    // 可能な方向をリストアップ
    const directions = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
    ];
    const movableDirs = directions.filter(dir => canMove(currentBoard, draggedPiece, dir, H, W));
    if(movableDirs.length === 1) {
      // 唯一可能な方向へ動かす
      const dir = movableDirs[0];
      history.push(JSON.parse(JSON.stringify(currentBoard)));
      movePiece(currentBoard, draggedPiece, dir, H, W);
      turn++;
      drawBoard(currentBoard,H,W,pieceNames,colors,ctx,goalPiece,leftMargin);
      turnDiv.textContent=`ターン: ${turn}`;
    }
    dragStart=null; draggedPiece=0;
    return;
  }

  // ▼ それ以降はドラッグ用の処理（現状のまま）▼
  let dir={dx:0,dy:0};
  if(Math.abs(dx)>Math.abs(dy)) dir.dx=dx>0?1:-1; else dir.dy=dy>0?1:-1;
  history.push(JSON.parse(JSON.stringify(currentBoard)));
  if(movePiece(currentBoard, draggedPiece, dir, H, W)){
    turn++;
    drawBoard(currentBoard,H,W,pieceNames,colors,ctx,goalPiece,leftMargin);
    turnDiv.textContent=`ターン: ${turn}`;
  }
  if (isGoal(currentBoard, goalPiece, leftMargin)) {
    showCongratsMessage();
    startFireworks();
  }
  dragStart=null; draggedPiece=0;
}
function onTouchStart(e) {
  if(!isPlayMode) return;
  let rect = canvas.getBoundingClientRect();
  let touch = e.touches[0];
  dragStart = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  draggedPiece = getPieceNumAtPos(currentBoard, dragStart.x, dragStart.y);
  lastTouchX = dragStart.x;
  lastTouchY = dragStart.y;
  e.preventDefault(); // ★ スクロール防止
}

function onTouchMove(e) {
  if(!isPlayMode || !dragStart) return;
  let rect = canvas.getBoundingClientRect();
  let touch = e.touches[0];
  lastTouchX = touch.clientX - rect.left;
  lastTouchY = touch.clientY - rect.top;
  e.preventDefault();
}

function onTouchEnd(e) {
  if(!isPlayMode || !dragStart || draggedPiece===0) { dragStart=null; draggedPiece=0; return; }
  let dx = lastTouchX - dragStart.x;
  let dy = lastTouchY - dragStart.y;
  // （クリック／ドラッグ動作はこれまでどおり）
  if(Math.abs(dx)<10 && Math.abs(dy)<10) {
    // 唯一方向がある場合のみ動かす
    const directions = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
    const movableDirs = directions.filter(dir => canMove(currentBoard, draggedPiece, dir, H, W));
    if(movableDirs.length === 1) {
      const dir = movableDirs[0];
      history.push(JSON.parse(JSON.stringify(currentBoard)));
      movePiece(currentBoard, draggedPiece, dir, H, W);
      turn++;
      drawBoard(currentBoard,H,W,pieceNames,colors,ctx,goalPiece,leftMargin);
      turnDiv.textContent=`ターン: ${turn}`;
    }
  } else {
    let dir={dx:0,dy:0};
    if(Math.abs(dx)>Math.abs(dy)) dir.dx=dx>0?1:-1; else dir.dy=dy>0?1:-1;
    history.push(JSON.parse(JSON.stringify(currentBoard)));
    if(movePiece(currentBoard, draggedPiece, dir, H, W)){
      turn++;
      drawBoard(currentBoard,H,W,pieceNames,colors,ctx,goalPiece,leftMargin);
      turnDiv.textContent=`ターン: ${turn}`;
    }
  }
  if (isGoal(currentBoard, goalPiece, leftMargin)) {
    showCongratsMessage();
    startFireworks();
  }
  dragStart=null; draggedPiece=0;
  e.preventDefault();
}

function enableDrag(flag){
  if(flag){
    canvas.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false }); 
    canvas.addEventListener('touchmove', onTouchMove, { passive: false }); 
    document.addEventListener('touchend', onTouchEnd, { passive: false }); 
    canvas.style.cursor='pointer';
  } else {
    canvas.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('touchstart', onTouchStart); 
    canvas.removeEventListener('touchmove', onTouchMove); 
    document.removeEventListener('touchend', onTouchEnd); 
    canvas.style.cursor='default';
  }
}

// 初期化
function initPlayMode(inputText){
  if(timerId) {clearTimeout(timerId); timerId=null;}
  isPlayMode=true;
  turn=0;
  history=[];
  let data=parseInputData(inputText);
  H=data.H; W=data.W; M=data.M; pieceNames=data.pieceNames;
  goalPiece=data.goalPiece; leftMargin=data.leftMargin;
  colors=generateColors(M);
  currentBoard=JSON.parse(JSON.stringify(data.board));
  canvas.width=W*50; canvas.height=H*50;
  drawBoard(currentBoard,H,W,pieceNames,colors,ctx,goalPiece,leftMargin);
  turnDiv.textContent=`ターン: ${turn}`;
  enableDrag(true);
}

// イベント登録
document.getElementById('loadBtn').onclick=()=>initPlayMode(inputTextArea.value);
document.getElementById('playBtn').onclick=()=>{
  if(!outputTextArea.value){
    alert('出力データが空です'); return;
  }
  let states;
  try { states=parseOutputData(outputTextArea.value,H); }
  catch(e){ alert('出力データの形式が正しくありません'); return; }
  animate(states,H,W,pieceNames,colors,ctx,turnDiv,undoBtn);
};
undoBtn.onclick=undo;

speedSlider.oninput=()=> {
  animationSpeed = Number(speedSlider.value);
};

// ====================
// データセットボタン生成
// ====================
function generateDatasetButtons(maxNum = 20) {
  const container = document.getElementById('dataset-buttons');
  container.querySelectorAll('button').forEach(btn => btn.remove());

  let promises = [];
  for (let i = 0; i < maxNum; i++) {
    let p = fetch(`./data/in_${i}.txt?t=${Date.now()}, { method: 'HEAD' }`)
      .then(res => res.ok ? i : null)
      .catch(() => null);
    promises.push(p);
  }

  Promise.all(promises).then(results => {
    const validIndices = results.filter(idx => idx !== null).sort((a,b)=>a-b);
    validIndices.forEach(num => {
      const btn = document.createElement('button');
      btn.textContent = num;
      btn.classList.add('dataset-button');
      btn.onclick = () => {
        document.querySelectorAll('.dataset-button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadDataSet(num);
      };
      container.appendChild(btn);
    });

    if (validIndices.includes(0)) {
      loadDataSet(0); 
      const zeroButton = Array.from(container.querySelectorAll('.dataset-button')).find(b => b.textContent==='0');
      if(zeroButton) zeroButton.classList.add('active');
    }
  });
}

function isGoal(board, goalPiece, leftMargin) {
  const bounds = getPieceBounds(board)[goalPiece];
  if (!bounds) return false;

  const atBottom = bounds.maxRow === board.length - 1;
  const alignedToExit = bounds.minCol === leftMargin;

  return atBottom && alignedToExit;
}
// データセットボタン生成開始
generateDatasetButtons(20);

window.addEventListener('load', () => {
});