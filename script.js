
;(function ($, window, document) {
    'use strict';

    var pluginName = 'mapeditor',
        defaults = {};

    function Plugin(element, options) {
        this.element = element;
        this.mode = 'MAP';
        this.allMarkers = [];
        this.allMarkersTrip = [];
        this.options = $.extend({}, defaults, options);

        this.addPlaceholder = function () {
            $('<div class="toolbar"><div id="marker">Marker</div><div id="trip">Trasa</div><input id="pac-input" class="controls" type="text" placeholder="Search Box"></div>').prependTo('body');
        };

        this.initGoogleMaps = function () {
            var map,
                pacinput,
                poly,
                that = this;

            function initialize() {
                var mapOptions = {
                        zoom: 13,
                        center: new google.maps.LatLng(52.2329379, 21.0611941),
                        streetViewControl: false,
                        mapTypeControl: false,
                        mapTypeId: google.maps.MapTypeId.TERRAIN
                    },
                    polyOptions = {
                        strokeColor: '#000000',
                        strokeOpacity: 0.57,
                        strokeWeight: 3
                    },
                    autocomplete,
                    infowindow,
                    marker;

                that.map = map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

                google.maps.event.addListener(map, 'click', function (e) {
                    that.marker(e.latLng, map);
                });

                poly = new google.maps.Polyline(polyOptions);
                poly.setMap(map);

                google.maps.event.addListener(map, 'click', function (e) {
                    that.trip(e, poly, map)
                });

                pacinput = document.getElementById('pac-input');

                autocomplete = new google.maps.places.Autocomplete(pacinput);
                autocomplete.bindTo('bounds', map);

                infowindow = new google.maps.InfoWindow();
                marker = new google.maps.Marker({
                    map: map,
                    anchorPoint: new google.maps.Point(0, -29)
                });

                google.maps.event.addListener(autocomplete, 'place_changed', function() {
                    infowindow.close();
                    marker.setVisible(false);

                    var place = autocomplete.getPlace(),
                        address;

                    if (!place.geometry) {
                        return;
                    }

                    if (place.geometry.viewport) {
                        map.fitBounds(place.geometry.viewport);
                    } else {
                        map.setCenter(place.geometry.location);
                        map.setZoom(17);
                    }

                    marker.setPosition(place.geometry.location);
                    marker.setVisible(true);

                    address = '';
                    if (place.address_components) {
                        address = [
                            (place.address_components[0] && place.address_components[0].short_name || ''),
                            (place.address_components[1] && place.address_components[1].short_name || ''),
                            (place.address_components[2] && place.address_components[2].short_name || '')
                        ].join(' ');
                    }

                    infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
                    infowindow.open(map, marker);
                });

            }

            google.maps.event.addDomListener(window, 'load', initialize);

        };

        this.marker = function (location, map) {

            if (this.mode !== 'MARKER') {
                return;
            }

            var marker = new google.maps.Marker({
                position: location,
                map: map,
                draggable: true
            });

            this.allMarkers.push(marker);

            google.maps.event.addListener(marker, 'rightclick', function () {

                if (this.mode !== 'MARKER') {
                    return;
                }

                var index = this.allMarkers.indexOf(marker);

                if (index > -1) {
                    this.allMarkers.splice(index, 1);
                }

                marker.setMap(null);

            }.bind(this));

        };

        this.markersDraggable = function (draggable) {

            this.allMarkers.forEach(function (marker) {
                marker.setDraggable(draggable);
            });

        };

        this.trip = function (e, poly, map) {

            if (this.mode !== 'TRIP') {
                return;
            }

            var path = poly.getPath();

            path.push(e.latLng);
            poly.setEditable(true);

            var marker = new google.maps.Marker({
                position: e.latLng,
                title: '#' + path.getLength(),
                map: map,
                draggable: true
            });

            this.allMarkersTrip.push(marker);

            google.maps.event.addListener(marker, 'rightclick', function () {

                if (this.mode !== 'TRIP') {
                    return;
                }

                var index = this.allMarkersTrip.indexOf(marker);

                if (index > -1) {
                    this.allMarkersTrip.splice(index, 1);
                    path.removeAt(index);
                }

                marker.setMap(null);

            }.bind(this));

        };

        this.static = function () {
            return 'http://maps.googleapis.com/maps/api/staticmap?center=' + this.map.getCenter() + '&zoom=' + this.map.getZoom() + '&size=600x300';
        };

        this.initControls = function () {

            var body = $('body');

            body.on('click', '#marker', function () {

                if (this.mode !== 'MARKER') {
                    this.mode = 'MARKER';
                    this.markersDraggable(true);

                } else {
                    this.mode = 'MAP';
                    this.markersDraggable(false);

                }

                $('#marker').toggleClass('active');
                $('#trip').removeClass('active')

            }.bind(this));

            body.on('click', '#trip', function () {

                if (this.mode !== 'TRIP') {
                    this.mode = 'TRIP';
                } else {
                    this.mode = 'MAP';
                }

                $('#trip').toggleClass('active');
                $('#marker').removeClass('active')

            }.bind(this));

        };

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {

        init: function() {
            console.log('init');
            this.initControls();
            this.addPlaceholder();
            this.initGoogleMaps();

        },

        yourOtherFunction: function(el, options) {
            console.log('yourOtherFunction');
        }
    };

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
            }
        });
    };

})(jQuery, window, document);
