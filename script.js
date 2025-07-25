const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

const grid = 32;
const playfield = [];

let tetrominoSequence = [];

const rows = 20;
const cols = 10;

for (let row = -2; row < rows; row++) {
  playfield[row] = [];
  for (let col = 0; col < cols; col++) {
    playfield[row][col] = 0;
  }
}

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
let rAF = null;
let gameOver = false;

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

function rotate(matrix) {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - j][i])
  );
  return result;
}

function isValidMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] && (
          cellCol + col < 0 ||
          cellCol + col >= cols ||
          cellRow + row >= rows ||
          (playfield[cellRow + row] && playfield[cellRow + row][cellCol + col]))
        ) {
        return false;
      }
    }
  }
  return true;
}

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
  for (let row = rows - 1; row >= 0; ) {
    if (playfield[row].every(cell => !!cell)) {
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < cols; c++) {
          playfield[r][c] = r > 0 ? playfield[r-1][c] : 0;
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

document.addEventListener('keydown', function(e) {
  if (gameOver) return;
  if (e.which === 37 || e.which === 39) {
    const col = e.which === 37 ? tetromino.col - 1 : tetromino.col + 1;
    if (isValidMove(tetromino.matrix, tetromino.row, col)) {
      tetromino.col = col;
    }
  }
  if (e.which === 38) {
    const matrix = rotate(tetromino.matrix);
    if (isValidMove(matrix, tetromino.row, tetromino.col)) {
      tetromino.matrix = matrix;
    }
  }
  if(e.which === 40) {
    const row = tetromino.row + 1;
    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      placeTetromino();
      return;
    }
    tetromino.row = row;
  }
});

function loop() {
  rAF = requestAnimationFrame(loop);
  context.clearRect(0,0,canvas.width,canvas.height);
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

// --- スマホ用ボタンの処理 ---
const rotateBtn = document.getElementById('rotate-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const downBtn = document.getElementById('down-btn');

if (rotateBtn) {
    rotateBtn.addEventListener('click', function() {
        if (gameOver) return;
        const matrix = rotate(tetromino.matrix);
        if (isValidMove(matrix, tetromino.row, tetromino.col)) {
            tetromino.matrix = matrix;
        }
    });
}
if (leftBtn) {
    leftBtn.addEventListener('click', function() {
        if (gameOver) return;
        const col = tetromino.col - 1;
        if (isValidMove(tetromino.matrix, tetromino.row, col)) {
            tetromino.col = col;
        }
    });
}
if (rightBtn) {
    rightBtn.addEventListener('click', function() {
        if (gameOver) return;
        const col = tetromino.col + 1;
        if (isValidMove(tetromino.matrix, tetromino.row, col)) {
            tetromino.col = col;
        }
    });
}
if (downBtn) {
    downBtn.addEventListener('click', function() {
        if (gameOver) return;
        const row = tetromino.row + 1;
        if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
            placeTetromino();
            return;
        }
        tetromino.row = row;
    });
}
