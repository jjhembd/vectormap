import { initDisplay } from "./display.js";
import * as d3 from 'd3-geo';
//import * as topojson from 'topojson-client';
import { Pbf as Protobuf } from 'pbf';
import { VectorTile } from 'vector-tile-js';

export function init(div, dataHref, dataType) {
  // Input div is the ID of an HTML div where the map will be rendered
  // Input dataHref is the path to a file containing map data
  // Input dataType is a flag indicating the file format. Accepted values:
  //   "geojson" -- GeoJSON
  //   "mvt" -- Mapbox vector tile

  // Initialize the canvas and rendering context
  const ctx = initDisplay(div);

  // Initialize the D3 path generator. 
  // First param is the projection. Keep the data's native coordinates for now
  var path = d3.geoPath(null, ctx);

  // Get the data
  var request = new XMLHttpRequest();
  request.onerror = requestError;
  request.open('get', dataHref);
  if (dataType === "geojson") {
    // Load the response as text, since Edge doesn't support json responseType
    request.responseType = "text";
    request.onload = drawJSON;
  } else if (dataType === "mvt") {
    // WARNING: this responseType may not be supported by Safari on iOS?
    request.responseType = "arraybuffer";
    request.onload = drawMVT;
  } else {
    console.log("dataType " + dataType + " not supported");
    return;
  }
  request.send();

  function drawMVT() {
    if (this.responseType !== "arraybuffer") {
      console.log("Wrong responseType. Expected arraybuffer, got " + 
          this.responseType);
      return;
    }
    const buffer = new Uint8Array(this.response);
    const pbuffer = new Protobuf(buffer);
    const layers = new VectorTile(pbuffer).layers;
    for (let layer in layers) {
      var data = layerToGeoJSON( layers[layer] );
      console.log("layer converted to GeoJSON = " + JSON.stringify(data));
      draw(ctx, path, data);
    }
  }

  function layerToGeoJSON( layer ) {
    // Based on https://observablehq.com/@mbostock/d3-mapbox-vector-tiles
    if (!layer) return;
    const features = [];
    for (let i = 0; i < layer.length; ++i) {
      // We ignore the tile coordinates for now, and treat it as the 0,0,0 tile
      const feature = layer.feature(i).toGeoJSON(512);
      features.push(feature);
    }
    return {
      type: "FeatureCollection", 
      features: features,
    };
  }

  function drawJSON() {
    if (this.responseType !== "text") {
      console.log("Wrong responseType. Expected text, got " + 
          this.responseType);
      return;
    }
    var data = JSON.parse(this.responseText);
    console.log(data);
    draw(ctx, path, data);
  }
}

function draw(ctx, path, data) {
  // Set up the drawing path and parameters
  ctx.beginPath();
  path(data);
  // Fill the areas
  ctx.fillStyle = "#DDEEDD";
  ctx.fill();
  // Set some line parameters
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // Draw the boundaries
  //ctx.strokeStyle = "#000000";
  //ctx.lineWidth = 3;
  //ctx.stroke();
  // Draw boundaries again, to put a white strip in the middle
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function requestError(err) {
  console.log("XMLHttpRequest Error: " + err);
}
