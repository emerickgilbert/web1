const tileSize = { width: 900, height: 700 }; // size of each tile in pixels
const maxTiles = 15000; // maximum number of tiles to display
const canvas = document.getElementById("myCanvas"); // get the canvas element
const ctx = canvas.getContext("2d"); // get the canvas context

let loadedTiles = {}; // dictionary to store loaded tiles

function drawTile(tileX, tileY) {
  // check if tile is already loaded
  const tileKey = `${tileX}_${tileY}`;
  if (loadedTiles[tileKey]) {
    ctx.drawImage(
      loadedTiles[tileKey],
      tileX * tileSize.width,
      tileY * tileSize.height
    );
    return;
  }

  // create a new image object to load the tile
  const tileImage = new Image();
  tileImage.onload = function () {
    console.log(`loaded tile: ${tileX}_${tileY}`);
    ctx.drawImage(tileImage, tileX * tileSize.width, tileY * tileSize.height);
    loadedTiles[tileKey] = tileImage;
  };

  // set the source of the image object to the tile URL
  tileImage.src = `http://127.0.0.1:8081/tile_${tileX}_${tileY}.jpg`;
}

function loadTilesInView() {
  // get the current viewport of the canvas
  const viewLeft = Math.max(0, Math.floor(canvas.scrollLeft / tileSize.width));
  const viewTop = Math.max(0, Math.floor(canvas.scrollTop / tileSize.height));
  const viewRight = Math.min(
    Math.ceil(canvas.width / tileSize.width),
    maxTiles
  );
  const viewBottom = Math.min(
    Math.ceil(canvas.height / tileSize.height),
    maxTiles
  );

  // loop through all tiles in the viewport and draw them
  for (let y = viewTop + 1; y < viewBottom + 1; y++) {
    for (let x = viewLeft + 1; x < viewRight + 1; x++) {
      drawTile(x, y);
    }
  }
}

// add event listener for scrolling on the canvas
canvas.addEventListener("scroll", function () {
  // use requestAnimationFrame to throttle the loading of tiles
  requestAnimationFrame(loadTilesInView);
});

// load initial set of tiles
loadTilesInView();
