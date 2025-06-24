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
  const pieceNames = [''].concat(lines[H + 2].trim().split(/\s+/));
  return { H, W, M, board, pieceNames };
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
function drawBoard(board,H,W,pieceNames,colors,ctx) {
  ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
  const cellSize = 50;

  // 各セル塗りつぶし
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      ctx.fillStyle = colors[board[r][c]];
      ctx.fillRect(c*cellSize, r*cellSize, cellSize, cellSize);
    }
  }

  // ★ 駒間の細い線
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#666";
  ctx.beginPath();
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const val = board[r][c];
      if (r === 0 || board[r-1][c] !== val) {
        ctx.moveTo(c*cellSize, r*cellSize); ctx.lineTo((c+1)*cellSize, r*cellSize);
      }
      if (c === 0 || board[r][c-1] !== val) {
        ctx.moveTo(c*cellSize, r*cellSize); ctx.lineTo(c*cellSize, (r+1)*cellSize);
      }
      if (r === H-1 || board[r+1][c] !== val) {
        ctx.moveTo(c*cellSize, (r+1)*cellSize); ctx.lineTo((c+1)*cellSize, (r+1)*cellSize);
      }
      if (c === W-1 || board[r][c+1] !== val) {
        ctx.moveTo((c+1)*cellSize, r*cellSize); ctx.lineTo((c+1)*cellSize, (r+1)*cellSize);
      }
    }
  }
  ctx.stroke();

  // ★ 太い外枠（出口部分は除外する） 
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#333";
  ctx.beginPath();
  // 上
  ctx.moveTo(0,0); ctx.lineTo(W*cellSize,0);
  // 左
  ctx.moveTo(0,0); ctx.lineTo(0,H*cellSize);
  // 右
  ctx.moveTo(W*cellSize,0); ctx.lineTo(W*cellSize,H*cellSize);
  // ★ 下 (出口が右下2マス分の場合)
  ctx.moveTo(0,H*cellSize); ctx.lineTo((W-2)*cellSize,H*cellSize); // 出口手前までだけ
  ctx.moveTo(W*cellSize,H*cellSize); ctx.lineTo((W)*cellSize,H*cellSize); // ★ 右から2マス分だけ描かない
  ctx.stroke();

  // 駒名ラベル
  const pieces = getPieceBounds(board);
  ctx.fillStyle="#222"; ctx.font="bold 18px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
  for (let num in pieces) {
    const p = pieces[num];
    const cx = (p.minCol+p.maxCol+1)/2*cellSize;
    const cy = (p.minRow+p.maxRow+1)/2*cellSize;
    ctx.fillText(pieceNames[num], cx, cy);
  }
}

// ====================
// 移動
// ====================
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
      return;
    }
    drawBoard(states[idx],H,W,pieceNames,colors,ctx);
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
    drawBoard(currentBoard,H,W,pieceNames,colors,ctx);
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
      drawBoard(currentBoard,H,W,pieceNames,colors,ctx);
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
    drawBoard(currentBoard,H,W,pieceNames,colors,ctx);
    turnDiv.textContent=`ターン: ${turn}`;
  }
  dragStart=null; draggedPiece=0;
}

function onTouchStart(e) {
  if(!isPlayMode) return;
  let rect = canvas.getBoundingClientRect();
  let touch = e.touches[0]; // 最初の指
  dragStart = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  draggedPiece = getPieceNumAtPos(currentBoard, dragStart.x, dragStart.y);
}

function onTouchEnd(e) {
  if(!isPlayMode || !dragStart || draggedPiece===0) { dragStart=null; draggedPiece=0; return; }
  let rect = canvas.getBoundingClientRect();
  // touchend には座標がないので touchmove を使いたい場合もありますが、
  // ここでは単純にスワイプ方向だけ取るためにtouchendのchangedTouchesから取得
  let touch = e.changedTouches[0];
  let dx = touch.clientX - rect.left - dragStart.x;
  let dy = touch.clientY - rect.top - dragStart.y;
  
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
      drawBoard(currentBoard,H,W,pieceNames,colors,ctx);
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
    drawBoard(currentBoard,H,W,pieceNames,colors,ctx);
    turnDiv.textContent=`ターン: ${turn}`;
  }
  dragStart=null; draggedPiece=0;
}

function enableDrag(flag){
  if(flag){
    canvas.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true }); 
    document.addEventListener('touchend', onTouchEnd, { passive: true }); 
    canvas.style.cursor='pointer';
  } else {
    canvas.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('touchstart', onTouchStart); 
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
  colors=generateColors(M);
  currentBoard=JSON.parse(JSON.stringify(data.board));
  canvas.width=W*50; canvas.height=H*50;
  drawBoard(currentBoard,H,W,pieceNames,colors,ctx);
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

// データセットボタン生成開始
generateDatasetButtons(20); 