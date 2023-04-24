import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import TileImage from "ol/source/TileImage";
import { createXYZ } from "ol/tilegrid";
import Projection from "ol/proj/Projection";
import { OverviewMap, defaults as defaultControls } from "ol/control";

const tileSize = [1000, 700];
const extent = [0, 0, tileSize[0] * 20, tileSize[1] * 8];

const projection = new Projection({
  code: "custom",
  units: "pixels",
  extent: extent,
});

const resolutions = [1];

const tileGrid = createXYZ({
  extent: extent,
  tileSize: tileSize,
  maxZoom: 20,
});

const tileLayer = new TileLayer({
  source: new TileImage({
    projection: projection,
    tileGrid: tileGrid,
    tileUrlFunction: function (tileCoord) {
      const [z, x, y] = tileCoord;

      if (x >= 0 && x < 20 && y >= 0 && y < 8) {
        return `http://127.0.0.1:8081/tile_${x + 1}_${y + 1}.jpg`;
      } else {
        return null;
      }
    },
  }),
});

const overviewTileSize = [100, 70];
const overviewExtent = [0, 0, tileSize[0] * 20, tileSize[1] * 8];

// Define a new tile grid for the overview map
const overviewTileGrid = createXYZ({
  extent: overviewExtent,
  tileSize: overviewTileSize,
  maxZoom: 6, // Define a smaller number of zoom levels for the overview map
});

// Define a new tile layer for the overview map that uses the new tile grid
const overviewTileLayer = new TileLayer({
  source: new TileImage({
    projection: projection,
    tileGrid: overviewTileGrid,
    tileUrlFunction: function (tileCoord) {
      const [z, x, y] = tileCoord;

      if (x >= 0 && x < 20 && y >= 0 && y < 8) {
        return `http://127.0.0.1:8081/tile_${x + 1}_${y + 1}.jpg`;
      } else {
        return null;
      }
    },
  }),
});

// Create the OverviewMap control using the new tile layer and tile grid
const overviewMapControl = new OverviewMap({
  layers: [overviewTileLayer],
  view: new View({
    projection: projection,
    resolutions: overviewTileGrid.getResolutions(),
    extent: overviewExtent,
  }),
});

const map = new Map({
  controls: defaultControls().extend([overviewMapControl]),
  layers: [tileLayer],
  target: "map",
  view: new View({
    center: [tileSize[0] * 10, tileSize[1] * 4],
    zoom: 0,
    minZoom: 0,
    maxZoom: 20, // Increase maxZoom to allow more zoom levels
    projection: projection,
    extent: extent,
    resolutions: resolutions,
    constrainResolution: false, // Allow fractional zoom levels
  }),
});
console.log("Main map extent:", extent);
console.log("Overview map extent:", overviewExtent);
