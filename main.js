import L from "leaflet";
import './node_modules/leaflet/dist/leaflet.css';
import './node_modules/leaflet-draw/dist/leaflet.draw.css'
import "hammerjs";
import "leaflet-control-geocoder";
import './node_modules/leaflet-control-geocoder/dist/Control.Geocoder.css'
import PubSub from 'pubsub-js';
import 'leaflet-draw';
import cloneLayer from 'leaflet-clonelayer';
import {
    computeDestinationPoint, getRhumbLineBearing, getGreatCircleBearing, getDistance
} from 'geolib';


const TILE = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}';
const ATTRIBUTION = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';

function Map(element, coordinate, zoomLevel, tile) {
    this.mouseover = false;
    this.lMap = null;
    this.drawnItems = null;
    this.element = element;
    this.coordinate = coordinate;
    this.zoomLevel = zoomLevel;
    this.tile = tile;
}

Map.prototype.createMap = function () {
    this.lMap = L.map(this.element).setView(this.coordinate, this.zoomLevel);
};

Map.prototype.createTileLayer = function () {
    if (this.lMap != null) {
        L.tileLayer(this.tile, {
            attribution: ATTRIBUTION,
            maxZoom: 18,
            id: 'mapbox.streets',
            accessToken: 'pk.eyJ1IjoiZG1hcmlvbiIsImEiOiJjanlsb3owdmQwOXh1M21ydGtvbjA1MXRzIn0.gpxMygro3oXIlpxHK_ToYQ'
        }).addTo(this.lMap);
    }
};

Map.prototype.addListener = function (event, fct) {
    this.lMap.on(event, fct);
};

Map.prototype.onZoomEnd = function () {
    // let zoom = map.getZoom();

    this.zoomLevel = this.lMap.getZoom();
    /* Check if the mouse is over the map.
       Avoid the case where the user zoom in and zoom out too rapidly
       triggering a infinite zoom in/zoom out on both map 
    */
    console.log("zoomend: " + this.element);
    if (this.mouseover || pinch) {
        console.log("zoomend");
        PubSub.publish(MY_TOPIC, this);
        //mapToZoom.lMap.setZoom(this.zoomLevel);
    }
    /*if (map.lMap !== this.lMap) {
        this.lMap.setZoomLevel(zoom);
        this.zoomLevel = zoom;
    }*/
};


Map.prototype.sub = function (map) {
    PubSub.subscribe(MY_TOPIC, function (msg, data) {
        if (map.element != data.element) {
            map.lMap.setZoom(data.zoomLevel);
        }
    });

    PubSub.subscribe(DRAW_CREATED, function (msg, data) {
        if (map.element != data.element) {
            console.log("draw created");

            let layer = cloneLayer(data.layer);

            let dataMapCenter = data.lMap.getCenter();
            let mapCenter = map.lMap.getCenter();
            let destinationPoint = null;

            if (data.type == "circle") {

                let latLongLayer = data.layer.getLatLng();
                let distanceToCenter = data.layer.getLatLng().distanceTo(dataMapCenter);

                destinationPoint = computeDestPoint(dataMapCenter, mapCenter,  distanceToCenter, latLongLayer);

                if (destinationPoint != null) {
                    layer.setLatLng(L.latLng(destinationPoint.latitude, destinationPoint.longitude));
                }
                /*
                console.log("distance to center: " + distanceToCenter + " meters");
                console.log("data map center: " + dataMapCenter.lat + " " + dataMapCenter.lng);
                console.log("bearing: " + bearing);

                console.log("center: " + mapCenter.lat + " " + mapCenter.lng);
                console.log("destinationPoint: " + destinationPoint.latitude + " " + destinationPoint.longitude);*/
            } else if (data.type == "rectangle") {
                let bounds = layer.getBounds();

                let northEast = bounds.getNorthEast();
                let southWest = bounds.getSouthWest();

                let northEastToCenter = northEast.distanceTo(dataMapCenter);


                let northEastDestinationPoint = computeDestPoint(dataMapCenter, mapCenter, northEastToCenter, northEast);
                
                let southWestToCenter = southWest.distanceTo(dataMapCenter);

                let southWestDestinationPoint = computeDestPoint(dataMapCenter, mapCenter, southWestToCenter, southWest);

                layer.setBounds(L.latLngBounds(L.latLng(northEastDestinationPoint.latitude, northEastDestinationPoint.longitude)
                , L.latLng(southWestDestinationPoint.latitude, southWestDestinationPoint.longitude)));

            }




            map.drawnItems.addLayer(layer);

            // TODO add comment on different circle size    
        }
    });
}

Map.prototype.addDrawControl = function () {

    this.drawnItems = new L.FeatureGroup().addTo(this.lMap);

    let options = {
        edit: {
            featureGroup: this.drawnItems,
            remove: true
        }
    };


    let drawControl = new L.Control.Draw(options);

    this.lMap.addControl(drawControl);

}

Map.prototype.drawCreated = function (event) {
    let layer = event.layer;

    this.drawnItems.addLayer(layer);

    PubSub.publish(DRAW_CREATED, { element: this.element, layer: layer, lMap: this.lMap, type: event.layerType });
};

function computeDestPoint(dataMapCenter, mapCenter, distanceToCenter, point) {

    let bearing = getGreatCircleBearing(
        { latitude: dataMapCenter.lat, longitude: dataMapCenter.lng },
        { latitude: point.lat, longitude: point.lng }
    )

    let destinationPoint = computeDestinationPoint(
        { latitude: mapCenter.lat, longitude: mapCenter.lng },
        distanceToCenter,
        bearing
    );

    return destinationPoint;
}

var pinch = false;
var MY_TOPIC = 'zoom';
var DRAW_CREATED = 'draw_created';

function createListener(map) {
    map.addListener('zoomend', function () {
        map.onZoomEnd();
    });

    map.addListener('mouseover', function () {
        map.mouseover = true;
        //console.log("mouseover");
    });

    map.addListener('mouseout', function () {
        map.mouseover = false;
        //console.log("mouseout");
    });

    map.addListener(L.Draw.Event.CREATED, function (event) {
        console.log("L.Draw.Event.CREATED");
        map.drawCreated(event);
    })
}


const firstMap = new Map('map1', [51.505, -0.09], 13, TILE);
firstMap.createMap();
firstMap.createTileLayer();
createListener(firstMap);
firstMap.sub(firstMap);
firstMap.addDrawControl();


L.Control.geocoder({
    geocoder: L.Control.Geocoder.nominatim()
}).addTo(firstMap.lMap);


const secondMap = new Map('map2', [51.505, -0.09], 13, TILE);
secondMap.createMap();
secondMap.createTileLayer();
createListener(secondMap);
secondMap.sub(secondMap);
secondMap.addDrawControl();

L.Control.geocoder({
    geocoder: L.Control.Geocoder.nominatim()
}).addTo(secondMap.lMap);


const mapsSection = L.DomUtil.get("maps");

const mc = new Hammer(mapsSection);
mc.get('pinch').set({ enable: true });

mc.on("pinch", function () {
    pinch = true;
});

const button = document.querySelector("button");
var mapId = 3;

button.addEventListener("click", function () {

    const mapp = document.createElement("div");
    mapp.setAttribute("id", `map${mapId}`);
    mapp.setAttribute("class", "map");

    mapsSection.appendChild(mapp);

    const map = new Map(`map${mapId}`, [51.505, -0.09], 13, TILE);
    map.createMap();
    map.createTileLayer();
    createListener(map);
    map.sub(map);
    map.addDrawControl();

    L.Control.geocoder({
        geocoder: L.Control.Geocoder.nominatim()
    }).addTo(map.lMap);

    mapId += 1;

    if (mapId == 5) {
        button.setAttribute("disabled", "");
    }

});
// TODO button to add map
