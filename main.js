import L from "leaflet";
import './node_modules/leaflet/dist/leaflet.css';
import "hammerjs";
import "leaflet-control-geocoder";
import './node_modules/leaflet-control-geocoder/dist/Control.Geocoder.css'

const TILE = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}';
const ATTRIBUTION = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

function Map(element, coordinate, zoomLevel, tile) {
    this.mouseover = false;
    this.lMap = null;
    this.element = element;
    this.coordinate = coordinate;
    this.zoomLevel = zoomLevel;
    this.tile = tile;
}

Map.prototype.createMap = function() {
    this.lMap = L.map(this.element).setView(this.coordinate, this.zoomLevel);
};

Map.prototype.createTileLayer = function() {
    if (this.lMap != null) {
        L.tileLayer(this.tile, {
            attribution: ATTRIBUTION,
            maxZoom: 18,
            id: 'mapbox.streets',
            accessToken: 'pk.eyJ1IjoiZG1hcmlvbiIsImEiOiJjanlsb3owdmQwOXh1M21ydGtvbjA1MXRzIn0.gpxMygro3oXIlpxHK_ToYQ'
        }).addTo(this.lMap);
    }
};

Map.prototype.addListener = function(event, fct) {
    this.lMap.on(event, fct);
};

Map.prototype.onZoomEnd = function(mapToZoom) {
    this.zoomLevel = this.lMap.getZoom();

    /* Check if the mouse is over the map.
       Avoid the case where the user zoom in and zoom out too rapidly
       triggering a infinite zoom in/zoom out on both map 
    */
    if(this.mouseover || pinch) {
        mapToZoom.setZoom(this.zoomLevel);
    }
};

var pinch = false;

const firstMap = new Map('first-map', [51.505, -0.09], 13, TILE);
firstMap.createMap();
firstMap.createTileLayer();

firstMap.addListener('zoomend', function() {
    firstMap.onZoomEnd(secondMap.lMap);
});

firstMap.addListener('mouseover', function() {
    firstMap.mouseover = true;
    console.log("mouseover");
});

firstMap.addListener('mouseout', function () {
    firstMap.mouseover = false;
    console.log("mouseout");
});

L.Control.geocoder({
    geocoder: L.Control.Geocoder.nominatim()
}).addTo(firstMap.lMap);


const secondMap = new Map('second-map', [51.505, -0.09], 13, TILE);
secondMap.createMap();
secondMap.createTileLayer();

L.Control.geocoder({
    geocoder: L.Control.Geocoder.nominatim()
}).addTo(secondMap.lMap);

secondMap.addListener('zoomend', function() {
    secondMap.onZoomEnd(firstMap.lMap);
});

secondMap.addListener('mouseover', function() {
    secondMap.mouseover = true;
    console.log("mouseover");
});

secondMap.addListener('mouseout', function () {
    secondMap.mouseover = false;
    console.log("mouseout");
});

const mapsSection = L.DomUtil.get("maps");
const mc = new Hammer(mapsSection);
mc.get('pinch').set({ enable: true });

mc.on("pinch", function () {
    pinch = true;
});

// TODO button to add map