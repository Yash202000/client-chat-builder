import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { X, MapPin, Navigation, Check } from 'lucide-react';

// Fix default marker icon paths for bundlers (Vite, Webpack, etc.)
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

console.log('[LocationPicker] Module loaded, default icon fixed');

interface LocationPickerProps {
  initialLocation?: { latitude: number; longitude: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;  // Now passes the confirmed location
  darkMode?: boolean;
}

// Component to handle map setup and recentering (no click-to-place to avoid sliding)
const MapSetup: React.FC<{
  recenterTo: { lat: number; lng: number } | null;
  onRecenterDone: () => void;
}> = ({ recenterTo, onRecenterDone }) => {
  const map = useMap();

  // Handle recentering when "My Location" is clicked
  React.useEffect(() => {
    if (recenterTo) {
      console.log('[MapSetup] Recentering to:', recenterTo);
      map.setView([recenterTo.lat, recenterTo.lng], map.getZoom(), { animate: true });
      onRecenterDone();
    }
  }, [recenterTo, map, onRecenterDone]);

  // Initial invalidateSize (run once)
  React.useEffect(() => {
    console.log('[MapSetup] Initial setup - invalidating size');
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

// Component to recenter map when position changes
const MapController: React.FC<{ lat: number; lng: number; shouldRecenter: boolean }> = ({ lat, lng, shouldRecenter }) => {
  const map = useMap();
  const hasInitialized = React.useRef(false);
  const lastRecenter = React.useRef<string>('');

  useEffect(() => {
    // Only recenter if flag is true AND position actually changed
    const posKey = `${lat},${lng}`;
    if (shouldRecenter && posKey !== lastRecenter.current) {
      lastRecenter.current = posKey;
      console.log('[MapController] Recentering to:', lat, lng);
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, shouldRecenter, map]);

  // Fix map size calculation after initial render (run once)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log('[MapController] Initial invalidateSize');
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
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
  const [recenterTo, setRecenterTo] = useState<{ lat: number; lng: number } | null>(null);
  const markerRef = useRef<L.Marker>(null);

  // Update position when initialLocation changes (only on mount or when explicitly changed by parent)
  // Skip if position is already set to the same values to prevent loops
  useEffect(() => {
    if (initialLocation &&
        (position.lat !== initialLocation.latitude || position.lng !== initialLocation.longitude)) {
      console.log('[LocationPicker] Syncing position from initialLocation:', initialLocation);
      setPosition({ lat: initialLocation.latitude, lng: initialLocation.longitude });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleLocationSelect = (lat: number, lng: number) => {
    console.log('[LocationPicker] handleLocationSelect called:', lat, lng);
    // Update local position state
    setPosition({ lat, lng });
    // Notify parent
    onLocationSelect(lat, lng);
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log('[LocationPicker] Got current location:', latitude, longitude);
        setPosition({ lat: latitude, lng: longitude });
        onLocationSelect(latitude, longitude);
        setRecenterTo({ lat: latitude, lng: longitude }); // Recenter map to new location
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
    console.log('[LocationPicker] Marker drag ended, marker ref:', marker);
    if (marker) {
      const latlng = marker.getLatLng();
      console.log('[LocationPicker] Marker dragged to:', latlng);
      setPosition({ lat: latlng.lat, lng: latlng.lng });
      onLocationSelect(latlng.lat, latlng.lng);
    }
  };

  // Log render for debugging
  console.log('[LocationPicker] Rendering with position:', position);

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
            .leaflet-marker-pane {
              z-index: 600 !important;
            }
            .leaflet-marker-icon {
              cursor: grab !important;
            }
            .leaflet-marker-icon:active {
              cursor: grabbing !important;
            }
            .location-marker {
              background: transparent !important;
              border: none !important;
            }
          `}</style>
          <MapContainer
            center={[defaultLat, defaultLng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
            dragging={true}
            doubleClickZoom={false}
            touchZoom={true}
            boxZoom={false}
            keyboard={false}
            tap={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
              position={[position.lat, position.lng]}
              draggable={true}
              ref={markerRef}
              eventHandlers={{
                dragstart: () => console.log('[Marker] Drag started'),
                drag: () => console.log('[Marker] Dragging'),
                dragend: handleMarkerDrag,
                add: () => console.log('[Marker] Added to map at', position),
              }}
            />
            <MapSetup
              recenterTo={recenterTo}
              onRecenterDone={() => setRecenterTo(null)}
            />
          </MapContainer>
        </div>

        {/* Instructions and Coordinates Display */}
        <div className={`p-3 border-t ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
          <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Drag the marker to select location
          </div>
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
            <Button
              size="sm"
              onClick={() => {
                console.log('[LocationPicker] Confirm clicked, position:', position);
                onConfirm(position.lat, position.lng);
              }}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
            >
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
