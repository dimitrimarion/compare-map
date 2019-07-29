
import L from "leaflet";
import './node_modules/leaflet/dist/leaflet.css';

const firstMap = L.map('first-map').setView([51.505, -0.09], 13);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoiZG1hcmlvbiIsImEiOiJjanlsb3owdmQwOXh1M21ydGtvbjA1MXRzIn0.gpxMygro3oXIlpxHK_ToYQ'
}).addTo(firstMap);

var secondMap = L.map('second-map').setView([51.505, -0.09], 13);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoiZG1hcmlvbiIsImEiOiJjanlsb3owdmQwOXh1M21ydGtvbjA1MXRzIn0.gpxMygro3oXIlpxHK_ToYQ'
}).addTo(secondMap);

var mouseoverFirstMap = false;
var mouseoverSecondMap = false;

firstMap.on('zoomend', function () {
    console.log("FIRST map zoomed");
    /* Check if the mouse is over the map.
       Avoid the case where the user zoom in and zoom out too rapidly
       triggering a infinite zoom in/zoom out on both map */
    if (mouseoverFirstMap) {
        onZoomEnd(firstMap, secondMap);
    }
});

firstMap.on('mouseover', function () {
    mouseoverFirstMap = true;
    console.log("mouseover");
});

firstMap.on('mouseout', function () {
    mouseoverFirstMap = false;
    console.log("mouseout");
});

secondMap.on('zoomend', function () {
    console.log("SECOND map zoomed");
    if (mouseoverSecondMap) {
        onZoomEnd(secondMap, firstMap);
    }
});

secondMap.on('mouseover', function () {
    mouseoverSecondMap = true;
    console.log("mouseover");
});

secondMap.on('mouseout', function () {
    mouseoverSecondMap = false;
    console.log("mouseout");
});

function onZoomEnd(zoomedMap, mapToZoom) {
    mapToZoom.setZoom(zoomedMap.getZoom());
}