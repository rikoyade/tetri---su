const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

// ゲーム盤のサイズ（1マスを32pxとする）
const grid = 32;
const playfield = [];

// テトリミノのシーケンス
let tetrominoSequence = [];

// 盤面の行と列
const rows = 20;
const cols = 10;

// 盤面を初期化
for (let row = -2; row < rows; row++) {
  playfield[row] = [];
  for (let col = 0; col < cols; col++) {
    playfield[row][col] = 0;
  }
}

// テトリミノの定義
const tetrominos = {
  'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
  'J': [[1,0,0], [1,1,1], [0,0,0]],
  'L': [[0,0,1], [1,1,1], [0,0,0]],
  'O': [[1,1], [1,1]],
  'S': [[0,1,1], [1,1,0], [0,0,0]],
  'Z': [[1,1,0], [0,1,1], [0,0,0]],
  'T': [[0,1,0], [1,1,1], [0,0,0]]
};

const colors = {
  'I': 'cyan', 'O': 'yellow', 'T': 'purple', 'S': 'green',
  'Z': 'red', 'L': 'orange', 'J': 'blue'
};

let count = 0;
let tetromino = getNextTetromino();
let rAF = null;  // requestAnimationFrame
let gameOver = false;

// 次のテトリミノを生成
function getNextTetromino() {
  if (tetrominoSequence.length === 0) {
    const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    while (sequence.length) {
      const rand = Math.floor(Math.random() * sequence.length);
      const name = sequence.splice(rand, 1)[0];
      tetrominoSequence.push(name);
    }
  }

  const name = tetrominoSequence.pop();
  const matrix = tetrominos[name];

  return {
    name: name,
    matrix: matrix,
    row: name === 'I' ? -1 : -2,
    col: Math.floor((cols - matrix[0].length) / 2)
  };
}

// テトリミノを回転
function rotate(matrix) {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - j][i])
  );
  return result;
}

// 移動が有効かチェック
function isValidMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] && (
          cellCol + col < 0 ||
          cellCol + col >= cols ||
          cellRow + row >= rows ||
          playfield[cellRow + row][cellCol + col])
        ) {
        return false;
      }
    }
  }
  return true;
}

// テトリミノを盤面に固定
function placeTetromino() {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        if (tetromino.row + row < 0) {
          return showGameOver();
        }
        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
      }
    }
  }

  // ライン消去
  for (let row = rows - 1; row >= 0; ) {
    if (playfield[row].every(cell => !!cell)) {
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < cols; c++) {
          playfield[r][c] = playfield[r-1][c];
        }
      }
    } else {
      row--;
    }
  }
  tetromino = getNextTetromino();
}

function showGameOver() {
  cancelAnimationFrame(rAF);
  gameOver = true;
  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  context.globalAlpha = 1;
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
}

// キーボード操作
document.addEventListener('keydown', function(e) {
  if (gameOver) return;

  if (e.which === 37 || e.which === 39) { // ← →
    const col = e.which === 37 ? tetromino.col - 1 : tetromino.col + 1;
    if (isValidMove(tetromino.matrix, tetromino.row, col)) {
      tetromino.col = col;
    }
  }

  if (e.which === 38) { // ↑
    const matrix = rotate(tetromino.matrix);
    if (isValidMove(matrix, tetromino.row, tetromino.col)) {
      tetromino.matrix = matrix;
    }
  }

  if(e.which === 40) { // ↓
    const row = tetromino.row + 1;
    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      placeTetromino();
      return;
    }
    tetromino.row = row;
  }
});

// ゲームループ
function loop() {
  rAF = requestAnimationFrame(loop);
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (playfield[row][col]) {
        const name = playfield[row][col];
        context.fillStyle = colors[name];
        context.fillRect(col * grid, row * grid, grid-1, grid-1);
      }
    }
  }

  if (tetromino) {
    if (++count > 35) {
      tetromino.row++;
      count = 0;

      if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--;
        placeTetromino();
      }
    }

    context.fillStyle = colors[tetromino.name];
    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {
          context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid-1, grid-1);
        }
      }
    }
  }
}

// --- サービスワーカーの登録 ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('ServiceWorker registration successful');
    }).catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

rAF = requestAnimationFrame(loop);
// script.js の一番下に追加

// 各ボタンの要素を取得
const rotateBtn = document.getElementById('rotate-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const downBtn = document.getElementById('down-btn');

// 回転ボタンの処理
rotateBtn.addEventListener('click', function() {
  if (gameOver) return;
  const matrix = rotate(tetromino.matrix);
  if (isValidMove(matrix, tetromino.row, tetromino.col)) {
    tetromino.matrix = matrix;
  }
});

// 左ボタンの処理
leftBtn.addEventListener('click', function() {
  if (gameOver) return;
  const col = tetromino.col - 1;
  if (isValidMove(tetromino.matrix, tetromino.row, col)) {
    tetromino.col = col;
  }
});

// 右ボタンの処理
rightBtn.addEventListener('click', function() {
  if (gameOver) return;
  const col = tetromino.col + 1;
  if (isValidMove(tetromino.matrix, tetromino.row, col)) {
    tetromino.col = col;
  }
});

// 下ボタンの処理
downBtn.addEventListener('click', function() {
  if (gameOver) return;
  const row = tetromino.row + 1;
  if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
    placeTetromino();
    return;
  }
  tetromino.row = row;
});
