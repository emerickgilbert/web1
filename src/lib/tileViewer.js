// Define the TileViewer class
// Define the TileViewer class
class TileViewer {
  constructor(container, tileUrl, tileWidth, tileHeight) {
    // Set the container element for the viewer
    this.container = container;

    // Set the URL pattern for the image tiles
    this.tileUrl = tileUrl;

    // Set the size of each tile
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;

    // Calculate the number of tiles needed to display the entire image
    this.numTilesX = Math.ceil(this.container.clientWidth / this.tileWidth);
    this.numTilesY = Math.ceil(this.container.clientHeight / this.tileHeight);

    // Create an empty div to hold the tiles
    this.tilesContainer = document.createElement("div");
    this.tilesContainer.style.position = "absolute";
    this.tilesContainer.style.top = "0";
    this.tilesContainer.style.left = "0";
    this.tilesContainer.style.width = `${this.numTilesX * this.tileWidth}px`;
    this.tilesContainer.style.height = `${this.numTilesY * this.tileHeight}px`;
    this.container.appendChild(this.tilesContainer);

    // Load the tiles for the initial view
    this.loadTiles();
  }

  // Load the tiles for the current view
  loadTiles() {
    // Calculate the tile coordinates for the top-left corner of the viewport
    const topLeftTileX = Math.floor(this.container.scrollLeft / this.tileWidth);
    const topLeftTileY = Math.floor(this.container.scrollTop / this.tileHeight);

    // Calculate the number of tiles needed to cover the entire viewport
    const numTilesX = Math.ceil(this.container.clientWidth / this.tileWidth);
    const numTilesY = Math.ceil(this.container.clientHeight / this.tileHeight);

    // Clear the current tiles from the container
    this.tilesContainer.innerHTML = "";

    // Load each tile and add it to the container
    for (let x = 0; x < numTilesX; x++) {
      for (let y = 0; y < numTilesY; y++) {
        const tile = document.createElement("img");
        tile.src = this.getTileUrl(topLeftTileX + x, topLeftTileY + y);
        tile.style.position = "absolute";
        tile.style.left = `${x * this.tileWidth}px`;
        tile.style.top = `${y * this.tileHeight}px`;
        tile.style.width = `${this.tileWidth}px`;
        tile.style.height = `${this.tileHeight}px`;
        this.tilesContainer.appendChild(tile);
      }
    }
  }

  // Calculate the URL for a given tile coordinate
  getTileUrl(x, y) {
    return this.tileUrl.replace("{x}", x).replace("{y}", y);
  }
}
