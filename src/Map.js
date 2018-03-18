import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import Papa from 'papaparse';
import { featureCollection, point } from '@turf/helpers';
import centroid from '@turf/centroid';
import 'mapbox-gl/dist/mapbox-gl.css';

import MapConfig from './MapConfig';

class Map extends Component {

  constructor(props) {
    super(props);

    this.state = {
      active: null,
      lat: 40.7831,
      lng: -73.9712,
      shops: [],
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

  onParse(res) {
    const features = res.data.map((shop) => {
      console.log('shop', shop);
      const properties = {
        icon: 'cafe',
        name: shop.Name,
        address: shop['Street Combined'],
        phone: shop['Phone Number']
      };

      return point([shop.Longitude, shop.Latitude], properties);
    });

    const data = featureCollection(features);
    const mapCenter = centroid(data).geometry.coordinates;

    this.setState({
      shops: {
        type: 'geojson',
        data
      },
      lng: mapCenter[0],
      lat: mapCenter[1]
    });
  }

  onError() {
    throw new Error('Something went wrong while parsing the CVS');
  }

  getShopInfo() {
    return new Promise((resolve) => {
      Papa.parse(MapConfig.pointsUrl, {
        complete: this.onParse.bind(this),
        error: this.onError,
        download: true,
        dynamicTyping: true,
        header: true,
        skipEmptyLines: true
      });
    })
  }

  addShopLayer() {
    const layerName = 'shops';

    this.map.addLayer({
      id: layerName,
      type: 'symbol',
      source: this.state.shops,
      layout: {
        'icon-image': '{icon}-15',
        'icon-allow-overlap': true,
        'text-field': '{name}',
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 10,
        'text-offset': [0, 0.6],
        'text-anchor': 'top'
      }
    });

    this.map.on('mouseenter', layerName, (e) => {
      console.log('e', e);
      this.map.getCanvas().style.cursor = 'pointer';
      this.setState({
        active: e.features[0]
      });
    });

    this.map.on('mouseleave', layerName, () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  onMapLoad() {
    this.map.on('load', () => {
      this.map.flyTo({
        center: [this.state.lng, this.state.lat],
        zoom: 15
      });

      this.addShopLayer();
    });
  }

  setupMap() {
    const config = this.getConfig();
    mapboxgl.accessToken = MapConfig.token;
    this.map = new mapboxgl.Map(config);
    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
  }

  /* Lifecycle Methods */
  componentDidMount() {
    this.getShopInfo();
    this.setupMap();
    this.onMapLoad();
  }

  componentWillUnmount() {
    this.map.remove();
  }

  render() {
    const mapStyle = {
      bottom: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    };

    const infoStyle = {
      backgroundColor: '#fff',
      border: '1px solid black',
      borderRadius: '5px',
      height: '10%',
      left: 50,
      padding: '10px',
      position: 'absolute',
      textAlign: 'left',
      top: 50,
      width: '10%'
    };

    const addressStyle = {
      fontStyle: 'normal'
    };

    const contentStyle = {
      fontSize: '12px',
      margin: '8px 0'
    }

    const activeShop = this.state.active;
    const activeProps = activeShop ? this.state.active.properties : undefined;
    const activeDiv = activeProps ? (
      <div style={infoStyle}>
        <address style={addressStyle}>
          <p style={contentStyle}>{activeProps.address}</p>
          <a style={contentStyle} href="tel:{activeProps.phone}">{activeProps.phone}</a>
        </address>
      </div>
    ) : (<div style={infoStyle}>
        <p style={contentStyle}>Hover on a store to view its information.</p>
      </div>);

    return <main>
      <div style={mapStyle} ref={el => this.mapContainer = el} />
      {activeDiv}
    </main>;
  }
}

export default Map;
