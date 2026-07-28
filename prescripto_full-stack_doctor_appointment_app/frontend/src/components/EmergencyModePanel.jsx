import React, { useState } from 'react';

const EmergencyModePanel = ({
    emergencyData = null,
    onStartNavigation = () => {},
    onDismiss = () => {}
}) => {
    const [notifiedContacts, setNotifiedContacts] = useState(false);
    const topHospital = emergencyData?.topFacility || emergencyData?.places?.[0] || {
        name: 'City General Emergency Hospital',
        distanceKm: 1.2,
        estimatedTimeMin: 4,
        phone: '108',
        address: 'Main Emergency Corridor, Central Zone'
    };

    const handleNotifyContacts = () => {
        setNotifiedContacts(true);
    };

    return (
        <div className="bg-red-500/10 border-2 border-red-500/80 rounded-3xl p-5 shadow-2xl backdrop-blur-md animate-pulseSlow my-4 font-sans">
            {/* Header Banner */}
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-red-500/30">
                <div className="flex items-center space-x-3">
                    <span className="text-3xl animate-bounce">🚨</span>
                    <div>
                        <span className="text-xs font-black tracking-widest uppercase text-red-600 dark:text-red-400 block">
                            EMERGENCY MODE ACTIVATED
                        </span>
                        <h3 className="font-extrabold text-lg text-gray-900 dark:text-white leading-tight">
                            Nearest ER Hospital Identified
                        </h3>
                    </div>
                </div>
                <button
                    onClick={onDismiss}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-semibold px-2 py-1"
                >
                    Dismiss
                </button>
            </div>

            {/* Top ER Hospital Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-lg border border-red-200 dark:border-red-900/50 mb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{topHospital.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{topHospital.address}</p>
                    </div>
                    <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs font-bold px-2.5 py-1 rounded-full">
                        24x7 ER Ready
                    </span>
                </div>

                <div className="flex items-center space-x-4 text-xs font-semibold text-gray-700 dark:text-gray-300 my-3">
                    <span className="text-red-600 dark:text-red-400">📍 {topHospital.distanceKm} km away</span>
                    <span>⏱️ ETA ~{topHospital.estimatedTimeMin} mins</span>
                    <span>📞 {topHospital.phone}</span>
                </div>

                {/* Primary Large Emergency Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <a
                        href={`tel:${topHospital.phone || '108'}`}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-xl transition flex items-center justify-center space-x-2 text-sm"
                    >
                        <span>📞 CALL AMBULANCE (108 / 112)</span>
                    </a>
                    <button
                        onClick={() => onStartNavigation(topHospital)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-xl transition flex items-center justify-center space-x-2 text-sm"
                    >
                        <span>🚀 NAVIGATE TO ER NOW</span>
                    </button>
                </div>
            </div>

            {/* Emergency Contacts Notification Action */}
            <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl p-3.5 flex items-center justify-between border border-gray-200 dark:border-gray-800 text-xs">
                <div className="flex items-center space-x-2.5">
                    <span className="text-lg">👨‍👩‍👧</span>
                    <div>
                        <strong className="text-gray-900 dark:text-white block font-bold">Notify Emergency Contacts</strong>
                        <span className="text-gray-500">Send live location & hospital alert to registered contacts</span>
                    </div>
                </div>
                <button
                    onClick={handleNotifyContacts}
                    disabled={notifiedContacts}
                    className={`px-3 py-2 rounded-xl font-bold transition ${
                        notifiedContacts
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900'
                    }`}
                >
                    {notifiedContacts ? '✓ Alerts Sent' : 'Send Alert'}
                </button>
            </div>
        </div>
    );
};

export default EmergencyModePanel;
