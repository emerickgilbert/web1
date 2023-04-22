var params;
var tile_container;
const zoom_max = 5;
const zoom_min = 0.01;
const TILE_URL_TEMPLATE = `http://127.0.0.1:8081/tile_{x}_{y}.jpg`;
const minimapWidth = 150;
const minimapHeight = 150;

tile_container = document.querySelector("#tile_container");

async function drawTilesToCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = params.x * params.width;
  canvas.height = params.y * params.height;
  const ctx = canvas.getContext("2d");

  for (let y = 0; y < params.y; y++) {
    for (let x = 0; x < params.x; x++) {
      const tileUrl = TILE_URL_TEMPLATE.replace("{x}", x + 1).replace(
        "{y}",
        y + 1
      );
      const tileImage = new Image();
      tileImage.src = tileUrl;
      await new Promise((resolve) => {
        tileImage.onload = () => {
          ctx.drawImage(
            tileImage,
            x * params.width,
            y * params.height,
            params.width,
            params.height
          );
          resolve();
        };
      });
    }
  }

  return canvas;
}

async function init() {
  params = await (await fetch("./params.json")).json();

  tile_container.style.width = params.x * params.width + "px";
  tile_container.style.height = params.y * params.height + "px";
  tile_container.style.transform = "scale(1)";
  tile_container.dataset.scale = 1;

  tile_container.style.transformOrigin = "0 0";
  tile_container.addEventListener("wheel", zoomTile);
  tile_container.addEventListener("mousedown", startPanning);
  tile_container.addEventListener("mousemove", panTile);
  tile_container.addEventListener("mouseup", stopPanning);
  tile_container.addEventListener("mouseleave", stopPanning);

  let isPanning = false;
  let initialMousePosition = { x: 0, y: 0 };
  let initialTranslation = { x: 0, y: 0 };

  function startPanning(event) {
    isPanning = true;
    initialMousePosition = { x: event.clientX, y: event.clientY };
    initialTranslation = {
      x: parseFloat(tile_container.dataset.translateX) || 0,
      y: parseFloat(tile_container.dataset.translateY) || 0,
    };
    tile_container.style.cursor = "grabbing";
  }

  function panTile(event) {
    if (!isPanning) return;
    const deltaX = event.clientX - initialMousePosition.x;
    const deltaY = event.clientY - initialMousePosition.y;
    tile_container.style.transform = `translate(${
      initialTranslation.x + deltaX
    }px, ${initialTranslation.y + deltaY}px) scale(${
      tile_container.dataset.scale || 1
    })`;
    tile_container.dataset.translateX = initialTranslation.x + deltaX;
    tile_container.dataset.translateY = initialTranslation.y + deltaY;
  }

  function stopPanning() {
    isPanning = false;
    tile_container.style.cursor = "grab";
  }

  let zoomTimeout = null;

  function zoomTile(e) {
    e.preventDefault();
    e.stopPropagation();
    const deltaY = e.deltaY;
    const scale = parseFloat(tile_container.dataset.scale) || 1;
    const rect = tile_container.getBoundingClientRect();
    const dx =
      e.clientX -
      rect.left -
      parseFloat(tile_container.dataset.translateX || 0);
    const dy =
      e.clientY - rect.top - parseFloat(tile_container.dataset.translateY || 0);
    const center = `${dx}px ${dy}px`;
    const newScale =
      deltaY < 0
        ? Math.min(scale * 1.1, zoom_max)
        : Math.max(scale * 0.9, zoom_min);
    tile_container.dataset.scale = newScale;

    // Calculate the maximum and minimum translation values
    const containerWidth = tile_container.clientWidth;
    const containerHeight = tile_container.clientHeight;
    const imageWidth = params.width * params.x;
    const imageHeight = params.height * params.y;
    const maxTranslateX = (containerWidth - imageWidth * newScale) / 2;
    const minTranslateX = -maxTranslateX;
    const maxTranslateY = (containerHeight - imageHeight * newScale) / 2;
    const minTranslateY = -maxTranslateY;

    // Calculate the new translation values based on the mouse position
    let translateX = parseFloat(tile_container.dataset.translateX) || 0;
    let translateY = parseFloat(tile_container.dataset.translateY) || 0;
    translateX += (dx * (scale - newScale)) / scale;
    translateY += (dy * (scale - newScale)) / scale;

    // Restrict the translation values to the limits
    translateX = Math.max(Math.min(translateX, maxTranslateX), minTranslateX);
    translateY = Math.max(Math.min(translateY, maxTranslateY), minTranslateY);
    tile_container.dataset.translateX = translateX;
    tile_container.dataset.translateY = translateY;

    // Apply the transformations after a short delay
    clearTimeout(zoomTimeout);
    zoomTimeout = setTimeout(() => {
      tile_container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${newScale})`;
    }, 50);
  }

  tile_container.addEventListener("transitionend", () => {
    observer.observe(tile_container);
  });
  const options = {
    rootMargin: "0px 0px 100% 0px",
  };
  const observer = new IntersectionObserver(onIntersection, options);

  for (let y = 0; y < params.y; y++) {
    for (let x = 0; x < params.x; x++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");

      tile.style.width = params.width + "px";
      tile.style.height = params.height + "px";
      tile.style.left = x * params.width + "px";
      tile.style.top = y * params.height + "px";

      tile.dataset.x = x + 1;
      tile.dataset.y = y + 1;

      observer.observe(tile);

      tile_container.appendChild(tile);
    }
  }
}

function onIntersection(entries) {
  entries.forEach((entry) => {
    const tile = entry.target;
    const x = tile.dataset.x;
    const y = tile.dataset.y;
    const isVisible = entry.isIntersecting;

    if (isVisible) {
      tile.style.backgroundImage = `url(${TILE_URL_TEMPLATE.replace(
        "{x}",
        x
      ).replace("{y}", y)})`;
    } else {
      tile.style.backgroundImage = "";
    }
  });
}

init();
