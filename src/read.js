import { xhrGet } from "./xhrGet.js";
import { Pbf as Protobuf } from 'pbf';
import { VectorTile } from 'vector-tile-js';

export function readMVT(dataHref, size, callback) {
  // Input dataHref is the path to a file containing a Mapbox Vector Tile

  // Request the data
  var req = xhrGet(dataHref, "arraybuffer", parseMVT);

  // Return the request, so it can be aborted if necessary
  return req;

  function parseMVT(err, data) {
    if (err) return callback(err, data);

    //console.time('parseMVT');
    const pbuffer = new Protobuf( new Uint8Array(data) );
    const tile = new VectorTile(pbuffer);
    const jsonLayers = mvtToJSON(tile, size);
    //console.timeEnd('parseMVT');

    callback(null, jsonLayers);
  }
}

function mvtToJSON(tile, size) {
  // tile.layers is an object (not array!). In Mapbox Streets, it is an
  // object of { name: layer, } pairs, where name = layer.name. 
  // But this is not mentioned in the spec! So we use layer.name for safety
  const jsonLayers = {};
  Object.values(tile.layers).forEach(layer => {
      jsonLayers[layer.name] = layerToJSON(layer, size);
  });
  return jsonLayers;
}

function layerToJSON(layer, size) {
  const features = [];
  for (let i = 0; i < layer.length; ++i) {
    features.push( layer.feature(i).toGeoJSON(size) );
  }
  return { type: "FeatureCollection", features: features };
}

export function readMultiJSON(hrefs, callback) {
  var results = {};
  hrefs.forEach( href => readJSON(href, checkAll) );

  function checkAll(err, data, href) {
    if (err) callback(err);
    results[href] = data;
    if (Object.keys(results).length === hrefs.length) callback(null, results);
  }
}

export function readJSON(dataHref, callback) {
  // Input dataHref is the path to a file containing JSON

  // Request the data - as text, since Edge doesn't support json responseType
  xhrGet(dataHref, "text", parseJSON);

  function parseJSON(err, data) {
    if (err) return callback(err, data);
    callback(null, JSON.parse(data), dataHref);
  }
}

export function loadImage(href, callback) {
  const img = new Image();
  img.onerror = () => callback("ERROR in loadImage for href " + href);
  img.onload = checkImg;
  img.crossOrigin = "anonymous";
  img.src = href;

  function checkImg() {
    if (img.complete && img.naturalWidth !== 0) {
      return callback(null, img);
    } else {
      return callback("ERROR in loadImage for href " + href);
    }
  }

  return img;
}
