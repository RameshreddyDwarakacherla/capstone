import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import StatusBadge from '../UI/StatusBadge';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = ({
  height = '400px',
  center = [40.7589, -73.9851], // Default to NYC
  zoom = 13,
  issues = [],
  selectedIssue = null,
  currentLocation = null,
  onIssueSelect = () => {},
  onLocationChange = () => {},
  onMapClick = () => {},
  clickable = false,
  draggableMarker = false,
  className = ''
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const currentLocationMarkerRef = useRef(null);
  const clickMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Custom icon for different issue statuses
  const createCustomIcon = (status, priority) => {
    let color = '#3B82F6'; // Default blue
    
    if (status === 'resolved') color = '#10B981'; // Green
    else if (status === 'in_progress') color = '#F59E0B'; // Orange
    else if (status === 'rejected') color = '#EF4444'; // Red
    else if (priority === 'urgent') color = '#DC2626'; // Dark red
    else if (priority === 'high') color = '#EA580C'; // Orange red

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          border: 3px solid white;
          transform: rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            color: white;
            font-size: 12px;
            font-weight: bold;
            transform: rotate(45deg);
          ">!</div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Create markers layer
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Handle map clicks for location selection
    if (clickable) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        
        // Remove existing click marker
        if (clickMarkerRef.current) {
          map.removeLayer(clickMarkerRef.current);
        }

        // Add new click marker
        const marker = L.marker([lat, lng], {
          draggable: draggableMarker,
          icon: L.divIcon({
            className: 'custom-click-marker',
            html: `
              <div style="
                background-color: #3B82F6;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              "></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map);

        if (draggableMarker) {
          marker.on('dragend', (e) => {
            const newPos = e.target.getLatLng();
            onLocationChange({ lat: newPos.lat, lng: newPos.lng });
          });
        }

        clickMarkerRef.current = marker;
        onMapClick({ lat, lng });
        onLocationChange({ lat, lng });
      });
    }

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update issues markers
  useEffect(() => {
    if (!mapReady || !markersLayerRef.current) return;

    // Clear existing markers
    markersLayerRef.current.clearLayers();

    // Add issue markers
    issues.forEach((issue) => {
      if (!issue.location || !issue.location.coordinates) return;

      const [lng, lat] = issue.location.coordinates;
      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(issue.status, issue.priority)
      });

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <div style="margin-bottom: 8px;">
            <strong>${issue.title}</strong>
          </div>
          <div style="margin-bottom: 8px; font-size: 14px; color: #666;">
            ${issue.description?.substring(0, 100)}${issue.description?.length > 100 ? '...' : ''}
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span style="
              background: ${issue.status === 'resolved' ? '#10B981' : issue.status === 'in_progress' ? '#F59E0B' : '#6B7280'};
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
            ">${issue.status.replace('_', ' ')}</span>
            ${issue.priority === 'urgent' ? `
              <span style="
                background: #DC2626;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
              ">Urgent</span>
            ` : ''}
          </div>
          <div style="font-size: 12px; color: #888;">
            ${issue.address?.formatted || 'Address not available'}
          </div>
          <div style="font-size: 12px; color: #888; margin-top: 4px;">
            Reported: ${new Date(issue.createdAt).toLocaleDateString()}
          </div>
          <button 
            onclick="window.handleIssueClick('${issue._id}')"
            style="
              background: #3B82F6;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 12px;
              cursor: pointer;
              margin-top: 8px;
            "
          >
            View Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      marker.on('click', () => {
        onIssueSelect(issue);
      });

      markersLayerRef.current.addLayer(marker);
    });

    // Fit bounds to show all markers if there are issues
    if (issues.length > 0) {
      const group = new L.featureGroup(markersLayerRef.current.getLayers());
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [issues, mapReady, onIssueSelect]);

  // Update current location marker
  useEffect(() => {
    if (!mapReady || !currentLocation) return;

    // Remove existing current location marker
    if (currentLocationMarkerRef.current) {
      mapInstanceRef.current.removeLayer(currentLocationMarkerRef.current);
    }

    // Add current location marker
    const marker = L.marker([currentLocation.lat, currentLocation.lng], {
      icon: L.divIcon({
        className: 'current-location-marker',
        html: `
          <div style="
            background-color: #3B82F6;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
            animation: pulse 2s infinite;
          "></div>
          <style>
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
              70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
              100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
            }
          </style>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    }).addTo(mapInstanceRef.current);

    currentLocationMarkerRef.current = marker;
  }, [currentLocation, mapReady]);

  // Highlight selected issue
  useEffect(() => {
    if (!mapReady || !selectedIssue || !selectedIssue.location) return;

    const [lng, lat] = selectedIssue.location.coordinates;
    mapInstanceRef.current.setView([lat, lng], 16);
  }, [selectedIssue, mapReady]);

  // Global function for popup button clicks
  useEffect(() => {
    window.handleIssueClick = (issueId) => {
      const issue = issues.find(i => i._id === issueId);
      if (issue) {
        onIssueSelect(issue);
      }
    };

    return () => {
      delete window.handleIssueClick;
    };
  }, [issues, onIssueSelect]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
      />
      
      {/* Map overlay info */}
      {issues.length > 0 && (
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-[1000]">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900 dark:text-white">
              {issues.length} issue{issues.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Click instruction for clickable maps */}
      {clickable && (
        <div className="absolute bottom-4 left-4 bg-blue-600 text-white rounded-lg shadow-lg p-3 z-[1000]">
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4" />
            <span>Click on map to select location</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;