'use strict'
import L from "leaflet";
import './node_modules/leaflet/dist/leaflet.css';
import './node_modules/leaflet-draw/dist/leaflet.draw.css'
import "hammerjs";
import "leaflet-control-geocoder";
import './node_modules/leaflet-control-geocoder/dist/Control.Geocoder.css'
import 'leaflet-draw';

import Map from './src/Map'

const TILE = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}';
let mapId = 1;

const firstMap = new Map(`map${mapId}`, [51.505, -0.09], 13, TILE);
firstMap.buildMap();
bindListener(firstMap);
mapId++;

const secondMap = new Map(`map${mapId}`, [51.505, -0.09], 13, TILE);
secondMap.buildMap();
bindListener(secondMap);
mapId++;

function bindListener(map) {
    map.addListener('zoomend', function () {
        map.onZoomEnd();
    });

    map.addListener(L.Draw.Event.CREATED, function (event) {
        map.drawCreated(event);
    })
}

const mapsSection = document.querySelector(".maps");
const button = document.querySelector(".add-map");

button.addEventListener("click", function () {

    const mapp = document.createElement("div");
    mapp.setAttribute("id", `map${mapId}`);
    mapp.setAttribute("class", "map");

    mapsSection.appendChild(mapp);

    const map = new Map(`map${mapId}`, [51.505, -0.09], 13, TILE);
    map.buildMap();
    bindListener(map);
    mapId++;

    if (mapId == 5) {
        button.setAttribute("disabled", "");
    }

});