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

const firstMap = new Map('map1', [51.505, -0.09], 13, TILE);
firstMap.buildMap();
bindListener(firstMap);

const secondMap = new Map('map2', [51.505, -0.09], 13, TILE);
secondMap.buildMap();
bindListener(secondMap);

function bindListener(map) {
    map.addListener('zoomend', function () {
        map.onZoomEnd();
    });

    map.addListener(L.Draw.Event.CREATED, function (event) {
        console.log("L.Draw.Event.CREATED");
        map.drawCreated(event);
    })
}

const mapsSection = L.DomUtil.get("maps");

const button = document.querySelector("button");
var mapId = 3;

button.addEventListener("click", function () {

    const mapp = document.createElement("div");
    mapp.setAttribute("id", `map${mapId}`);
    mapp.setAttribute("class", "map");

    mapsSection.appendChild(mapp);

    const map = new Map(`map${mapId}`, [51.505, -0.09], 13, TILE);
    map.buildMap();
    bindListener(map);

    mapId += 1;

    if (mapId == 5) {
        button.setAttribute("disabled", "");
    }

});
// TODO button to add map
