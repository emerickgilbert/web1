const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Create an ImageBitmap from an image or canvas element
const image = document.getElementById("myImage");

let imgUrl = "http://127.0.0.1:8081/tile_1_1.jpg";

fetch(imgUrl)
  .then((response) => response.blob())
  .then((blob) => createImageBitmap(blob))
  .then((imageBitmap) => {
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    // Define the grid size and the size of each tile
    const gridSize = 4;
    const tileSize = canvas.width / gridSize;

    // Loop through each row and column of the grid
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // Draw the tile at the current row and column
        const x = col * tileSize;
        const y = row * tileSize;
        ctx.drawImage(imageBitmap, x, y, tileSize, tileSize);
      }
    }
  })
  .catch((error) => console.error(error));

// Set the canvas width and height to match the image size
