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
  // ここはベースと同じくH+2行目（0始まりなのでH+2行目はlines[H+2]）
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
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      ctx.fillStyle = colors[board[r][c]];
      ctx.fillRect(c*cellSize,r*cellSize,cellSize,cellSize);
    }
  }
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#333";
  ctx.beginPath();
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      const val=board[r][c]; if(val===0) continue;
      if(r===0||board[r-1][c]!==val) {ctx.moveTo(c*cellSize,r*cellSize); ctx.lineTo((c+1)*cellSize,r*cellSize);}
      if(c===0||board[r][c-1]!==val) {ctx.moveTo(c*cellSize,r*cellSize); ctx.lineTo(c*cellSize,(r+1)*cellSize);}
      if(r===H-1||board[r+1][c]!==val) {ctx.moveTo(c*cellSize,(r+1)*cellSize); ctx.lineTo((c+1)*cellSize,(r+1)*cellSize);}
      if(c===W-1||board[r][c+1]!==val) {ctx.moveTo((c+1)*cellSize,r*cellSize); ctx.lineTo((c+1)*cellSize,(r+1)*cellSize);}
    }
  }
  ctx.stroke();
  const pieces = getPieceBounds(board);
  ctx.fillStyle="#222"; ctx.font="bold 18px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
  for(let num in pieces){
    const p = pieces[num];
    const cx=(p.minCol+p.maxCol+1)/2*cellSize;
    const cy=(p.minRow+p.maxRow+1)/2*cellSize;
    ctx.fillText(pieceNames[num],cx,cy);
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
let animationSpeed = 5; // デフォルト速度

function animate(states,H,W,pieceNames,colors,ctx,turnDiv,undoBtn){
  // もし前回の再生が残っていたら止める
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
  let idx=0;
  undoBtn.disabled = true;
  enableDrag(false);
  isPlayMode = false;

  function step(){
    if(idx>=states.length){
      clearTimeout(timerId);
      timerId=null;
      enableDrag(true);
      undoBtn.disabled=false;
      isPlayMode=true;
      return;
    }
    drawBoard(states[idx],H,W,pieceNames,colors,ctx);
    turnDiv.textContent=`ターン: ${idx}`;
    idx++;
    timerId=setTimeout(step, 1100 - animationSpeed*100); // 速度調整
  }
  step();
}

// ====================
// データセット読み込み
// ====================
function loadDataSet(num) {
  const basePath = './data/';
  fetch(`${basePath}in_${num}.txt?t=${Date.now()}`)
    .then(res => {
      if(!res.ok) throw new Error(`in_${num}.txt not found`);
      return res.text();
    })
    .then(txt => { inputTextArea.value = txt; initPlayMode(txt); })
    .catch(err => alert(`in_${num}.txt の読み込みに失敗: ${err}`));
  
  fetch(`${basePath}out_${num}.txt?t=${Date.now()}`)
    .then(res => {
      if(!res.ok) throw new Error(`out_${num}.txt not found`);
      return res.text();
    })
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
function onMouseUp(e){
  if(!isPlayMode||!dragStart||draggedPiece===0) { dragStart=null; draggedPiece=0; return; }
  let rect=canvas.getBoundingClientRect();
  let dx=e.clientX-rect.left-dragStart.x;
  let dy=e.clientY-rect.top-dragStart.y;
  if(Math.abs(dx)<10&&Math.abs(dy)<10){ dragStart=null; draggedPiece=0; return; }
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
    canvas.addEventListener('mousedown',onMouseDown);
    document.addEventListener('mouseup',onMouseUp);
    canvas.style.cursor='pointer';
  } else {
    canvas.removeEventListener('mousedown',onMouseDown);
    document.removeEventListener('mouseup',onMouseUp);
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
    alert('出力データが空です');
    return;
  }
  let states;
  try {
    states=parseOutputData(outputTextArea.value,H);
  } catch(e){
    alert('出力データの形式が正しくありません');
    return;
  }
  animate(states,H,W,pieceNames,colors,ctx,turnDiv,undoBtn);
};
undoBtn.onclick=undo;

// データセットボタン生成関数
function generateDatasetButtons(maxNum = 20) {
  const container = document.getElementById('dataset-buttons');
  container.querySelectorAll('button').forEach(btn => btn.remove());

  let promises = [];
  for (let i = 0; i < maxNum; i++) {
    let p = fetch(`./data/in_${i}.txt?t=${Date.now()}`, { method: 'HEAD' })
      .then(res => res.ok ? i : null)
      .catch(() => null);
    promises.push(p);
  }

  Promise.all(promises).then(results => {
    const validIndices = results.filter(idx => idx !== null).sort((a,b)=>a-b);
    validIndices.forEach(num => {
      const btn = document.createElement('button');
      btn.textContent = num;
      btn.onclick = () => loadDataSet(num);
      container.appendChild(btn);
    });
  });
}
// ページロード時にボタン生成
generateDatasetButtons(20); // 20くらい試す


speedSlider.oninput=()=> {
  animationSpeed = Number(speedSlider.value);
};

// ページロード時にデフォルトでデータセット0を読み込む
//window.addEventListener('load',()=>{ loadDataSet(0); });
