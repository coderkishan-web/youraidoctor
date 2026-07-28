import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom Category SVG Marker Icons using L.divIcon (Vite-safe & ultra crisp)
const createCategoryIcon = (category, isSelected = false) => {
    const config = {
        hospitals: { bg: '#EF4444', icon: '🏥', label: 'Hospital' },
        pharmacies: { bg: '#10B981', icon: '💊', label: 'Pharmacy' },
        blood_banks: { bg: '#991B1B', icon: '🩸', label: 'Blood Bank' },
        ambulances: { bg: '#F97316', icon: '🚑', label: 'Ambulance' },
        clinics: { bg: '#14B8A6', icon: '🩺', label: 'Clinic' },
        diagnostics: { bg: '#8B5CF6', icon: '🔬', label: 'Diagnostics' },
        police: { bg: '#1E3A8A', icon: '👮', label: 'Police' },
        fire_stations: { bg: '#D97706', icon: '🚒', label: 'Fire Station' },
        oxygen_providers: { bg: '#0EA5E9', icon: '🩺', label: 'Oxygen' }
    };

    const cfg = config[category] || config.hospitals;
    const size = isSelected ? 44 : 36;
    const borderWidth = isSelected ? 4 : 2;
    const shadow = isSelected ? '0 0 16px rgba(239,68,68,0.8)' : '0 4px 10px rgba(0,0,0,0.3)';

    const html = `
        <div style="
            width: ${size}px;
            height: ${size}px;
            background-color: ${cfg.bg};
            border: ${borderWidth}px solid #FFFFFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '22px' : '18px'};
            box-shadow: ${shadow};
            transition: all 0.3s ease;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
        ">
            ${cfg.icon}
        </div>
    `;

    return L.divIcon({
        className: 'custom-medical-marker',
        html: html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2]
    });
};

// Pulsing User Location Marker
const createUserIcon = () => {
    const html = `
        <div style="position: relative; width: 36px; height: 36px;">
            <div style="
                position: absolute;
                width: 36px; height: 36px;
                background-color: rgba(59, 130, 246, 0.4);
                border-radius: 50%;
                animation: pulse 1.8s infinite ease-in-out;
            "></div>
            <div style="
                position: absolute;
                top: 8px; left: 8px;
                width: 20px; height: 20px;
                background-color: #2563EB;
                border: 3px solid #FFFFFF;
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(37, 99, 235, 0.8);
            "></div>
        </div>
        <style>
            @keyframes pulse {
                0% { transform: scale(0.8); opacity: 0.8; }
                100% { transform: scale(2.2); opacity: 0; }
            }
        </style>
    `;

    return L.divIcon({
        className: 'custom-user-marker',
        html: html,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
    });
};

// Map Recenter Controller Component
const MapRecenterController = ({ center, zoom, bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } else if (center) {
            map.flyTo(center, zoom || 14, { duration: 1.2 });
        }
    }, [center, zoom, bounds, map]);
    return null;
};

const MedicalMapEngine = ({
    userLocation = { lat: 19.0760, lng: 72.8777 },
    places = [],
    selectedPlaceId = null,
    onSelectPlace = () => {},
    onStartNavigation = () => {},
    routePolyline = [],
    activeCategory = 'hospitals',
    darkMode = false,
    height = '100%'
}) => {
    const [mapCenter, setMapCenter] = useState([userLocation.lat, userLocation.lng]);
    const [mapZoom, setMapZoom] = useState(14);
    const [mapBounds, setMapBounds] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(darkMode);

    // Update map view when userLocation or selectedPlace changes
    useEffect(() => {
        if (selectedPlaceId) {
            const found = places.find(p => p.id === selectedPlaceId);
            if (found) {
                setMapCenter([found.lat, found.lng]);
                setMapZoom(16);
                setMapBounds(null);
                return;
            }
        }
        if (places && places.length > 0) {
            const points = [[userLocation.lat, userLocation.lng], ...places.map(p => [p.lat, p.lng])];
            setMapBounds(points);
        } else {
            setMapCenter([userLocation.lat, userLocation.lng]);
            setMapZoom(14);
            setMapBounds(null);
        }
    }, [selectedPlaceId, places, userLocation]);

    const handleRecenter = () => {
        setMapCenter([userLocation.lat, userLocation.lng]);
        setMapZoom(15);
        setMapBounds(null);
    };

    // Dark/Light tile layers
    const lightTileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const darkTileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    return (
        <div className="relative w-full overflow-hidden rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800" style={{ height }}>
            {/* Map Controls Header */}
            <div className="absolute top-3 right-3 z-[1000] flex items-center space-x-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <button
                    onClick={handleRecenter}
                    title="My Current Location"
                    className="p-1.5 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    📍
                </button>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    title="Toggle Dark/Light Map Mode"
                    className="p-1.5 text-gray-700 dark:text-gray-200 hover:text-amber-500 transition-colors"
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>
            </div>

            {/* Main Leaflet Map */}
            <MapContainer
                center={[userLocation.lat, userLocation.lng]}
                zoom={14}
                scrollWheelZoom={true}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url={isDarkMode ? darkTileUrl : lightTileUrl}
                />

                <MapRecenterController center={mapCenter} zoom={mapZoom} bounds={mapBounds} />

                {/* User Current Location Marker */}
                <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon()}>
                    <Popup>
                        <div className="p-1 font-sans text-xs">
                            <strong className="text-blue-600 block text-sm">📍 Your Current GPS Location</strong>
                            <span>Latitude: {userLocation.lat.toFixed(4)}, Longitude: {userLocation.lng.toFixed(4)}</span>
                        </div>
                    </Popup>
                </Marker>

                {/* Facility Category Markers */}
                {places.map((place) => {
                    const isSelected = place.id === selectedPlaceId;
                    return (
                        <Marker
                            key={place.id}
                            position={[place.lat, place.lng]}
                            icon={createCategoryIcon(place.category || activeCategory, isSelected)}
                            eventHandlers={{
                                click: () => onSelectPlace(place.id)
                            }}
                        >
                            <Popup>
                                <div className="p-2 min-w-[200px] font-sans">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{place.name}</h4>
                                        <span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-medium">
                                            {place.isOpen24x7 ? '24x7 Open' : 'Open'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">{place.address}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                        <span>🚗 {place.distanceKm} km ({place.estimatedTimeMin} mins)</span>
                                        <span>⭐ {place.rating}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => onStartNavigation(place)}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition shadow"
                                        >
                                            🚀 Navigate
                                        </button>
                                        <a
                                            href={`tel:${place.phone}`}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition shadow"
                                        >
                                            📞 Call
                                        </a>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Navigation Active Polyline */}
                {routePolyline && routePolyline.length > 0 && (
                    <Polyline
                        positions={routePolyline}
                        pathOptions={{
                            color: '#2563EB',
                            weight: 6,
                            opacity: 0.85,
                            lineCap: 'round',
                            lineJoin: 'round',
                            dashArray: '1, 10',
                            dashOffset: '0'
                        }}
                    />
                )}
            </MapContainer>
        </div>
    );
};

export default MedicalMapEngine;
