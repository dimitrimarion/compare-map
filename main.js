import L from "leaflet";
import './node_modules/leaflet/dist/leaflet.css';  

var mymap = L.map('mapid').setView([51.505, -0.09], 13);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1IjoiZG1hcmlvbiIsImEiOiJjanlsb3owdmQwOXh1M21ydGtvbjA1MXRzIn0.gpxMygro3oXIlpxHK_ToYQ'
}).addTo(mymap);

mymap.on('zoom', onZoom);

function onZoom(event) {
    console.log("Zoom value: " + mymap.getZoom());
}


/*
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
}).addTo(mymap);
*/