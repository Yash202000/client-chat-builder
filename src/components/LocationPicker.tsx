import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { X, MapPin, Navigation, Check } from 'lucide-react';

// Create custom marker icon using inline SVG to avoid bundler issues
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="#dc2626" d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
      <circle cx="12" cy="8" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface LocationPickerProps {
  initialLocation?: { latitude: number; longitude: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  darkMode?: boolean;
}

// Component to handle map click events
const MapClickHandler: React.FC<{
  onLocationSelect: (lat: number, lng: number) => void;
}> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      e.originalEvent.stopPropagation();
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to recenter map when position changes
const MapController: React.FC<{ lat: number; lng: number; shouldRecenter: boolean }> = ({ lat, lng, shouldRecenter }) => {
  const map = useMap();

  useEffect(() => {
    if (shouldRecenter) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, shouldRecenter, map]);

  // Fix map size calculation after render
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationSelect,
  onClose,
  onConfirm,
  darkMode = false,
}) => {
  // Default to Dubai if no initial location provided
  const defaultLat = initialLocation?.latitude ?? 25.276987;
  const defaultLng = initialLocation?.longitude ?? 55.296249;

  const [position, setPosition] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng,
  });
  const [isLocating, setIsLocating] = useState(false);
  const [shouldRecenter, setShouldRecenter] = useState(false);
  const markerRef = useRef<L.Marker>(null);

  // Update position when initialLocation changes
  useEffect(() => {
    if (initialLocation) {
      setPosition({ lat: initialLocation.latitude, lng: initialLocation.longitude });
    }
  }, [initialLocation]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    onLocationSelect(lat, lng);
    setShouldRecenter(false); // Don't recenter on click, just update marker
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        onLocationSelect(latitude, longitude);
        setShouldRecenter(true); // Recenter map to new location
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLocating(false);
        alert('Unable to get your location. Please select manually on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMarkerDrag = () => {
    const marker = markerRef.current;
    if (marker) {
      const latlng = marker.getLatLng();
      setPosition({ lat: latlng.lat, lng: latlng.lng });
      onLocationSelect(latlng.lat, latlng.lng);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-[90%] max-w-md rounded-lg shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Select Location
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative" style={{ height: '300px', width: '100%' }}>
          <style>{`
            .leaflet-container {
              height: 100% !important;
              width: 100% !important;
              z-index: 1;
            }
            .leaflet-control-container {
              z-index: 2;
            }
          `}</style>
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
            dragging={true}
            doubleClickZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
              position={[position.lat, position.lng]}
              draggable={true}
              icon={customIcon}
              ref={markerRef}
              eventHandlers={{
                dragend: handleMarkerDrag,
              }}
            />
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            <MapController lat={position.lat} lng={position.lng} shouldRecenter={shouldRecenter} />
          </MapContainer>
        </div>

        {/* Coordinates Display */}
        <div className={`p-3 border-t ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
          <div className={`text-xs font-mono ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="font-semibold">Lat:</span> {position.lat.toFixed(6)}
            <span className="mx-2">|</span>
            <span className="font-semibold">Lng:</span> {position.lng.toFixed(6)}
          </div>
        </div>

        {/* Actions */}
        <div className={`flex items-center justify-between p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="flex items-center gap-1"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} />
            {isLocating ? 'Locating...' : 'My Location'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={onConfirm} className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4" />
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
