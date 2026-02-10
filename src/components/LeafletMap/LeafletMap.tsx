import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-geometryutil';
import './LeafletMap.scss';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface Field {
  id: string;
  name: string;
  area: number;
  crop?: string;
  coordinates: string;
  polygonData?: any;
}

interface LeafletMapProps {
  fields: Field[];
  selectedField: Field | null;
  onFieldSelect: (field: Field) => void;
  onAreaDrawn: (area: number, coordinates: any[]) => void;
  center?: [number, number];
  zoom?: number;
  enableDrawing?: boolean;
  cadastralCode?: string;
  onCadastralClick?: (cadastralCode: string, area: number) => void;
}

interface LeafletMapRef {
  clearDrawnItems: () => void;
  centerOnField: (field: Field) => void;
  searchCadastralCode: (code: string) => void;
}

const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(({
  fields,
  selectedField,
  onFieldSelect,
  onAreaDrawn,
  center = [41.7151, 44.8271], // Georgia center
  zoom = 7,
  enableDrawing = true,
  cadastralCode,
  onCadastralClick
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const fieldLayersRef = useRef<Map<string, L.Polygon>>(new Map());
  const cadastralLayerRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const [isDrawing, setIsDrawing] = useState(false);

  useImperativeHandle(ref, () => ({
    clearDrawnItems: () => {
      drawnItemsRef.current.clearLayers();
    },
    centerOnField: (field: Field) => {
      if (mapInstance.current && field.polygonData) {
        const bounds = L.latLngBounds(field.polygonData);
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      } else if (mapInstance.current && field.coordinates) {
        const coords = parseCoordinates(field.coordinates);
        if (coords.length > 0) {
          mapInstance.current.setView(coords[0], 15);
        }
      }
    },
    searchCadastralCode: async (code: string) => {
      if (!mapInstance.current) return;

      try {
        // Import cadastral service
        const { cadastralService } = await import('../../services/cadastralService');

        // Use the cadastral service to search
        const parcel = await cadastralService.searchByCadastralCode(code);

        if (parcel && parcel.geometry) {
          console.log('Found cadastral parcel:', parcel);

          // Clear previous cadastral search results
          cadastralLayerRef.current.clearLayers();

          // Create GeoJSON feature from parcel
          const feature = {
            type: 'Feature',
            properties: {
              cadastral_code: parcel.cadastralCode,
              area: parcel.area,
              municipality: parcel.municipality,
              village: parcel.village
            },
            geometry: parcel.geometry
          };

          // Add the cadastral parcel to map
          const layer = L.geoJSON(feature as any, {
            style: {
              color: '#FF5722',
              weight: 3,
              opacity: 0.8,
              fillOpacity: 0.2,
              fillColor: '#FF5722'
            }
          });

          cadastralLayerRef.current.addLayer(layer);

          // Zoom to the parcel
          const bounds = layer.getBounds();
          mapInstance.current.fitBounds(bounds, { padding: [50, 50] });

          // Notify parent component
          if (onCadastralClick) {
            onCadastralClick(parcel.cadastralCode, parcel.area);
          }
        } else {
          console.log('Cadastral parcel not found for code:', code);
          if (onCadastralClick) {
            onCadastralClick(code, 0);
          }
        }
      } catch (error) {
        console.error('Error searching cadastral code:', error);
      }
    }
  }));

  const parseCoordinates = (coordString: string): L.LatLngExpression[] => {
    if (!coordString) return [];

    try {
      // Handle different coordinate formats
      const pairs = coordString.split(';').map(pair => pair.trim());
      return pairs.map(pair => {
        const [lat, lng] = pair.split(',').map(v => parseFloat(v.trim()));
        return [lat, lng] as L.LatLngTuple;
      }).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return [];
    }
  };

  const calculatePolygonArea = (latlngs: L.LatLng[]): number => {
    // Calculate area in square meters and convert to hectares
    const area = (L as any).GeometryUtil.geodesicArea(latlngs);
    return Math.round(area / 10000 * 100) / 100; // Convert to hectares with 2 decimals
  };

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Initialize map
    const map = L.map(mapContainer.current).setView(center, zoom);
    mapInstance.current = map;

    // Create tile layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    });

    // Georgian cadastral map layers
    const georgianMapLayer = L.tileLayer('https://maps.gov.ge/geoserver/gwc/service/tms/1.0.0/napr:ortho_2015@EPSG:3857@png/{z}/{x}/{y}.png', {
      attribution: '© maps.gov.ge',
      maxZoom: 20,
      tms: true
    });

    // Add satellite layer as default
    satelliteLayer.addTo(map);

    // Try different cadastral layer endpoints and formats
    // Option 1: Direct tile service
    const cadastralTileLayer = L.tileLayer('https://maps.registry.ge/aerial/cadastre/{z}/{x}/{y}.png', {
      attribution: '© საჯარო რეესტრი',
      maxZoom: 20,
      minZoom: 14, // Cadastral codes usually visible at higher zoom
      opacity: 0.8
    });

    // Option 2: WMS service
    const cadastralLayer = L.tileLayer.wms('https://gis.napr.gov.ge/arcgis/services/Cadastre/MapServer/WMSServer', {
      layers: '0,1,2', // Try different layer numbers
      format: 'image/png',
      transparent: true,
      attribution: '© NAPR',
      version: '1.3.0',
      maxZoom: 20
    });

    // Option 3: Custom tile layer that shows cadastral codes
    const cadastralNumbersLayer = L.layerGroup();

    // City/Municipality boundaries layer
    const cityBoundariesLayer = L.tileLayer.wms('https://maps.gov.ge/geoserver/napr/wms', {
      layers: 'napr:municipalities',
      format: 'image/png',
      transparent: true,
      attribution: '© NAPR',
      maxZoom: 20,
      styles: 'municipality_boundaries'
    });

    // District boundaries layer
    const districtBoundariesLayer = L.tileLayer.wms('https://maps.gov.ge/geoserver/napr/wms', {
      layers: 'napr:districts',
      format: 'image/png',
      transparent: true,
      attribution: '© NAPR',
      maxZoom: 20
    });

    // Settlement boundaries layer
    const settlementBoundariesLayer = L.tileLayer.wms('https://maps.gov.ge/geoserver/napr/wms', {
      layers: 'napr:settlements',
      format: 'image/png',
      transparent: true,
      attribution: '© NAPR',
      maxZoom: 20
    });

    // Layer control
    const baseMaps = {
      'რუკა': osmLayer,
      'სატელიტი': satelliteLayer,
      'საქართველოს რუკა': georgianMapLayer
    };

    const overlayMaps = {
      'საკადასტრო ნაკვეთები': cadastralLayer,
      'საკადასტრო ნომრები': cadastralTileLayer,
      'მუნიციპალიტეტების საზღვრები': cityBoundariesLayer,
      'რაიონების საზღვრები': districtBoundariesLayer,
      'დასახლებების საზღვრები': settlementBoundariesLayer
    };

    L.control.layers(baseMaps, overlayMaps).addTo(map);

    // Add layers by default
    cadastralTileLayer.addTo(map); // Try the tile layer first
    cityBoundariesLayer.addTo(map);

    // Handle zoom to show/hide cadastral layer
    map.on('zoomend', () => {
      const currentZoom = map.getZoom();

      // Show cadastral layer only at zoom 14+
      if (currentZoom >= 14) {
        if (!map.hasLayer(cadastralTileLayer)) {
          cadastralTileLayer.addTo(map);
        }
        // Also try to load cadastral codes dynamically
        loadVisibleCadastralCodes();
      } else {
        map.removeLayer(cadastralTileLayer);
      }
    });

    // Function to load cadastral codes for visible area
    const loadVisibleCadastralCodes = async () => {
      if (!map || map.getZoom() < 14) return;

      const bounds = map.getBounds();
      const minLat = bounds.getSouth();
      const maxLat = bounds.getNorth();
      const minLng = bounds.getWest();
      const maxLng = bounds.getEast();

      try {
        // Import cadastral service
        const { cadastralService } = await import('../../services/cadastralService');

        // Get parcels in view
        const parcels = await cadastralService.getParcelsByBoundingBox(
          minLng, minLat, maxLng, maxLat, 50
        );

        // Clear previous labels
        cadastralNumbersLayer.clearLayers();

        // Add labels for each parcel
        parcels.forEach(parcel => {
          if (parcel.coordinates && parcel.coordinates.length > 0) {
            // Calculate center of parcel
            let centerLat = 0, centerLng = 0;
            parcel.coordinates.forEach(coord => {
              centerLng += coord[0];
              centerLat += coord[1];
            });
            centerLat /= parcel.coordinates.length;
            centerLng /= parcel.coordinates.length;

            // Add label marker
            const label = L.divIcon({
              className: 'cadastral-label',
              html: `<span>${parcel.cadastralCode}</span>`,
              iconSize: [100, 20] as L.PointExpression,
              iconAnchor: [50, 10]
            });

            const marker = L.marker([centerLat, centerLng], {
              icon: label,
              interactive: false
            });

            cadastralNumbersLayer.addLayer(marker);
          }
        });

        // Add layer to map if not already added
        if (!map.hasLayer(cadastralNumbersLayer)) {
          cadastralNumbersLayer.addTo(map);
        }
      } catch (error) {
        console.log('Could not load cadastral codes:', error);
      }
    };

    // Add drawn items layer
    map.addLayer(drawnItemsRef.current);

    // Add cadastral search results layer
    map.addLayer(cadastralLayerRef.current);

    // Add Georgian cities and regions with permanent labels
    const georgianCities = [
      { name: 'თბილისი', lat: 41.7151, lng: 44.8271, type: 'capital' },
      { name: 'ბათუმი', lat: 41.6168, lng: 41.6367, type: 'city' },
      { name: 'ქუთაისი', lat: 42.2679, lng: 42.6946, type: 'city' },
      { name: 'რუსთავი', lat: 41.5494, lng: 45.0087, type: 'city' },
      { name: 'გორი', lat: 41.9842, lng: 44.1158, type: 'city' },
      { name: 'ზუგდიდი', lat: 42.5088, lng: 41.8709, type: 'city' },
      { name: 'ფოთი', lat: 42.1461, lng: 41.6717, type: 'city' },
      { name: 'თელავი', lat: 41.9198, lng: 45.4732, type: 'city' },
      { name: 'მცხეთა', lat: 41.8451, lng: 44.7193, type: 'city' },
      { name: 'ახალციხე', lat: 41.6390, lng: 42.9821, type: 'city' },
      { name: 'ოზურგეთი', lat: 41.9225, lng: 42.0066, type: 'city' },
      { name: 'სენაკი', lat: 42.2704, lng: 42.0675, type: 'city' },
      { name: 'ხაშური', lat: 41.9941, lng: 43.5997, type: 'city' },
      { name: 'ბორჯომი', lat: 41.8527, lng: 43.4129, type: 'city' },
      { name: 'ამბროლაური', lat: 42.5212, lng: 43.1625, type: 'city' },
      { name: 'ახალქალაქი', lat: 41.4055, lng: 43.4863, type: 'city' },
      { name: 'გურჯაანი', lat: 41.7434, lng: 45.8011, type: 'city' },
      { name: 'ყვარელი', lat: 41.9548, lng: 45.8172, type: 'city' },
      { name: 'სიღნაღი', lat: 41.6111, lng: 45.9219, type: 'city' },
      { name: 'ლაგოდეხი', lat: 41.8268, lng: 46.2767, type: 'city' },
      { name: 'საგარეჯო', lat: 41.7336, lng: 45.3315, type: 'city' },
      { name: 'მარნეული', lat: 41.4759, lng: 44.8089, type: 'city' },
      { name: 'ბოლნისი', lat: 41.4476, lng: 44.5385, type: 'city' },
      { name: 'გარდაბანი', lat: 41.4640, lng: 45.0930, type: 'city' },
      { name: 'კასპი', lat: 41.9255, lng: 44.4257, type: 'city' },
      { name: 'ჭიათურა', lat: 42.2981, lng: 43.2989, type: 'city' },
      { name: 'ხონი', lat: 42.3226, lng: 42.4206, type: 'city' },
      { name: 'წყალტუბო', lat: 42.3411, lng: 42.6004, type: 'city' },
      { name: 'ტყიბული', lat: 42.5917, lng: 42.9958, type: 'city' },
      { name: 'საჩხერე', lat: 42.3449, lng: 43.4186, type: 'city' },
      { name: 'ქობულეთი', lat: 41.8205, lng: 41.7749, type: 'city' },
      { name: 'ლანჩხუთი', lat: 42.0902, lng: 42.0323, type: 'city' },
      { name: 'ჩოხატაური', lat: 42.0319, lng: 42.3214, type: 'city' },
      { name: 'აბაშა', lat: 42.2042, lng: 42.2042, type: 'city' },
      { name: 'ცაგერი', lat: 42.6508, lng: 42.7658, type: 'city' },
      { name: 'ლენტეხი', lat: 42.7886, lng: 42.7222, type: 'city' },
      { name: 'მესტია', lat: 43.0459, lng: 42.7278, type: 'city' },
      { name: 'დუშეთი', lat: 42.0875, lng: 44.6914, type: 'city' },
      { name: 'თიანეთი', lat: 41.9453, lng: 44.9614, type: 'city' },
      { name: 'წალკა', lat: 41.6000, lng: 44.0890, type: 'city' },
      { name: 'თეთრიწყარო', lat: 41.5441, lng: 44.4615, type: 'city' },
      { name: 'დმანისი', lat: 41.4833, lng: 44.2088, type: 'city' },
      { name: 'ნინოწმინდა', lat: 41.2646, lng: 43.5913, type: 'city' },
      { name: 'ადიგენი', lat: 41.6819, lng: 42.6981, type: 'city' },
      { name: 'ასპინძა', lat: 41.5736, lng: 43.2619, type: 'city' },
      { name: 'ბაღდათი', lat: 42.0747, lng: 42.8239, type: 'city' },
      { name: 'ვანი', lat: 42.0839, lng: 42.5066, type: 'city' },
      { name: 'თერჯოლა', lat: 42.1817, lng: 42.9686, type: 'city' },
      { name: 'ზესტაფონი', lat: 42.1100, lng: 43.0525, type: 'city' },
      { name: 'ხარაგაული', lat: 42.0236, lng: 43.1936, type: 'city' },
      { name: 'ჩხოროწყუ', lat: 42.6117, lng: 42.2058, type: 'city' },
      { name: 'მარტვილი', lat: 42.4142, lng: 42.3792, type: 'city' },
      { name: 'წალენჯიხა', lat: 42.6047, lng: 42.0689, type: 'city' },
      { name: 'ხობი', lat: 42.3158, lng: 41.8994, type: 'city' },
      { name: 'ონი', lat: 42.5794, lng: 43.4425, type: 'city' },
      { name: 'შუახევი', lat: 41.6300, lng: 42.1511, type: 'city' },
      { name: 'ქედა', lat: 41.5761, lng: 41.9456, type: 'city' },
      { name: 'ხულო', lat: 41.6456, lng: 42.3067, type: 'city' },
      { name: 'ხელვაჩაური', lat: 41.5825, lng: 41.5675, type: 'city' },
      { name: 'დედოფლისწყარო', lat: 41.4669, lng: 46.1192, type: 'city' }
    ];

    // Create layer groups for cities
    const cityMarkersGroup = L.layerGroup().addTo(map);
    const cityLabelsGroup = L.layerGroup().addTo(map);

    // Add city markers with permanent labels
    georgianCities.forEach(city => {
      // Add a circle marker for each city
      const markerSize = city.type === 'capital' ? 8 : 5;
      const markerColor = city.type === 'capital' ? '#FF0000' : '#0066CC';

      const circleMarker = L.circleMarker([city.lat, city.lng], {
        radius: markerSize,
        fillColor: markerColor,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      });

      // Add popup with city name
      circleMarker.bindPopup(`<strong>${city.name}</strong>`);
      cityMarkersGroup.addLayer(circleMarker);

      // Add permanent label for each city
      const labelClass = city.type === 'capital' ? 'city-label-capital' : 'city-label-regular';
      const myIcon = L.divIcon({
        className: labelClass,
        html: `<span>${city.name}</span>`,
        iconSize: [100, 20] as L.PointExpression,
        iconAnchor: [50, -5]
      });

      const labelMarker = L.marker([city.lat, city.lng], {
        icon: myIcon,
        interactive: false
      });

      cityLabelsGroup.addLayer(labelMarker);
    });

    // Handle zoom changes to show/hide labels
    map.on('zoomend', () => {
      const currentZoom = map.getZoom();
      const mapDiv = mapContainer.current;
      if (mapDiv) {
        mapDiv.setAttribute('data-zoom', currentZoom.toString());
      }

      // Show regular city labels only at zoom level 8 and above
      if (currentZoom < 8) {
        map.removeLayer(cityLabelsGroup);
        // Keep only capital label
        georgianCities.filter(c => c.type === 'capital').forEach(city => {
          const myIcon = L.divIcon({
            className: 'city-label-capital',
            html: `<span>${city.name}</span>`,
            iconSize: [100, 20] as L.PointExpression,
            iconAnchor: [50, -5]
          });
          L.marker([city.lat, city.lng], {
            icon: myIcon,
            interactive: false
          }).addTo(map);
        });
      } else {
        if (!map.hasLayer(cityLabelsGroup)) {
          map.addLayer(cityLabelsGroup);
        }
      }
    });

    // Load and add regional boundaries with better styling
    const regionBoundariesUrl = 'https://raw.githubusercontent.com/bumbeishvili/Assets/master/geojson/georgia/regions.json';

    fetch(regionBoundariesUrl)
      .then(response => response.json())
      .then(data => {
        L.geoJSON(data, {
          style: {
            color: '#8B4513',
            weight: 2,
            opacity: 0.8,
            fillColor: 'transparent',
            fillOpacity: 0,
            dashArray: '10, 5'
          },
          onEachFeature: (feature, layer) => {
            if (feature.properties && feature.properties.NAME_1) {
              // Add region name as tooltip
              layer.bindTooltip(feature.properties.NAME_1, {
                permanent: false,
                direction: 'center',
                className: 'region-tooltip'
              });
            }
          }
        }).addTo(map);
      })
      .catch(error => console.log('Using fallback boundaries'));

    // Handle map clicks for cadastral info
    map.on('click', async (e: L.LeafletMouseEvent) => {
      if (!onCadastralClick) return;

      // Query cadastral parcel at clicked location
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      try {
        // Import cadastral service
        const { cadastralService } = await import('../../services/cadastralService');

        // Get parcel at clicked location
        const parcel = await cadastralService.getParcelAtLocation(lat, lng);

        if (parcel) {
          console.log('Found cadastral parcel at location:', parcel);

          // Highlight the clicked parcel
          cadastralLayerRef.current.clearLayers();

          const feature = {
            type: 'Feature',
            properties: {
              cadastral_code: parcel.cadastralCode,
              area: parcel.area
            },
            geometry: parcel.geometry
          };

          const layer = L.geoJSON(feature as any, {
            style: {
              color: '#4CAF50',
              weight: 3,
              opacity: 0.8,
              fillOpacity: 0.3,
              fillColor: '#4CAF50'
            }
          });

          cadastralLayerRef.current.addLayer(layer);

          // Show popup with cadastral info
          const popup = L.popup()
            .setLatLng([lat, lng])
            .setContent(`
              <div>
                <strong>საკადასტრო კოდი:</strong> ${parcel.cadastralCode}<br/>
                <strong>ფართობი:</strong> ${(parcel.area / 10000).toFixed(4)} ჰა<br/>
                ${parcel.municipality ? `<strong>მუნიციპალიტეტი:</strong> ${parcel.municipality}<br/>` : ''}
                ${parcel.village ? `<strong>სოფელი:</strong> ${parcel.village}` : ''}
              </div>
            `)
            .openOn(mapInstance.current!);

          // Notify parent component
          onCadastralClick(parcel.cadastralCode, parcel.area);
        }
      } catch (error) {
        console.error('Error fetching cadastral info:', error);
      }
    });

    // Initialize draw control if enabled
    if (enableDrawing) {
      const drawControl = new (L.Control as any).Draw({
        position: 'topright',
        draw: {
          polygon: {
            allowIntersection: false,
            drawError: {
              color: '#e1e100',
              message: 'პოლიგონი არ უნდა იკვეთებოდეს!'
            },
            shapeOptions: {
              color: '#2196F3',
              weight: 3,
              opacity: 0.7,
              fillOpacity: 0.3
            }
          },
          polyline: false,
          rectangle: {
            shapeOptions: {
              color: '#2196F3',
              weight: 3,
              opacity: 0.7,
              fillOpacity: 0.3
            }
          },
          circle: false,
          marker: false,
          circlemarker: false
        },
        edit: {
          featureGroup: drawnItemsRef.current,
          remove: true
        }
      });

      map.addControl(drawControl);

      // Handle draw events
      map.on('draw:created' as any, (event: any) => {
        const layer = event.layer;
        drawnItemsRef.current.addLayer(layer);

        if (event.layerType === 'polygon' || event.layerType === 'rectangle') {
          const latlngs = layer.getLatLngs()[0];
          const area = calculatePolygonArea(latlngs);
          const coordinates = latlngs.map((latlng: L.LatLng) => [latlng.lat, latlng.lng]);

          // Show area on the polygon
          layer.bindPopup(`ფართობი: ${area} ჰა`).openPopup();

          // Notify parent component
          onAreaDrawn(area, coordinates);
        }
      });

      map.on('draw:drawstart' as any, () => {
        setIsDrawing(true);
        drawnItemsRef.current.clearLayers();
      });

      map.on('draw:drawstop' as any, () => {
        setIsDrawing(false);
      });
    }

    // Add scale control
    L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: false
    }).addTo(map);

    // Add fullscreen button
    const fullscreenControl = L.Control.extend({
      options: {
        position: 'topleft'
      },
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', container);
        button.href = '#';
        button.title = 'სრული ეკრანი';
        button.innerHTML = '⛶';
        button.style.fontSize = '18px';
        button.style.lineHeight = '30px';
        button.style.width = '30px';
        button.style.height = '30px';
        button.style.display = 'block';
        button.style.textAlign = 'center';

        L.DomEvent.on(button, 'click', function(e) {
          L.DomEvent.preventDefault(e);
          if (!document.fullscreenElement) {
            mapContainer.current?.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        });

        return container;
      }
    });

    map.addControl(new fullscreenControl());

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update fields on map
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing field layers
    fieldLayersRef.current.forEach(layer => {
      mapInstance.current?.removeLayer(layer);
    });
    fieldLayersRef.current.clear();

    // Add field polygons
    fields.forEach(field => {
      let polygon: L.Polygon | null = null;

      if (field.polygonData && Array.isArray(field.polygonData)) {
        // Use saved polygon data
        polygon = L.polygon(field.polygonData, {
          color: selectedField?.id === field.id ? '#FF5722' : '#4CAF50',
          weight: selectedField?.id === field.id ? 3 : 2,
          opacity: 0.7,
          fillOpacity: selectedField?.id === field.id ? 0.4 : 0.3
        });
      } else if (field.coordinates) {
        // Parse coordinates string
        const coords = parseCoordinates(field.coordinates);
        if (coords.length > 2) {
          polygon = L.polygon(coords as L.LatLngExpression[], {
            color: selectedField?.id === field.id ? '#FF5722' : '#4CAF50',
            weight: selectedField?.id === field.id ? 3 : 2,
            opacity: 0.7,
            fillOpacity: selectedField?.id === field.id ? 0.4 : 0.3
          });
        } else if (coords.length === 1) {
          // Single point - create a marker
          const marker = L.marker(coords[0] as L.LatLngExpression);
          marker.bindPopup(`
            <div>
              <strong>${field.name}</strong><br/>
              ფართობი: ${field.area} ჰა<br/>
              კულტურა: ${field.crop || 'არ არის მითითებული'}
            </div>
          `);
          marker.on('click', () => onFieldSelect(field));
          marker.addTo(mapInstance.current!);
          return;
        }
      }

      if (polygon) {
        polygon.bindPopup(`
          <div>
            <strong>${field.name}</strong><br/>
            ფართობი: ${field.area} ჰა<br/>
            კულტურა: ${field.crop || 'არ არის მითითებული'}
          </div>
        `);

        polygon.on('click', () => onFieldSelect(field));
        polygon.addTo(mapInstance.current!);
        fieldLayersRef.current.set(field.id, polygon);
      }
    });
  }, [fields, selectedField]);

  // Center on selected field
  useEffect(() => {
    if (!mapInstance.current || !selectedField) return;

    const layer = fieldLayersRef.current.get(selectedField.id);
    if (layer) {
      mapInstance.current.fitBounds(layer.getBounds(), { padding: [50, 50] });
      layer.openPopup();
    } else if (selectedField.coordinates) {
      const coords = parseCoordinates(selectedField.coordinates);
      if (coords.length > 0) {
        mapInstance.current.setView(coords[0], 15);
      }
    }
  }, [selectedField]);

  return (
    <div className="leaflet-map-container">
      <div ref={mapContainer} className="leaflet-map" />
      {isDrawing && (
        <div className="drawing-hint">
          დააწკაპუნეთ რუკაზე პოლიგონის დასახატად
        </div>
      )}
    </div>
  );
});

LeafletMap.displayName = 'LeafletMap';

export default LeafletMap;
export type { LeafletMapRef };