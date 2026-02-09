import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-geometryutil';
import './LeafletMap.scss';

// Fix Leaflet icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Field {
  id: string;
  name: string;
  area: number;
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
}

export interface LeafletMapRef {
  clearDrawnItems: () => void;
  centerOnField: (field: Field) => void;
}

const LeafletMap = forwardRef<LeafletMapRef, LeafletMapProps>(({
  fields,
  selectedField,
  onFieldSelect,
  onAreaDrawn,
  center = [41.7151, 44.8271], // Georgia center
  zoom = 7,
  enableDrawing = true
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const fieldLayersRef = useRef<Map<string, L.Polygon>>(new Map());
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
    const area = L.GeometryUtil.geodesicArea(latlngs);
    return Math.round(area / 10000 * 100) / 100; // Convert to hectares with 2 decimals
  };

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Initialize map
    const map = L.map(mapContainer.current).setView(center, zoom);
    mapInstance.current = map;

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Add satellite layer option
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    });

    // Layer control
    const baseMaps = {
      'რუკა': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
      'სატელიტი': satelliteLayer
    };

    L.control.layers(baseMaps).addTo(map);

    // Add drawn items layer
    map.addLayer(drawnItemsRef.current);

    // Initialize draw control if enabled
    if (enableDrawing) {
      const drawControl = new L.Control.Draw({
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
      map.on(L.Draw.Event.CREATED, (event: any) => {
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

      map.on(L.Draw.Event.DRAWSTART, () => {
        setIsDrawing(true);
        drawnItemsRef.current.clearLayers();
      });

      map.on(L.Draw.Event.DRAWSTOP, () => {
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