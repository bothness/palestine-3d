const { DeckGL, TerrainLayer, MapboxLayer } = deck;

mapboxgl.accessToken = 'pk.eyJ1IjoiYXJrYmFyY2xheSIsImEiOiJjamdxeDF3ZXMzN2IyMnFyd3EwdGcwMDVxIn0.P2bkpp8HGNeY3-FOsxXVvA';

// Select DOM objects
const storySelect = document.getElementById("story-select");
const heightSelect = document.getElementById("height-select");
const heightValue = document.getElementById("height-value");

const year = new Date().getFullYear();

const layers = {
  terrain: 'https://tile.nextzen.org/tilezen/terrain/v1/256/terrarium/{z}/{x}/{y}.png?api_key=_WbqOjpNS6-ug4JaHzHcdw',
  pal20k: 'https://palopenmaps.org/tiles/pal20k-1940s/{z}/{x}/{y}@2x.jpg',
  satellite: 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.webp?sku=101p8KfWOJLrp&access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA'
};

var multiply = +heightSelect.value;
heightValue.innerHTML = multiply.toFixed(1);

var decoder = {
  rScaler: multiply * 256,
  gScaler: multiply,
  bScaler: multiply / 256,
  offset: -32768 * multiply
};

const options = {
  map: {
    style: {
      "version": 8,
      "id": "base",
      "name": "base",
      "sources": {},
      "layers": []
    },
    center: [35.263853, 32.218567],
    zoom: 13.5,
    maxZoom: 14,
    bearing: 0,
    pitch: 45,
    attributionControl: false
  },
  terrain: {
    type: TerrainLayer,
    minZoom: 0,
    maxZoom: 17,
    strategy: 'no-overlap',
    elevationDecoder: decoder,
    elevationData: layers.terrain,
    meshMaxError: 2,
    wireframe: false,
    color: [255, 255, 255]
  }
};

var leftMap = new mapboxgl.Map({
  container: 'left',
  ...options.map
});

var rightMap = new mapboxgl.Map({
  container: 'right',
  ...options.map
});

const container = '#map';

const map = new mapboxgl.Compare(leftMap, rightMap, container, {
  // Set this to enable comparing two maps by mouse movement:
  // mousemove: true
});

var data = [];

rightMap.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }));

var pal40sLayer = new MapboxLayer({
  id: 'pal40s',
  texture: layers.pal20k,
  ...options.terrain
});

var satelliteLayer = new MapboxLayer({
  id: 'satellite',
  texture: layers.satellite,
  ...options.terrain
});

leftMap.on('load', () => {
  leftMap.addLayer(pal40sLayer);
  leftMap.addControl(new mapboxgl.AttributionControl({
    customAttribution: `<a href="https://palopenmaps.org/" target="_blank">Palestine Open Maps (1940s)</a>`
    }), 'bottom-left');
});

rightMap.on('load', () => {
  rightMap.addLayer(satelliteLayer);
  rightMap.addControl(new mapboxgl.AttributionControl({
    customAttribution: `<a href="https://www.mapbox.com/maps/satellite/" target="_blank">Mapbox Satellite (${year})</a>`
    }), 'bottom-right');
});

function genPlaces(data) {
  let html = '';
  for (i in data) {
    html += `<option value="${data[i].name}"></option>`;
  }
  document.getElementById('story-list').innerHTML = html;
}

function addListeners() {

  storySelect.addEventListener("change", () => {
    document.getElementById('story-select').blur();
    let place = data.find(d => d.name == storySelect['value']);
    leftMap.flyTo({
      center: [
        place.lng,
        place.lat
      ],
      zoom: 13.5,
      essential: true
    });
  });

  heightSelect.addEventListener("input", () => {
    multiply = +heightSelect.value;
    heightValue.innerHTML = multiply.toFixed(1);
  })
  heightSelect.addEventListener("change", () => {
    decoder = {
      rScaler: multiply * 256,
      gScaler: multiply,
      bScaler: multiply / 256,
      offset: -32768 * multiply
    };
    pal40sLayer.props.elevationDecoder = decoder;
    satelliteLayer.props.elevationDecoder = decoder;
    leftMap.removeLayer('pal40s');
    rightMap.removeLayer('satellite');
    leftMap.addLayer(pal40sLayer);
    rightMap.addLayer(satelliteLayer);
  });
}

fetch('./data/places.csv')
  .then(response => response.text())
  .then(string => {
    data = d3.csvParse(string, function(d) {
      return { 'name': d.name, 'lng': Number(d.lng), 'lat': Number(d.lat) };
    });
    return data;
  })
  .then(result => {
    genPlaces(result)
    addListeners();
  });