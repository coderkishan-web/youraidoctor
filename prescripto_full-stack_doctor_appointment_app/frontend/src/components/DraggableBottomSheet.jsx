import React, { useState, useRef, useEffect } from 'react';

const CATEGORY_TABS = [
    { id: 'hospitals', label: 'Hospitals', icon: '🏥' },
    { id: 'pharmacies', label: '24x7 Pharmacy', icon: '💊' },
    { id: 'blood_banks', label: 'Blood Bank', icon: '🩸' },
    { id: 'ambulances', label: 'Ambulance', icon: '🚑' },
    { id: 'clinics', label: 'Clinics', icon: '🩺' },
    { id: 'diagnostics', label: 'Diagnostics', icon: '🔬' },
    { id: 'police', label: 'Police', icon: '👮' },
    { id: 'fire_stations', label: 'Fire Station', icon: '🚒' },
];

const DraggableBottomSheet = ({
    places = [],
    selectedPlaceId = null,
    onSelectPlace = () => {},
    onStartNavigation = () => {},
    activeCategory = 'hospitals',
    onChangeCategory = () => {},
    topRecommendation = null
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [detailModalPlace, setDetailModalPlace] = useState(null);
    const listRef = useRef(null);
    const cardRefs = useRef({});

    // Auto-scroll sheet to selected card when selectedPlaceId changes
    useEffect(() => {
        if (selectedPlaceId && cardRefs.current[selectedPlaceId]) {
            cardRefs.current[selectedPlaceId].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedPlaceId]);

    const top = topRecommendation || places[0] || null;

    return (
        <div
            className={`flex flex-col bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl rounded-t-3xl transition-all duration-300 ease-in-out ${
                isExpanded ? 'h-[65vh]' : 'h-[160px]'
            }`}
        >
            {/* Drag Handle & Toggle Bar */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-2.5 flex flex-col items-center justify-center cursor-pointer select-none border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-t-3xl transition"
            >
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mb-1"></div>
                <div className="flex items-center space-x-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <span>{isExpanded ? '▼ Swipe Down to Collapse' : '▲ Swipe Up for Nearby Medical Places'}</span>
                </div>
            </div>

            {/* COLLAPSED STATE SUMMARY BAR */}
            {!isExpanded && top && (
                <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white text-xl shrink-0 shadow-md">
                            🏥
                        </div>
                        <div className="truncate">
                            <span className="text-[11px] font-bold tracking-wider uppercase text-rose-600 dark:text-rose-400 block">
                                Nearest Facility • {top.distanceKm} km
                            </span>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{top.name}</h4>
                            <p className="text-xs text-gray-500 truncate">ETA ~{top.estimatedTimeMin} mins • {top.isOpen24x7 ? '24x7 Open' : 'Open'}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                        <a
                            href={`tel:${top.phone}`}
                            className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl hover:bg-emerald-100 transition shadow-sm"
                            title="Call Immediately"
                        >
                            📞
                        </a>
                        <button
                            onClick={() => onStartNavigation(top)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition flex items-center space-x-1"
                        >
                            <span>🚀 Navigate</span>
                        </button>
                    </div>
                </div>
            )}

            {/* EXPANDED STATE VIEW */}
            {isExpanded && (
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Category Service Tabs Header */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto flex space-x-2 no-scrollbar">
                        {CATEGORY_TABS.map(tab => {
                            const active = activeCategory === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onChangeCategory(tab.id)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                                        active
                                            ? 'bg-blue-600 text-white shadow-md scale-105'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Scrollable Facility Cards List */}
                    <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                        {places.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <span className="text-3xl block mb-2">🔍</span>
                                <p className="text-sm font-medium">Searching nearby medical facilities...</p>
                            </div>
                        ) : (
                            places.map(place => {
                                const isSelected = place.id === selectedPlaceId;
                                return (
                                    <div
                                        key={place.id}
                                        ref={el => (cardRefs.current[place.id] = el)}
                                        onClick={() => onSelectPlace(place.id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                            isSelected
                                                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 shadow-lg ring-2 ring-blue-500/20'
                                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-base">{place.name}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{place.address}</p>
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                                                place.isOpen24x7 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                                {place.isOpen24x7 ? '24x7 Open' : 'Open'}
                                            </span>
                                        </div>

                                        {/* Metrics Row */}
                                        <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-300 my-2.5">
                                            <span className="font-semibold text-blue-600 dark:text-blue-400">📍 {place.distanceKm} km</span>
                                            <span>⏱️ ETA ~{place.estimatedTimeMin} mins</span>
                                            <span>⭐ {place.rating}</span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onStartNavigation(place);
                                                }}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-xl text-xs shadow-sm transition"
                                            >
                                                🚀 Navigate
                                            </button>
                                            <a
                                                href={`tel:${place.phone}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-3 rounded-xl text-xs shadow-sm transition"
                                            >
                                                📞 Call
                                            </a>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDetailModalPlace(place);
                                                }}
                                                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2 px-3 rounded-xl text-xs transition"
                                            >
                                                ℹ️ Details
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {detailModalPlace && (
                <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 animate-fadeIn">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{detailModalPlace.name}</h3>
                            <button onClick={() => setDetailModalPlace(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                        </div>
                        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
                            <p><strong>Category:</strong> {detailModalPlace.category?.replace('_', ' ').toUpperCase()}</p>
                            <p><strong>Address:</strong> {detailModalPlace.address}</p>
                            <p><strong>Distance:</strong> {detailModalPlace.distanceKm} km (Estimated Travel Time: {detailModalPlace.estimatedTimeMin} mins)</p>
                            <p><strong>Phone:</strong> {detailModalPlace.phone}</p>
                            <p><strong>Status:</strong> {detailModalPlace.isOpen24x7 ? '24x7 Open' : 'Open'}</p>
                            <p><strong>Specialties:</strong> {detailModalPlace.specialties?.join(', ') || 'Emergency Medicine'}</p>
                            <p><strong>Confidence Ranking Score:</strong> {detailModalPlace.confidenceScore || 90}/100</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    onStartNavigation(detailModalPlace);
                                    setDetailModalPlace(null);
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition"
                            >
                                Start Navigation
                            </button>
                            <a
                                href={`tel:${detailModalPlace.phone}`}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs text-center transition"
                            >
                                Call Facility
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DraggableBottomSheet;
