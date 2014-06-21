
// because our plugin can share living space not only with The Digitals well written plugins, by ';' we ensure nobody brake our script
// we passing parameters to our closure to ensure nobody did something nasty with names
// we assuming ES5, so no need to pass undefined
;(function ($, window, document) {
    'use strict';

    // some defaults values go here
    var pluginName = 'mapeditor',
        defaults = {
            position: {
                lat: 52.2329379,
                lng: 21.0611941,
                zoom: 13
            }
        },
        instance;

    // plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.mapCanvas = $('.mapeditor-map', '#mapeditor');
        this.searchInput = $('.mapeditor-search-input', '#mapeditor');
        this.mode = 'MAP';
        this.allMarkers = [];
        this.allMarkersTrip = [];
        this.options = $.extend({}, defaults, options);
        this.didPassData = _.isEmpty(options) ? true : false;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {

        // initialize logic
        init: function() {
            this.addPlaceholder();
            this.menu();
            this.initGoogleMaps();
            this.autocomplete();

            if (!this.didPassData) {
                this.loadData();
            }

        },

        // initialize Google Maps and add event listeners to it
        initGoogleMaps: function () {
            var mapOptions = {
                    zoom: this.options.position.zoom,
                    center: new google.maps.LatLng(this.options.position.lat, this.options.position.lng),
                    streetViewControl: false,
                    mapTypeControl: false,
                    mapTypeId: google.maps.MapTypeId.TERRAIN
                },
                polyOptions = {
                    strokeColor: '#000000',
                    strokeOpacity: 0.57,
                    strokeWeight: 3
                };

            // create new Google Map
            this.map = new google.maps.Map($(this.mapCanvas.selector)[0], mapOptions);

            // crete new Polyline instance and add associate it with map
            this.poly = new google.maps.Polyline(polyOptions);
            this.poly.setMap(this.map);

            // handle click event
            google.maps.event.addListener(this.map, 'click', function (e) {
                this.marker(e.latLng);
                this.trip(e);
            }.bind(this));

        },

        // add marker to the map
        marker: function (location) {

            if (this.mode !== 'MARKER' && this.didPassData) {
                return;
            }

            var marker = new google.maps.Marker({
                position: location,
                map: this.map,
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

        },

        // add marker and poly to the map
        trip: function (e) {

            if (this.mode !== 'TRIP' && this.didPassData) {
                return;
            }

            var path = this.poly.getPath(),
                marker;

            path.push(e.latLng);
            this.poly.setEditable(true);

            marker = new google.maps.Marker({
                position: e.latLng,
                title: '#' + path.getLength(),
                map: this.map,
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

        },

        // load JSON with map data
        loadData: function () {

            if (this.isCorruptedData()) {
                return;
            }

            this.options.markers.forEach(function (marker) {
                this.marker(new google.maps.LatLng(marker.lat, marker.lng), this.map);
            }.bind(this));

            this.options.path.forEach(function (point) {
                this.trip({latLng: new google.maps.LatLng(point.lat, point.lng)}, this.poly, this.map);
            }.bind(this));

            this.didPassData = true;
        },

        // export JSON with map data
        exportData: function () {
            var data,
                markers = [],
                path = [];


            this.allMarkers.forEach(function (marker, i) {
                markers[i] = {
                    lat: marker.getPosition().lat(),
                    lng: marker.getPosition().lng(),
                    str: marker.getPosition().toString()
                }
            });

            this.allMarkersTrip.forEach(function (point, i) {
                path[i] = {
                    lat: point.getPosition().lat(),
                    lng: point.getPosition().lng()
                }
            });

            data = {
                position: {
                    lat: this.map.getCenter().lat(),
                    lng: this.map.getCenter().lng(),
                    zoom: this.map.getZoom()
                },
                markers: markers,
                path: path,
                staticurl: this.getStaticUrl()
            };

            return JSON.stringify(data);

        },

        getStaticUrl: function () {
            var markers = 'markers=',
                path = 'path=';

            this.allMarkers.forEach(function (marker) {
                markers += marker.getPosition().lat() + ',' + marker.getPosition().lng() + '|';
            });

            this.allMarkersTrip.forEach(function (point) {
                path += point.getPosition().lat() + ',' + point.getPosition().lng() + '|';
                markers += point.getPosition().lat() + ',' + point.getPosition().lng() + '|';
            });

            markers = markers.substring(0, markers.length - 1);
            path = path.substring(0, path.length - 1);

            return encodeURI('http://maps.googleapis.com/maps/api/staticmap?center=' + this.map.getCenter().lat() + ',' + this.map.getCenter().lng() + '&zoom=' + this.map.getZoom() + '&size=1280x900&' + markers + '&' + path + '&maptype=terrain');
        },

        // handle place search
        autocomplete: function () {

            var autocomplete = new google.maps.places.Autocomplete($(this.searchInput.selector)[0]),
                infowindow = new google.maps.InfoWindow(),
                marker;

            autocomplete.bindTo('bounds', this.map);

            marker = new google.maps.Marker({
                map: this.map,
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

                    this.map.fitBounds(place.geometry.viewport);

                } else {

                    this.map.setCenter(place.geometry.location);
                    this.map.setZoom(17);

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
                infowindow.open(this.map, marker);

            }.bind(this));
        },

        // append plugin HTML scaffold
        addPlaceholder: function () {
            $('<div id="mapeditor"><div class="mapeditor-toolbar"><ul><li class="mapeditor-marker">Marker</li><li class="mapeditor-trip">Trasa</li><li class="mapeditor-search"><input class="mapeditor-search-input" type="text" placeholder="Szukaj..." autofocus="autofocus" /></li></ul></div><div class="mapeditor-map"></div></div>').appendTo(this.element);
        },

        // add menu listeners
        // change mode
        menu: function () {

            $('#mapeditor').on('click', '.mapeditor-marker', function () {

                if (this.mode !== 'MARKER') {
                    this.mode = 'MARKER';
                    this.markersDraggable(true);

                } else {
                    this.mode = 'MAP';
                    this.markersDraggable(false);

                }

                $('.mapeditor-marker').toggleClass('active');
                $('.mapeditor-trip').removeClass('active');

            }.bind(this));

            $('#mapeditor').on('click', '.mapeditor-trip', function () {

                if (this.mode !== 'TRIP') {
                    this.mode = 'TRIP';
                } else {
                    this.mode = 'MAP';
                }

                $('.mapeditor-trip').toggleClass('active');
                $('.mapeditor-marker').removeClass('active');

            }.bind(this));

        },

        // helpers
        markersDraggable: function (draggable) {

            this.allMarkers.forEach(function (marker) {
                marker.setDraggable(draggable);
            });

        },

        isCorruptedData: function () {
            if (this.options && this.options.position && this.options.markers && this.options.path) {
                return false;
            }

            console.error('Supported JSON object has to contain properties: position, markers, and path.');
            return true;

        }

    };

    // we want it to be a singleton
    $.fn[pluginName] = function (options) {

        if (instance && options === 'getjson') {
            return instance.exportData();
        }

        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                instance = new Plugin(this, options);
                $.data(this, 'plugin_' + pluginName, instance);
            }
        });
    };

}(jQuery, window, document));
