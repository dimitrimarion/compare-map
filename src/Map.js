'use strict'
import cloneLayer from 'leaflet-clonelayer';
import PubSub from 'pubsub-js';
import { computeDestinationPoint, getGreatCircleBearing } from 'geolib';


const ATTRIBUTION = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
var ZOOM = 'zoom';
var DRAW_CREATED = 'draw_created';


function Map(element, coordinate, zoomLevel, tile) {
    this.mouseover = false;
    this.lMap = null;
    this.drawnItems = null;
    this.element = element;
    this.coordinate = coordinate;
    this.zoomLevel = zoomLevel;
    this.tile = tile;
    this.tileLayers = [];
    this.baseLayers = {};
}

Map.prototype.createMap = function () {
    this.lMap = L.map(this.element, {
        center: this.coordinate,
        zoom: this.zoomLevel,
        layers: this.tileLayers
    });

    let controlLayer = L.control.layers(this.baseLayers).addTo(this.lMap);
    controlLayer.setPosition("bottomright");
};

Map.prototype.createTileLayer = function () {
    let streetsLayer = L.tileLayer(this.tile, {
        attribution: ATTRIBUTION,
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiZG1hcmlvbiIsImEiOiJjanlsb3owdmQwOXh1M21ydGtvbjA1MXRzIn0.gpxMygro3oXIlpxHK_ToYQ'
    });

    let satelliteLayer = L.tileLayer(this.tile, {
        attribution: ATTRIBUTION,
        maxZoom: 18,
        id: 'mapbox.satellite',
        accessToken: 'pk.eyJ1IjoiZG1hcmlvbiIsImEiOiJjanlsb3owdmQwOXh1M21ydGtvbjA1MXRzIn0.gpxMygro3oXIlpxHK_ToYQ'
    });


    this.tileLayers.push(streetsLayer);

    this.baseLayers = {
        "Map": streetsLayer,
        "Satellite": satelliteLayer
    }

};

Map.prototype.addListener = function (event, fct) {
    this.lMap.on(event, fct);
};

Map.prototype.onZoomEnd = function () {

    if (this.zoomLevel != this.lMap.getZoom()) {
        this.zoomLevel = this.lMap.getZoom();
        PubSub.publish(ZOOM, this);
    }
};


Map.prototype.sub = function (map) {
    PubSub.subscribe(ZOOM, function (msg, data) {
        if (map.element != data.element) {
            map.lMap.setZoom(data.zoomLevel);
            map.zoomLevel = data.zoomLevel;
        }
    });

    PubSub.subscribe(DRAW_CREATED, function (msg, data) {
        if (map.element != data.element) {

            let layer = cloneLayer(data.layer);

            let dataMapCenter = data.lMap.getCenter();
            let mapCenter = map.lMap.getCenter();

            if (data.type == "circle") {

                let latLongLayer = data.layer.getLatLng();
                let distanceToCenter = data.layer.getLatLng().distanceTo(dataMapCenter);

                let destinationPoint = computeDestPoint(dataMapCenter, mapCenter, distanceToCenter, latLongLayer);

                if (destinationPoint != null) {
                    layer.setLatLng(L.latLng(destinationPoint.latitude, destinationPoint.longitude));
                }
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

            } else if (data.type == "polyline") {
                let latLngPoints = layer.getLatLngs();
                let destLatLngPoints = [];

                for (let latLng of latLngPoints) {
                    let distanceToCenter = latLng.distanceTo(dataMapCenter);
                    let destinationPoint = computeDestPoint(dataMapCenter, mapCenter, distanceToCenter, latLng);

                    destLatLngPoints.push([destinationPoint.latitude, destinationPoint.longitude]);
                }

                layer.setLatLngs(destLatLngPoints);
            } else if (data.type == "polygon") {
                let latLngPoints = layer.getLatLngs();
                let destLatLngPoints = [];

                for (let latLngs of latLngPoints) {
                    let destLatLng = [];
                    for (let latLng of latLngs) {

                        let distanceToCenter = latLng.distanceTo(dataMapCenter);
                        let destinationPoint = computeDestPoint(dataMapCenter, mapCenter, distanceToCenter, latLng);

                        destLatLng.push([destinationPoint.latitude, destinationPoint.longitude]);
                    }
                    destLatLngPoints.push(destLatLng);
                }
                layer.setLatLngs(destLatLngPoints);
            }
            map.drawnItems.addLayer(layer);
        }

        // TODO add comment on different circle size    
    });
}

Map.prototype.addDrawControl = function () {

    this.drawnItems = new L.FeatureGroup().addTo(this.lMap);

    let options = {
        position: 'bottomleft',
        draw: {
            marker: false,
            circlemarker: false
        },
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

Map.prototype.createGeoCoder = function () {
    L.Control.geocoder({
        geocoder: L.Control.Geocoder.nominatim()
    }).addTo(this.lMap);
}

Map.prototype.buildMap = function () {
    this.createTileLayer();
    this.createMap();
    this.sub(this);
    this.addDrawControl();
    this.createGeoCoder();
}

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

module.exports = Map;