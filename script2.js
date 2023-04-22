var params;
var tile_container;
var tile_frame;
const zoom_max = 5;
const zoom_min = 0.1;
const zoomSpeed = 200;
const TILE_URL_TEMPLATE = "Url(http://127.0.0.1:8081/tile_{x}_{y}.jpg)";
const observer = new IntersectionObserver(onIntersection, {
  rootMargin: "0px 0px 100% 0px",
});

async function init() {
  params = await (await fetch("http://127.0.0.1:8081/params.json")).json();
  tile_container = document.querySelector("#tile_container");
  tile_frame = document.querySelector("#tile_frame");

  tile_container.style.width = params.x * params.width + "px";
  tile_container.style.zoom = 1;
  tile_frame.addEventListener("wheel", zoomTile);
  let isDragging = false;
  let startMouseX, startMouseY;
  let startScrollX, startScrollY;

  tile_frame.addEventListener("mousedown", startDrag);
  tile_frame.addEventListener("mousemove", drag);
  tile_frame.addEventListener("mouseup", endDrag);
  tile_frame.addEventListener("mouseleave", endDrag);

  tile_frame.addEventListener("touchstart", startDrag, { passive: true });
  tile_frame.addEventListener("touchmove", drag, { passive: true });
  tile_frame.addEventListener("touchend", endDrag, { passive: true });

  function startDrag(e) {
    if (e.type === "mousedown") {
      e.preventDefault();
    }
    isDragging = true;
    startMouseX = e.clientX || e.touches[0].clientX;
    startMouseY = e.clientY || e.touches[0].clientY;
    startScrollX = tile_frame.scrollLeft;
    startScrollY = tile_frame.scrollTop;
  }

  function drag(e) {
    if (!isDragging) {
      return;
    }
    e.preventDefault();
    const currentMouseX = e.clientX || e.touches[0].clientX;
    const currentMouseY = e.clientY || e.touches[0].clientY;
    tile_frame.scrollLeft = startScrollX - (currentMouseX - startMouseX);
    tile_frame.scrollTop = startScrollY - (currentMouseY - startMouseY);
  }

  function endDrag() {
    isDragging = false;
  }

  for (let y = 1; y <= params.y; y++) {
    for (let x = 1; x <= params.x; x++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      //set dimmentions
      if (x == params.x && params.modWidth != 0) {
        tile.style.width = params.modWidth + "px";
      } else {
        tile.style.width = params.width + "px";
      }
      if (y == params.y && params.modHeight != 0) {
        tile.style.height = params.modHeight + "px";
      } else {
        tile.style.height = params.height + "px";
      }
      tile.dataset.x = x;
      tile.dataset.y = y;
      observer.observe(tile);
      tile_container.appendChild(tile);
    }
  }
}

function onIntersection(entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const tile = entry.target;
      const x = tile.dataset.x;
      const y = tile.dataset.y;
      tile.style.backgroundImage = TILE_URL_TEMPLATE.replace("{x}", x).replace(
        "{y}",
        y
      );
      observer.unobserve(tile);
    }
  });
}

function zoomTile(e) {
  // Get the current scale value
  const scaleStr = tile_container.style.transform;
  let currentScale = parseFloat(
    scaleStr.replace("scale(", "").replace(")", "")
  );

  if (isNaN(currentScale)) {
    currentScale = 1;
  }

  // Calculate the new scale value based on the deltaY of the wheel event
  let newScale;
  if (currentScale < 0.8) {
    newScale = currentScale * (1 - e.deltaY / 10000);
  } else if (currentScale < 2.5) {
    newScale = currentScale * (1 - e.deltaY / 5000);
  } else {
    newScale = currentScale * (1 - e.deltaY / 1000);
  }

  newScale = Math.max(newScale, zoom_min);
  newScale = Math.min(newScale, zoom_max);

  // Get the mouse position relative to the viewport
  const mouseX = e.clientX;
  const mouseY = e.clientY;

  // Calculate the position of the mouse relative to the tile_container in the current scale
  const containerRect = tile_container.getBoundingClientRect();
  const offsetX = mouseX - containerRect.left;
  const offsetY = mouseY - containerRect.top;

  // Calculate the position of the mouse relative to the tile_container in the new scale
  const newOffsetX = (offsetX * newScale) / currentScale;
  const newOffsetY = (offsetY * newScale) / currentScale;

  // Calculate the new scroll positions to maintain the same point under the cursor
  const newScrollLeft = tile_frame.scrollLeft + (newOffsetX - offsetX);
  const newScrollTop = tile_frame.scrollTop + (newOffsetY - offsetY);

  // Set the new scale value using the transform: scale() property and update the scroll positions
  tile_container.style.transform = `scale(${newScale})`;
  tile_frame.scrollLeft = newScrollLeft;
  tile_frame.scrollTop = newScrollTop;

  e.preventDefault();
  e.stopPropagation();
}

init();
