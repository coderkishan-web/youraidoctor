import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const HealthMemoryEmbedded = () => {
    const { userData } = useContext(AppContext);
    const health = userData?.healthProfile || {};
    const learnedInsights = health.learnedInsights || [];

    return (
        <div className="p-6 bg-[#262626] rounded-2xl border border-[#3E3F4B] space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-[#383838]">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-2xl shadow">
                    🧠
                </div>
                <div>
                    <h3 className="font-extrabold text-white text-xl flex items-center gap-2">
                        Personal Health Memory & Onboarding Record
                    </h3>
                    <p className="text-xs text-gray-400">Encrypted per-user health history, allergies & adaptive learned insights</p>
                </div>
            </div>

            {/* Profile Grid */}
            <div className="grid md:grid-cols-2 gap-6 text-xs">
                {/* Onboarding Intake Summary */}
                <div className="p-5 bg-[#2A2B32] border border-[#3E3F4B] rounded-2xl space-y-3">
                    <h4 className="font-bold text-indigo-300 text-sm border-b border-[#3E3F4B] pb-2">
                        🩺 6-Step Onboarding Health Intake Profile
                    </h4>

                    <div className="space-y-2 text-gray-300">
                        <p><strong className="text-gray-400">Preferred Language:</strong> {health.preferredLanguage || 'English'}</p>
                        <p><strong className="text-gray-400">Age & Gender:</strong> {health.ageGender || 'Not specified'}</p>
                        <p><strong className="text-gray-400">Known Health History:</strong> {health.healthHistory || 'No major issues'}</p>
                        <p><strong className="text-gray-400">Regular Medications/Allergies:</strong> {health.medicationsAllergies || 'None reported'}</p>
                        <p><strong className="text-gray-400">Family History:</strong> {health.familyHistory || 'None reported'}</p>
                        <p><strong className="text-gray-400">Lifestyle & Wellness Goals:</strong> {health.lifestyleGoals || 'General health'}</p>
                    </div>
                </div>

                {/* Learned Insights */}
                <div className="p-5 bg-[#2A2B32] border border-[#3E3F4B] rounded-2xl space-y-3">
                    <h4 className="font-bold text-indigo-300 text-sm border-b border-[#3E3F4B] pb-2">
                        🧠 Adaptive Medical Memory (Auto-Learned)
                    </h4>

                    {learnedInsights.length > 0 ? (
                        <div className="space-y-2">
                            {learnedInsights.map((insight, idx) => (
                                <div key={idx} className="p-2.5 bg-[#343541] border border-[#444654] rounded-xl text-indigo-200 text-xs font-medium">
                                    • {insight}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 italic">No adaptive memory tags recorded yet. As you chat with your AI Personal Doctor, trigger facts and allergies will be saved here automatically.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HealthMemoryEmbedded;
