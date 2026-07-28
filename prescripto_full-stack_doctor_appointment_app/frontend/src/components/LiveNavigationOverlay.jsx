import React, { useState, useEffect, useRef } from 'react';

const LiveNavigationOverlay = ({
    activeRoute = null,
    destinationPlace = null,
    onCancelNavigation = () => {},
    onRecalculateRoute = () => {},
    onArrival = () => {}
}) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [userLocation, setUserLocation] = useState(activeRoute?.origin || { lat: 19.0760, lng: 72.8777 });
    const [isPaused, setIsPaused] = useState(false);
    const [remainingDistKm, setRemainingDistKm] = useState(activeRoute?.distanceKm || 0);
    const [remainingMin, setRemainingMin] = useState(activeRoute?.durationMinutes || 0);
    const [arrived, setArrived] = useState(false);
    const watchIdRef = useRef(null);

    // Watch live Geolocation updates
    useEffect(() => {
        if ('geolocation' in navigator) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setUserLocation({ lat, lng });

                    if (destinationPlace) {
                        const distKm = calculateDistance(lat, lng, destinationPlace.lat, destinationPlace.lng);
                        setRemainingDistKm(parseFloat(distKm.toFixed(2)));
                        setRemainingMin(Math.max(1, Math.round(distKm * 2.5)));

                        // Arrival Detection (< 0.03 km = 30 meters)
                        if (distKm <= 0.03 && !arrived) {
                            setArrived(true);
                            onArrival(destinationPlace);
                        }

                        // Off-route check (> 0.3 km off path) -> Auto Recalculate
                        if (distKm > (activeRoute?.distanceKm || 1) + 0.3) {
                            onRecalculateRoute({ lat, lng });
                        }
                    }
                },
                (err) => console.warn("Live Geolocation Watch Error:", err.message),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
            );
        }

        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [destinationPlace, activeRoute, arrived]);

    // Simulated Turn-by-Turn progression timer (for demonstration smooth updates)
    useEffect(() => {
        if (isPaused || arrived || !activeRoute?.steps?.length) return;

        const interval = setInterval(() => {
            setCurrentStepIndex((prev) => {
                const next = prev + 1;
                if (next < activeRoute.steps.length) {
                    return next;
                }
                return prev;
            });
        }, 8000); // Progress step every 8 seconds

        return () => clearInterval(interval);
    }, [isPaused, arrived, activeRoute]);

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    const steps = activeRoute?.steps || [];
    const currentStep = steps[currentStepIndex] || { instruction: 'Proceed towards medical destination', distanceMeters: 100 };

    const getTurnIcon = (modifier) => {
        if (modifier === 'left' || modifier === 'slight left') return '⬅️';
        if (modifier === 'right' || modifier === 'slight right') return '➡️';
        if (modifier === 'straight') return '⬆️';
        return '🚀';
    };

    return (
        <div className="absolute top-4 left-4 right-4 z-[1500] max-w-xl mx-auto font-sans">
            {/* Main Navigation Top Banner */}
            <div className="bg-slate-900/95 dark:bg-gray-950/95 backdrop-blur-xl text-white rounded-3xl p-4 shadow-2xl border border-blue-500/40 animate-slideDown">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shrink-0">
                            {getTurnIcon(currentStep.modifier)}
                        </div>
                        <div className="truncate">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-blue-400 block">
                                In-App Navigation Active
                            </span>
                            <h3 className="font-extrabold text-base leading-snug text-white truncate">
                                {currentStep.instruction}
                            </h3>
                        </div>
                    </div>

                    <button
                        onClick={onCancelNavigation}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 p-2 rounded-2xl transition text-xs font-bold shrink-0"
                        title="Cancel Navigation"
                    >
                        ✕ Stop
                    </button>
                </div>

                {/* Metrics & Control Buttons */}
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                        <div>
                            <span className="text-gray-400 block text-[10px]">DISTANCE</span>
                            <span className="font-extrabold text-sm text-emerald-400">{remainingDistKm} km</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block text-[10px]">ETA</span>
                            <span className="font-extrabold text-sm text-amber-400">~{remainingMin} mins</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block text-[10px]">DESTINATION</span>
                            <span className="font-semibold text-gray-200 truncate max-w-[120px] block">{destinationPlace?.name || 'Facility'}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className="bg-slate-800 hover:bg-slate-700 text-gray-200 px-3 py-1.5 rounded-xl font-medium transition"
                        >
                            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                        </button>
                        <button
                            onClick={() => onRecalculateRoute(userLocation)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-medium shadow transition"
                        >
                            🔄 Recalc
                        </button>
                    </div>
                </div>
            </div>

            {/* Arrival Celebration Modal */}
            {arrived && (
                <div className="fixed inset-0 z-[2500] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-emerald-500 animate-scaleUp">
                        <span className="text-5xl block mb-3">🎉🏥</span>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You Have Arrived!</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                            You have safely reached <strong>{destinationPlace?.name}</strong>. The AI doctor companion is available whenever you need further medical guidance.
                        </p>
                        <button
                            onClick={() => {
                                setArrived(false);
                                onCancelNavigation();
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl shadow-lg transition"
                        >
                            Complete Navigation
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveNavigationOverlay;
