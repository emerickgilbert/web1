var params;

var TILE_WIDTH;
var TILE_HEIGHT;
var NUM_COLS = 10;
var NUM_ROWS = 10;
var WIDTH;
var HEIGHT;

const canvas = document.getElementById("canvas");
const canvas_container = document.getElementById("canvas-container");
const overviewCanvas = document.getElementById("overview");
const overviewCtx = overviewCanvas.getContext("2d");
// dragging and zooming
var isDragging = false;
var lastX, lastY;
var scale = 1;
const zoom_max = 5;
var positionX = 0;
var positionY = 0;

// Keep track of which tiles are currently loaded
var loadedTiles = {};

const TILE_URL_TEMPLATE = "http://127.0.0.1:8081/tile_{x}_{y}.jpg";

async function init() {
  params = await (await fetch("http://127.0.0.1:8081/params.json")).json();

  TILE_WIDTH = params.width;
  TILE_HEIGHT = params.height;
  TILE_MOD_WIDTH = params.modWidth;
  TILE_MOD_HEIGHT = params.modHeight;
  NUM_COLS = params.x;
  NUM_ROWS = params.y;
  WIDTH =
    (NUM_COLS - 1) * TILE_WIDTH +
    (TILE_MOD_WIDTH == 0 ? TILE_WIDTH : TILE_MOD_WIDTH);
  HEIGHT =
    (NUM_ROWS - 1) * TILE_HEIGHT +
    (TILE_MOD_HEIGHT == 0 ? TILE_HEIGHT : TILE_MOD_HEIGHT);

  canvas.height = canvas.clientHeight;
  canvas.width = canvas.clientWidth;
  canvas.addEventListener("mousedown", function (event) {
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    event.preventDefault();
  });
  canvas.addEventListener("mousemove", function (event) {
    if (isDragging) {
      var deltaX = (event.clientX - lastX) / scale;
      var deltaY = (event.clientY - lastY) / scale;
      lastX = event.clientX;
      lastY = event.clientY;
      //prevent outbound
      // left
      if (positionX - deltaX < 0) {
        deltaX = positionX;
      }
      // right
      else if (positionX - deltaX > WIDTH - canvas.clientWidth / scale) {
        deltaX = positionX - WIDTH + canvas.clientWidth / scale;
      }
      positionX -= deltaX;
      // top
      if (positionY - deltaY < 0) {
        deltaY = positionY;
      }
      // bottom
      else if (positionY - deltaY > HEIGHT - canvas.clientHeight / scale) {
        deltaY = positionY - HEIGHT + canvas.clientHeight / scale;
      }

      positionY -= deltaY;
      canvas.getContext("2d").translate(deltaX, deltaY);
      renderTiles();
      event.preventDefault();
    }
  });
  canvas.addEventListener("mouseup", function (event) {
    isDragging = false;
    event.preventDefault();
  });
  canvas.addEventListener("wheel", function (event) {
    var delta;
    if (scale < 0.8) {
      delta = -event.deltaY / 10000;
    } else if (scale < 2.5) {
      delta = -event.deltaY / 5000;
    } else {
      delta = -event.deltaY / 1000;
    }
    var oldScale = scale;
    scale *= 1 + delta;
    scale = Math.max(zoom_min(), Math.min(zoom_max, scale));
    //var offsetX = canvas.width / 2;
    //var offsetY = canvas.height / 2;
    canvas.getContext("2d").translate(positionX, positionY);
    canvas.getContext("2d").scale(scale / oldScale, scale / oldScale);

    //keep center
    positionX += (canvas.width / oldScale - canvas.width / scale) / 2;
    positionY += (canvas.height / oldScale - canvas.height / scale) / 2;

    //prevent outbound
    positionX = Math.max(
      0,
      Math.min(positionX, WIDTH - canvas.clientWidth / scale)
    );
    positionY = Math.max(
      0,
      Math.min(positionY, HEIGHT - canvas.clientHeight / scale)
    );

    canvas.getContext("2d").translate(-positionX, -positionY);
    renderTiles();
    event.preventDefault();
  });

  window.addEventListener("resize", function () {
    canvas.height = canvas.clientHeight;
    canvas.width = canvas.clientWidth;

    positionX = Math.max(
      0,
      Math.min(positionX, WIDTH - canvas.clientWidth / scale)
    );
    positionY = Math.max(
      0,
      Math.min(positionY, HEIGHT - canvas.clientHeight / scale)
    );
    canvas.getContext("2d").translate(-positionX, -positionY);
    renderTiles();
  });

  renderTiles();
}

// Add a function to render the overview map and viewport rectangle
function renderOverview() {
  overviewCanvas.width = WIDTH / 10;
  overviewCanvas.height = HEIGHT / 10;
  overviewCtx.clearRect(0, 0, overviewCanvas.width, overviewCanvas.height);

  for (let col = 0; col < NUM_COLS; col++) {
    for (let row = 0; row < NUM_ROWS; row++) {
      let tileX = (col * TILE_WIDTH) / 10;
      let tileY = (row * TILE_HEIGHT) / 10;
      let tileWidth =
        col === NUM_COLS - 1 && TILE_MOD_WIDTH !== 0
          ? TILE_MOD_WIDTH / 10
          : TILE_WIDTH / 10;
      let tileHeight =
        row === NUM_ROWS - 1 && TILE_MOD_HEIGHT !== 0
          ? TILE_MOD_HEIGHT / 10
          : TILE_HEIGHT / 10;
      let tileName = getTileName(col, row);
      let tileURL = getTileURL(col, row);

      if (!loadedTiles[tileName]) {
        // Load the tile if it hasn't been loaded yet
        var img = new Image();
        img.src = tileURL;
        img.onload = function () {
          loadedTiles[tileName] = img;
          overviewCtx.drawImage(img, tileX, tileY, tileWidth, tileHeight);
        };
      } else {
        overviewCtx.drawImage(
          loadedTiles[tileName],
          tileX,
          tileY,
          tileWidth,
          tileHeight
        );
      }
    }
  }

  // Draw the viewport rectangle
  overviewCtx.beginPath();
  overviewCtx.rect(
    positionX / 10,
    positionY / 10,
    canvas.clientWidth / (scale * 10),
    canvas.clientHeight / (scale * 10)
  );
  overviewCtx.lineWidth = 2;
  overviewCtx.strokeStyle = "red";
  overviewCtx.stroke();
}

// Render the tiles that are currently visible on the canvas
function renderTiles() {
  var ctx = canvas.getContext("2d");
  // Calculate the visible range of tiles
  var startCol = Math.floor(positionX / TILE_WIDTH);
  var startRow = Math.floor(positionY / TILE_HEIGHT);
  var endCol = Math.min(
    NUM_COLS - 1,
    Math.ceil((positionX + canvas.clientWidth / scale) / TILE_WIDTH)
  );
  var endRow = Math.min(
    NUM_ROWS - 1,
    Math.ceil((positionY + canvas.clientHeight / scale) / TILE_HEIGHT)
  );

  // Load and draw the visible tiles
  for (var col = startCol; col <= endCol; col++) {
    for (var row = startRow; row <= endRow; row++) {
      var tileX = col * TILE_WIDTH;
      var tileY = row * TILE_HEIGHT;
      var tileWidth =
        col == NUM_COLS - 1
          ? TILE_MOD_WIDTH == 0
            ? TILE_WIDTH
            : TILE_MOD_WIDTH
          : TILE_WIDTH;
      var tileHeight =
        row == NUM_ROWS - 1
          ? TILE_MOD_HEIGHT == 0
            ? TILE_WIDTH
            : TILE_MOD_HEIGHT
          : TILE_HEIGHT;
      var tileName = getTileName(col, row);
      if (!loadedTiles[tileName]) {
        // Load the image asynchronously and draw it once it's loaded
        var img = new Image();
        img.src = getTileURL(col, row);
        img.onload = function () {
          ctx.drawImage(img, tileX, tileY, tileWidth, tileHeight);
        };
        loadedTiles[tileName] = img;
      } else {
        // Draw the image if it's already loaded
        ctx.drawImage(
          loadedTiles[tileName],
          tileX,
          tileY,
          tileWidth,
          tileHeight
        );
      }
    }
  }

  renderOverview();
}

// Determine if a tile is currently visible on the canvas
function isTileVisible(tileX, tileY, tileWidth, tileHeight) {
  return (
    tileX + tileWidth > positionX &&
    tileX < positionX + canvas.clientWidth / scale &&
    tileY + tileHeight > positionY &&
    tileY < positionY + canvas.clientHeight / scale
  );
}

// Get the filename or URL of a tile
function getTileName(col, row) {
  return "tile_" + col + "_" + row;
}
function getTileURL(col, row) {
  return TILE_URL_TEMPLATE.replace("{x}", col + 1).replace("{y}", row + 1);
}
function zoom_min() {
  return Math.max(canvas.height / HEIGHT, canvas.width / WIDTH);
}

init();
