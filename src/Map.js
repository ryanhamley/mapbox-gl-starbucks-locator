import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import Papa from 'papaparse';
import { featureCollection, point } from '@turf/helpers';
import centroid from '@turf/centroid';
import MapConfig from './MapConfig';
import 'mapbox-gl/dist/mapbox-gl.css';

class Map extends Component {

  constructor(props) {
    super(props);

    this.state = {
      lat: 40.7831,
      lng: -73.9712,
      stores: [],
      zoom: 9
    };
  }

  /* Custom Methods */
  getConfig() {
    const { lat, lng, zoom } = this.state;

    return Object.assign({}, MapConfig.style, {
      center: [lng, lat],
      container: this.mapContainer,
      zoom
    });
  }

  // createPopupContent(store) {
  //   return `<strong></strong>
  //   <br />
  //   <a href="tel:${store['Phone Number']}">${store['Phone Number']}</a>`;
  // }

  onParse(res) {
    const features = res.data.map((store) => {
      const properties = {
        // popupContent: this.createPopupContent(store),
        icon: 'cafe',
        title: store.Name
      };

      return point([store.Longitude, store.Latitude], properties);
    });

    const data = featureCollection(features);
    const mapCenter = centroid(data).geometry.coordinates;

    this.setState({
      stores: {
        type: 'geojson',
        data
      },
      lng: mapCenter[0],
      lat: mapCenter[1]
    });
  }

  getStoreInfo() {
    Papa.parse(MapConfig.pointsUrl, {
      complete: this.onParse.bind(this),
      download: true,
      dynamicTyping: true,
      header: true,
      skipEmptyLines: true
    });
  }

  // handlePopup() {
  //   const layerName = 'stores';
  //   const popup = new mapboxgl.Popup({
  //     closeButton: false,
  //     closeOnClick: false
  //   });
  //
  //   this.map.on('mouseenter', layerName, (e) => {
  //     this.map.getCanvas().style.cursor = 'pointer';
  //
  //     const feature = e.features[0];
  //     let coordinates = feature.geometry.coordinates.slice();
  //     const description = feature.properties.popupContent;
  //
  //     while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
  //       coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  //     }
  //
  //     popup.setLngLat(coordinates)
  //       .setHTML(description)
  //       .addTo(this.map);
  //   });
  //
  //   this.map.on('mouseleave', layerName, (e) => {
  //     this.map.getCanvas().style.cursor = '';
  //     popup.remove();
  //   });
  // }

  onMapLoad() {
    this.map.on('load', () => {
      this.map.flyTo({
        center: [this.state.lng, this.state.lat],
        zoom: 15
      });

      this.map.addLayer({
        id: 'stores',
        type: 'symbol',
        source: this.state.stores,
        layout: {
          'icon-image': '{icon}-15',
          'icon-allow-overlap': true,
          'text-field': '{title}',
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 10,
          'text-offset': [0, 0.6],
          'text-anchor': 'top'
        }
      });

      // this.handlePopup();
    });
  }

  /* Lifecycle Methods */
  componentDidMount() {
    const config = this.getConfig();
    this.getStoreInfo();

    mapboxgl.accessToken = MapConfig.token;
    this.map = new mapboxgl.Map(config);
    this.map.addControl(new mapboxgl.NavigationControl());
    this.onMapLoad();
  }

  componentWillUnmount() {
    this.map.remove();
  }

  render() {
    const style = {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '100%'
    };

    return <div style={style} ref={el => this.mapContainer = el} />;
  }
}

export default Map;
