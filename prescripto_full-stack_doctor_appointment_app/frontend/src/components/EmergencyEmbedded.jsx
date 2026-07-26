import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon issue in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icons
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const hospitalIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

// First Aid KB keyed by keywords
const FIRST_AID_KB = {
    'heart attack': {
        icon: '🫀', color: 'red',
        title: 'Possible Heart Attack',
        steps: [
            '1. Call 108 or 112 immediately',
            '2. Have the person sit or lie down calmly',
            '3. Loosen any tight clothing (collar, belt)',
            '4. If conscious & not allergic: give 1 Aspirin (300mg) to chew slowly',
            '5. Do NOT give food or water',
            '6. If unconscious and not breathing: start CPR (30 compressions + 2 breaths)',
            '7. Stay with the person until ambulance arrives',
        ],
        ambulance: '108',
    },
    'stroke': {
        icon: '🧠', color: 'red',
        title: 'Possible Stroke',
        steps: [
            '1. Call 108 immediately — time is critical!',
            '2. Use FAST: Face drooping, Arm weak, Speech slurred, Time to call',
            '3. Lay person flat on their back, head slightly elevated',
            '4. Do NOT give food, water or medicines',
            '5. Keep person calm and still',
            '6. Note exact time symptoms started — tell doctors',
        ],
        ambulance: '108',
    },
    'breathing': {
        icon: '🫁', color: 'amber',
        title: 'Breathing Difficulty / Choking',
        steps: [
            '1. If choking: Ask "Are you choking?" If yes, perform Heimlich Maneuver',
            '2. Heimlich: Stand behind, wrap arms around waist, make fist above navel, pull sharply inward & upward',
            '3. Repeat 5 times, alternate with 5 back blows between shoulder blades',
            '4. If unconscious: Start CPR immediately',
            '5. Call 108 for severe breathing difficulty',
        ],
        ambulance: '108',
    },
    'accident': {
        icon: '🚗', color: 'amber',
        title: 'Road Accident / Trauma',
        steps: [
            '1. Call 108 or 112 immediately',
            '2. Do NOT move the injured person (possible spinal injury)',
            '3. If bleeding: Apply firm pressure with clean cloth — do NOT remove',
            '4. Keep person warm and calm',
            '5. Traffic: Alert others to slow down, set up safety perimeter',
            '6. Do NOT give water to an unconscious person',
        ],
        ambulance: '108 / 112',
    },
    'burn': {
        icon: '🔥', color: 'amber',
        title: 'Burns & Scalds First Aid',
        steps: [
            '1. Cool burn under running cool water for 20 minutes',
            '2. Do NOT use ice, butter, toothpaste, or oil',
            '3. Remove jewellery/clothing near the burn (if not stuck)',
            '4. Cover with clean non-fluffy dressing or cling wrap',
            '5. For large/deep burns, chemical burns or burns on face/hands: call 108',
            '6. Do NOT burst any blisters',
        ],
        ambulance: '108',
    },
    'poisoning': {
        icon: '☠️', color: 'red',
        title: 'Poisoning Emergency',
        steps: [
            '1. Call Poison Control: 1800-116-117 (India) or 108',
            '2. Do NOT induce vomiting unless instructed by medical staff',
            '3. Save the container or note down what was taken',
            '4. If unconscious: place in recovery position, start CPR if needed',
            '5. Wash skin immediately if chemical contact',
        ],
        ambulance: '1800-116-117 / 108',
    },
    'seizure': {
        icon: '⚡', color: 'amber',
        title: 'Seizure / Epilepsy Attack',
        steps: [
            '1. Protect from injury: clear hard objects away',
            '2. Do NOT restrain the person or put anything in their mouth',
            '3. Cushion their head gently',
            '4. Turn them on their side (recovery position) after convulsions stop',
            '5. Time the seizure — call 108 if > 5 minutes or person doesn\'t regain consciousness',
            '6. Stay calmly with them until fully alert',
        ],
        ambulance: '108',
    },
};

const GENERAL_GUIDANCE = {
    icon: '🚨', color: 'red',
    title: 'Emergency Response Activated',
    steps: [
        '1. Stay calm — you can handle this',
        '2. Call 108 (Ambulance) or 112 (National Emergency) immediately',
        '3. Give your exact location including landmarks',
        '4. Keep the person still and comfortable',
        '5. Do not leave them alone',
        '6. Follow dispatcher instructions until help arrives',
    ],
    ambulance: '108 / 112',
};

function detectEmergency(text) {
    const lower = text.toLowerCase();
    for (const [key, data] of Object.entries(FIRST_AID_KB)) {
        if (lower.includes(key)) return data;
    }
    if (lower.includes('chest pain')) return FIRST_AID_KB['heart attack'];
    if (lower.includes('chok') || lower.includes('can\'t breathe') || lower.includes('cant breathe')) return FIRST_AID_KB['breathing'];
    if (lower.includes('crash') || lower.includes('hit') || lower.includes('fell')) return FIRST_AID_KB['accident'];
    if (lower.includes('fire') || lower.includes('scald')) return FIRST_AID_KB['burn'];
    return null;
}

// Sub-component to pan map to user location
function MapController({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, 14, { animate: true });
    }, [center, map]);
    return null;
}

const EmergencyEmbedded = () => {
    const [chatMessages, setChatMessages] = useState([
        {
            sender: 'ai',
            text: '🚨 Emergency Response System Active\n\nI\'m here to help you right now. Please tell me:\n\n• What is the emergency?\n• Who is affected?\n• Are they conscious and breathing?\n\nType your emergency below and I\'ll immediately provide first-aid guidance and locate the nearest hospitals.',
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [firstAidGuide, setFirstAidGuide] = useState(null);
    const [activeView, setActiveView] = useState('chat'); // 'chat' | 'map'

    // Map state
    const [userLocation, setUserLocation] = useState(null);
    const [nearbyHospitals, setNearbyHospitals] = useState([]);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [selectedHospital, setSelectedHospital] = useState(null);

    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const findNearbyHospitals = useCallback(async (lat, lng) => {
        try {
            // Use Overpass API (free, no key needed) to find hospitals within 5km
            const radius = 5000; // 5km
            const query = `
                [out:json][timeout:15];
                (
                  node["amenity"="hospital"](around:${radius},${lat},${lng});
                  way["amenity"="hospital"](around:${radius},${lat},${lng});
                  node["amenity"="clinic"](around:${radius},${lat},${lng});
                  node["healthcare"="hospital"](around:${radius},${lat},${lng});
                );
                out center 10;
            `;
            const resp = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query,
            });
            const json = await resp.json();

            const hospitals = json.elements
                .map(el => {
                    const elLat = el.lat || el.center?.lat;
                    const elLng = el.lon || el.center?.lon;
                    if (!elLat || !elLng) return null;

                    const dist = getDistanceKm(lat, lng, elLat, elLng);
                    return {
                        id: el.id,
                        name: el.tags?.name || el.tags?.['name:en'] || 'Hospital / Clinic',
                        lat: elLat,
                        lng: elLng,
                        phone: el.tags?.phone || el.tags?.['contact:phone'] || '108',
                        type: el.tags?.amenity || 'hospital',
                        dist: dist.toFixed(2),
                    };
                })
                .filter(Boolean)
                .sort((a, b) => parseFloat(a.dist) - parseFloat(b.dist))
                .slice(0, 5);

            setNearbyHospitals(hospitals);
        } catch (e) {
            console.error('Overpass API error:', e);
            setNearbyHospitals([]);
        }
    }, []);

    const getDistanceKm = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const activateGPS = () => {
        if (!navigator.geolocation) {
            setLocationError('GPS not supported in this browser. Please use Chrome or Firefox.');
            return;
        }
        setLocating(true);
        setLocationError('');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserLocation([latitude, longitude]);
                setLocating(false);
                setActiveView('map');
                await findNearbyHospitals(latitude, longitude);
            },
            (err) => {
                setLocating(false);
                setLocationError('GPS access denied. Please allow location permission in your browser.');
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    const handleSendChat = (e) => {
        e?.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);

        const guide = detectEmergency(userMsg) || GENERAL_GUIDANCE;
        setFirstAidGuide(guide);

        setTimeout(() => {
            const aiReply = `🆘 ${guide.title} Detected\n\nImmediate First Aid Steps:\n${guide.steps.join('\n')}\n\n📞 Emergency Helpline: ${guide.ambulance}\n\n🏥 Click "Find Nearest Hospitals" below to activate GPS and locate the 5 nearest hospitals on map with directions.`;
            setChatMessages(prev => [...prev, {
                sender: 'ai',
                text: aiReply,
                showHospitalBtn: true,
                guide,
            }]);
        }, 600);
    };

    const openGoogleMapsDirections = (hospital) => {
        if (!userLocation) return;
        const url = `https://www.google.com/maps/dir/${userLocation[0]},${userLocation[1]}/${hospital.lat},${hospital.lng}`;
        window.open(url, '_blank');
    };

    const colorClass = (color) => {
        if (color === 'red') return { border: 'border-red-500/50', bg: 'bg-red-950/30', badge: 'bg-red-600 text-white' };
        if (color === 'amber') return { border: 'border-amber-500/50', bg: 'bg-amber-950/30', badge: 'bg-amber-600 text-white' };
        return { border: 'border-blue-500/50', bg: 'bg-blue-950/30', badge: 'bg-blue-600 text-white' };
    };

    return (
        <div className="h-full flex flex-col gap-2 md:gap-4 overflow-hidden">
            {/* ── COMPACT HEADER ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 md:p-4 bg-[#1a0e0e] border border-red-900/60 rounded-xl md:rounded-2xl shrink-0">
                {/* Left: icon + title */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-600 flex items-center justify-center text-base md:text-xl shadow animate-pulse shrink-0">🚨</div>
                    <div className="min-w-0">
                        <h3 className="font-extrabold text-white text-sm md:text-lg leading-tight">Emergency Response Centre</h3>
                        <p className="text-[10px] md:text-xs text-red-300 truncate">GPS Hospital Locator • First Aid • Ambulance Hotlines</p>
                    </div>
                </div>

                {/* Right: call buttons + view toggle */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <a href="tel:108" className="px-2.5 py-1.5 md:px-4 md:py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10px] md:text-xs rounded-lg md:rounded-xl shadow flex items-center gap-1 transition">
                        📞 108 Ambulance
                    </a>
                    <a href="tel:112" className="px-2.5 py-1.5 md:px-4 md:py-2 bg-[#2A2B32] hover:bg-[#3E3F4B] text-white font-bold text-[10px] md:text-xs rounded-lg md:rounded-xl shadow flex items-center gap-1 border border-[#444654] transition">
                        📞 112 Police
                    </a>
                    <div className="flex bg-[#2A2B32] border border-[#3E3F4B] rounded-lg overflow-hidden text-[10px] md:text-xs font-bold">
                        <button
                            onClick={() => setActiveView('chat')}
                            className={`px-2.5 py-1.5 md:px-3 md:py-2 transition ${activeView === 'chat' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            💬 Chat
                        </button>
                        <button
                            onClick={() => { setActiveView('map'); if (!userLocation) activateGPS(); }}
                            className={`px-2.5 py-1.5 md:px-3 md:py-2 transition ${activeView === 'map' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            🗺️ Map
                        </button>
                    </div>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">

                {/* ══════════════════════════════════════ */}
                {/* CHAT VIEW                             */}
                {/* ══════════════════════════════════════ */}
                {activeView === 'chat' && (
                    <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-4 min-h-0 overflow-hidden w-full">
                        {/* Mobile: compact hotline strip above chat */}
                        <div className="flex md:hidden gap-1.5 overflow-x-auto shrink-0 pb-0.5">
                            {[
                                { label: 'Ambulance', num: '108', icon: '🚑' },
                                { label: 'Emergency', num: '112', icon: '🆘' },
                                { label: 'Police', num: '100', icon: '🚓' },
                                { label: 'Fire', num: '101', icon: '🔥' },
                                { label: 'Poison', num: '1800-116-117', icon: '☠️' },
                            ].map(h => (
                                <a key={h.num} href={`tel:${h.num}`}
                                   className="flex items-center gap-1 px-2 py-1 bg-[#2A2B32] border border-[#3E3F4B] rounded-lg text-[10px] text-gray-300 whitespace-nowrap shrink-0">
                                    <span>{h.icon}</span>
                                    <span className="font-bold text-white">{h.num}</span>
                                </a>
                            ))}
                        </div>
                        {/* Chat Panel */}
                        <div className="flex-1 flex flex-col bg-[#1E1E1E] border border-[#3E3F4B] rounded-xl md:rounded-2xl overflow-hidden min-h-0">
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.sender === 'ai' && (
                                            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-xs shrink-0 mt-1 shadow">🚨</div>
                                        )}
                                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm whitespace-pre-line leading-relaxed shadow ${
                                            msg.sender === 'user'
                                                ? 'bg-[#343541] text-white border border-[#444654] rounded-br-none'
                                                : 'bg-[#2A2B32] text-gray-100 border border-red-500/30 rounded-bl-none'
                                        }`}>
                                            {msg.text}
                                            {msg.showHospitalBtn && (
                                                <button
                                                    onClick={activateGPS}
                                                    className="mt-3 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition"
                                                >
                                                    {locating ? '📡 Locating via GPS...' : '🏥 Find 5 Nearest Hospitals on Map'}
                                                </button>
                                            )}
                                        </div>
                                        {msg.sender === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-xs shrink-0 mt-1 shadow">👤</div>
                                        )}
                                    </div>
                                ))}
                                {locating && (
                                    <div className="text-center text-xs text-blue-400 animate-pulse py-2">
                                        📡 Detecting your GPS location & searching nearby hospitals...
                                    </div>
                                )}
                                {locationError && (
                                    <div className="text-center text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl p-3">
                                        ⚠️ {locationError}
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSendChat} className="p-3 border-t border-[#303030] flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Describe the emergency (e.g. 'heart attack', 'accident', 'seizure')..."
                                    className="flex-1 bg-[#2A2B32] border border-[#444654] text-white placeholder-gray-500 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim()}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl disabled:opacity-40 transition shadow"
                                >
                                    🆘 Send
                                </button>
                            </form>
                        </div>

                        {/* Right Side: Quick First Aid Guide — hidden on mobile */}
                        <div className="hidden md:flex w-80 shrink-0 flex-col gap-3 overflow-y-auto">
                            {/* Emergency Hotlines Card */}
                            <div className="p-4 bg-[#1a0e0e] border border-red-900/50 rounded-2xl space-y-2">
                                <h4 className="font-extrabold text-red-400 text-sm flex items-center gap-2">📞 Emergency Hotlines (India)</h4>
                                {[
                                    { label: 'Ambulance', num: '108', icon: '🚑' },
                                    { label: 'National Emergency', num: '112', icon: '🆘' },
                                    { label: 'Police', num: '100', icon: '🚓' },
                                    { label: 'Fire', num: '101', icon: '🔥' },
                                    { label: 'Poison Control', num: '1800-116-117', icon: '☠️' },
                                    { label: 'Women Helpline', num: '1091', icon: '👩' },
                                    { label: 'Child Helpline', num: '1098', icon: '🧒' },
                                ].map(h => (
                                    <a
                                        key={h.num}
                                        href={`tel:${h.num}`}
                                        className="flex items-center justify-between p-2.5 bg-[#2A2B32] hover:bg-[#343541] border border-[#3E3F4B] rounded-xl transition text-xs group"
                                    >
                                        <span className="flex items-center gap-2 text-gray-300 group-hover:text-white">
                                            <span>{h.icon}</span>
                                            <span>{h.label}</span>
                                        </span>
                                        <span className="font-extrabold text-white">{h.num}</span>
                                    </a>
                                ))}
                            </div>

                            {/* Detected First Aid Guide */}
                            {firstAidGuide && (
                                <div className={`p-4 rounded-2xl border space-y-3 ${colorClass(firstAidGuide.color).border} ${colorClass(firstAidGuide.color).bg}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{firstAidGuide.icon}</span>
                                        <h4 className="font-extrabold text-white text-sm">{firstAidGuide.title}</h4>
                                    </div>
                                    <div className="space-y-1.5 text-xs text-gray-200">
                                        {firstAidGuide.steps.map((s, i) => (
                                            <p key={i} className="leading-relaxed">{s}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick Select Emergencies */}
                            <div className="p-4 bg-[#2A2B32] border border-[#3E3F4B] rounded-2xl">
                                <h4 className="font-bold text-gray-300 text-xs mb-3">Quick Emergency Select:</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Heart Attack', icon: '🫀' },
                                        { label: 'Accident', icon: '🚗' },
                                        { label: 'Stroke', icon: '🧠' },
                                        { label: 'Breathing', icon: '🫁' },
                                        { label: 'Seizure', icon: '⚡' },
                                        { label: 'Burns', icon: '🔥' },
                                        { label: 'Poisoning', icon: '☠️' },
                                        { label: 'Other', icon: '🆘' },
                                    ].map(q => (
                                        <button
                                            key={q.label}
                                            onClick={() => {
                                                setChatInput(q.label.toLowerCase());
                                                setTimeout(() => handleSendChat(), 100);
                                            }}
                                            className="p-2 bg-[#1E1E1E] hover:bg-[#343541] border border-[#444654] rounded-xl text-xs text-gray-300 hover:text-white font-bold transition flex items-center gap-1.5"
                                        >
                                            <span>{q.icon}</span><span>{q.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════ */}
                {/* MAP VIEW (GPS + 5 Nearest Hospitals)  */}
                {/* ══════════════════════════════════════ */}
                {activeView === 'map' && (
                    <div className="flex-1 flex gap-4 min-h-0">
                        {/* Map */}
                        <div className="flex-1 rounded-2xl overflow-hidden border border-[#3E3F4B] relative">
                            {!userLocation ? (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-[#1E1E1E] text-center p-6 gap-4">
                                    <div className="text-5xl animate-bounce">📡</div>
                                    <h4 className="font-extrabold text-white text-lg">GPS Location Required</h4>
                                    <p className="text-gray-400 text-sm max-w-xs">
                                        Allow location access to find the 5 nearest hospitals and get real-time directions.
                                    </p>
                                    {locationError && (
                                        <p className="text-red-400 text-xs bg-red-950/40 border border-red-700/40 rounded-xl p-3 max-w-xs">{locationError}</p>
                                    )}
                                    <button
                                        onClick={activateGPS}
                                        disabled={locating}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center gap-2 transition disabled:opacity-50"
                                    >
                                        {locating ? '📡 Locating...' : '📍 Enable GPS & Find Hospitals'}
                                    </button>
                                </div>
                            ) : (
                                <MapContainer
                                    center={userLocation}
                                    zoom={14}
                                    style={{ width: '100%', height: '100%' }}
                                    className="rounded-2xl"
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <MapController center={userLocation} />

                                    {/* User Location Marker */}
                                    <Marker position={userLocation} icon={userIcon}>
                                        <Popup>
                                            <div className="text-xs font-bold text-red-600">📍 You are here</div>
                                        </Popup>
                                    </Marker>

                                    {/* Hospital Markers */}
                                    {nearbyHospitals.map((h) => (
                                        <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}
                                            eventHandlers={{ click: () => setSelectedHospital(h) }}>
                                            <Popup>
                                                <div className="text-xs space-y-1.5 min-w-[180px]">
                                                    <p className="font-extrabold text-blue-700 text-sm">🏥 {h.name}</p>
                                                    <p className="text-gray-600">📏 {h.dist} km away</p>
                                                    <p className="text-gray-600">📞 {h.phone}</p>
                                                    <button
                                                        onClick={() => openGoogleMapsDirections(h)}
                                                        className="w-full mt-1 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg"
                                                    >
                                                        🗺️ Get Directions
                                                    </button>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            )}

                            {/* Locating overlay */}
                            {locating && userLocation && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                                    <div className="bg-[#212121] border border-[#3E3F4B] rounded-2xl px-6 py-4 text-sm text-blue-400 font-bold animate-pulse">
                                        🔍 Searching nearby hospitals...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hospitals Sidebar List */}
                        <div className="w-80 shrink-0 flex flex-col gap-3 overflow-y-auto">
                            <div className="p-3 bg-[#1E1E1E] border border-[#3E3F4B] rounded-2xl">
                                <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                                    🏥 5 Nearest Hospitals
                                    {userLocation && (
                                        <button
                                            onClick={activateGPS}
                                            className="ml-auto text-[10px] px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                                        >
                                            🔄 Refresh
                                        </button>
                                    )}
                                </h4>
                            </div>

                            {!userLocation ? (
                                <div className="p-4 text-center text-gray-400 text-xs bg-[#1E1E1E] border border-[#3E3F4B] rounded-2xl">
                                    Enable GPS to see nearest hospitals
                                </div>
                            ) : nearbyHospitals.length === 0 ? (
                                <div className="p-4 text-center bg-[#1E1E1E] border border-[#3E3F4B] rounded-2xl space-y-2">
                                    <p className="text-amber-400 text-xs font-bold animate-pulse">🔍 Searching for hospitals in 5km radius...</p>
                                </div>
                            ) : (
                                nearbyHospitals.map((h, idx) => (
                                    <div
                                        key={h.id}
                                        onClick={() => setSelectedHospital(h)}
                                        className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                                            selectedHospital?.id === h.id
                                                ? 'bg-blue-900/30 border-blue-500 shadow-lg'
                                                : 'bg-[#1E1E1E] border-[#3E3F4B] hover:border-blue-500/50 hover:bg-[#2A2B32]'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <p className="font-bold text-white text-sm leading-tight">{h.name}</p>
                                            </div>
                                            <span className="shrink-0 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded border border-emerald-500/30">
                                                {h.dist} km
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-400">📞 {h.phone}</p>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); openGoogleMapsDirections(h); }}
                                            className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                                        >
                                            🗺️ Get Google Maps Directions
                                        </button>
                                    </div>
                                ))
                            )}

                            {/* Emergency Hotlines compact */}
                            <div className="p-3 bg-[#1a0e0e] border border-red-900/40 rounded-2xl space-y-2">
                                <h4 className="font-bold text-red-400 text-xs">📞 Quick Dial</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Ambulance', num: '108' },
                                        { label: 'Emergency', num: '112' },
                                        { label: 'Police', num: '100' },
                                        { label: 'Fire', num: '101' },
                                    ].map(h => (
                                        <a key={h.num} href={`tel:${h.num}`}
                                            className="p-2 bg-[#2A2B32] hover:bg-[#343541] border border-red-900/40 rounded-xl text-xs text-center font-bold text-red-300 hover:text-red-200 transition">
                                            {h.label}<br /><span className="text-white">{h.num}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmergencyEmbedded;
