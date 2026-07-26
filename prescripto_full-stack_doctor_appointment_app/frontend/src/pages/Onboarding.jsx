import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
    const { backendUrl, token, userData, loadUserProfileData } = useContext(AppContext);
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 6;

    // Step Data State
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [ageGender, setAgeGender] = useState('');
    const [healthHistory, setHealthHistory] = useState('');
    const [medicationsAllergies, setMedicationsAllergies] = useState('');
    const [lifestyleGoals, setLifestyleGoals] = useState('');

    // Family Member Sub-Form State
    const [familyList, setFamilyList] = useState([]);
    const [famName, setFamName] = useState('');
    const [famRelation, setFamRelation] = useState('Spouse');
    const [famAge, setFamAge] = useState('');
    const [famBlood, setFamBlood] = useState('O+');

    const [loading, setLoading] = useState(false);

    const languages = [
        { name: 'English', flag: '🇬🇧', label: 'English' },
        { name: 'Hindi (हिंदी)', flag: '🇮🇳', label: 'हिंदी' },
        { name: 'Marathi (मराठी)', flag: '🇮🇳', label: 'मराठी' },
        { name: 'Spanish (Español)', flag: '🇪🇸', label: 'Español' },
        { name: 'French (Français)', flag: '🇫🇷', label: 'Français' },
        { name: 'German (Deutsch)', flag: '🇩🇪', label: 'Deutsch' },
        { name: 'Tamil (தமிழ்)', flag: '🇮🇳', label: 'தமிழ்' },
        { name: 'Telugu (తెలుగు)', flag: '🇮🇳', label: 'తెలుగు' }
    ];

    useEffect(() => {
        if (!token) {
            toast.info("Please log in to begin your Health Journey");
            navigate('/login');
        }
    }, [token]);

    const handleAddFamilyMember = (e) => {
        e.preventDefault();
        if (!famName.trim()) {
            toast.warn("Please enter family member's name");
            return;
        }
        const newFam = {
            id: 'FAM-' + Date.now(),
            name: famName,
            relation: famRelation,
            age: famAge || 'N/A',
            bloodGroup: famBlood
        };
        setFamilyList([...familyList, newFam]);
        setFamName('');
        setFamAge('');
        toast.success(`Added ${famName} (${famRelation}) to Family Memory`);
    };

    const handleNextStep = async () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        } else {
            // Final submission
            setLoading(true);
            try {
                const familySummaryStr = familyList.length > 0
                    ? familyList.map(f => `${f.name} (${f.relation}, Age: ${f.age}, Blood: ${f.bloodGroup})`).join('; ')
                    : 'No family sub-profiles added during onboarding';

                const accumulatedData = {
                    preferredLanguage: selectedLanguage,
                    age_gender: ageGender,
                    health_history: healthHistory,
                    medications_allergies: medicationsAllergies,
                    family_history: familySummaryStr,
                    lifestyle_goals: lifestyleGoals
                };

                // Also save family members to backend
                for (const member of familyList) {
                    await axios.post(
                        backendUrl + '/api/family/add',
                        { name: member.name, relation: member.relation, age: member.age, bloodGroup: member.bloodGroup, medicalNotes: 'Added during onboarding' },
                        { headers: { token } }
                    );
                }

                const { data } = await axios.post(
                    backendUrl + '/api/ai/onboard',
                    {
                        stepIndex: 6, // triggers completion
                        accumulatedData
                    },
                    { headers: { token } }
                );

                if (data.success) {
                    toast.success("🎉 Lifetime Health Journey Setup Complete!");
                    await loadUserProfileData();
                    navigate('/ai-assistant', { state: { welcomeMsg: data.message } });
                } else {
                    toast.error(data.message || "Failed to complete setup");
                }
            } catch (err) {
                console.error(err);
                toast.error("Error completing health journey onboarding");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl shadow-2xl border border-gray-100 min-h-[75vh] flex flex-col justify-between">
            {/* Header & Progress Bar */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🩺</span>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                            Personal AI Health Journey
                        </h1>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                        Step {currentStep} of {totalSteps}
                    </span>
                </div>

                {/* Progress Bar Line */}
                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden mb-8">
                    <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                </div>

                {/* STEP 1: Language Selection */}
                {currentStep === 1 && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-800">
                            🌐 Select Your Preferred Language for AI Consultation
                        </h2>
                        <p className="text-xs text-gray-500">
                            Your AI Doctor Companion will communicate with you in your chosen language.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            {languages.map((lang) => (
                                <button
                                    key={lang.name}
                                    type="button"
                                    onClick={() => setSelectedLanguage(lang.name)}
                                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                                        selectedLanguage === lang.name
                                            ? 'border-blue-600 bg-blue-50/80 shadow-md font-bold text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                    }`}
                                >
                                    <span className="text-2xl">{lang.flag}</span>
                                    <span className="text-sm font-semibold">{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: Age & Gender */}
                {currentStep === 2 && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-800">
                            👤 Tell us about yourself (Age & Gender)
                        </h2>
                        <p className="text-xs text-gray-500">
                            This helps your AI Companion customize medical recommendations for your specific age group.
                        </p>
                        <input
                            type="text"
                            value={ageGender}
                            onChange={(e) => setAgeGender(e.target.value)}
                            placeholder="e.g. 28 years old, Male / Female"
                            className="w-full p-4 border border-gray-300 rounded-2xl text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            required
                        />
                    </div>
                )}

                {/* STEP 3: Health History & Medical Issues */}
                {currentStep === 3 && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-800">
                            🩺 Health History till Now & Medical Issues
                        </h2>
                        <p className="text-xs text-gray-500">
                            Do you have any past illnesses, chronic conditions (e.g. Diabetes, BP, Asthma, Thyroid), or past surgeries?
                        </p>
                        <textarea
                            rows={4}
                            value={healthHistory}
                            onChange={(e) => setHealthHistory(e.target.value)}
                            placeholder="e.g. Diagnosed with Mild BP 2 years ago, or No major health issues till now"
                            className="w-full p-4 border border-gray-300 rounded-2xl text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                )}

                {/* STEP 4: Medications & Allergies */}
                {currentStep === 4 && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-800">
                            💊 Regular Medications & Known Allergies
                        </h2>
                        <p className="text-xs text-gray-500">
                            List any daily medicines, supplements, or known allergies (food, dust, specific drugs).
                        </p>
                        <textarea
                            rows={4}
                            value={medicationsAllergies}
                            onChange={(e) => setMedicationsAllergies(e.target.value)}
                            placeholder="e.g. Taking Multivitamins daily. Allergic to Dust & Penicillin"
                            className="w-full p-4 border border-gray-300 rounded-2xl text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                )}

                {/* STEP 5: Family Members Setup */}
                {currentStep === 5 && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-800">
                            👨‍👩‍👧 Family Dashboard Setup (Optional)
                        </h2>
                        <p className="text-xs text-gray-500">
                            Add your family members (spouse, children, parents) to link their health memory under your account.
                        </p>

                        {/* Add Family Form */}
                        <form onSubmit={handleAddFamilyMember} className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={famName}
                                    onChange={(e) => setFamName(e.target.value)}
                                    placeholder="Family Member Name"
                                    className="p-2.5 border rounded-xl text-sm"
                                />
                                <select
                                    value={famRelation}
                                    onChange={(e) => setFamRelation(e.target.value)}
                                    className="p-2.5 border rounded-xl text-sm"
                                >
                                    <option>Spouse</option>
                                    <option>Child</option>
                                    <option>Parent</option>
                                    <option>Sibling</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={famAge}
                                    onChange={(e) => setFamAge(e.target.value)}
                                    placeholder="Age (e.g. 26)"
                                    className="p-2.5 border rounded-xl text-sm"
                                />
                                <select
                                    value={famBlood}
                                    onChange={(e) => setFamBlood(e.target.value)}
                                    className="p-2.5 border rounded-xl text-sm"
                                >
                                    <option>O+</option>
                                    <option>A+</option>
                                    <option>B+</option>
                                    <option>AB+</option>
                                    <option>O-</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow hover:bg-blue-700 transition"
                            >
                                + Add Family Member to Memory
                            </button>
                        </form>

                        {/* Display Added Family */}
                        {familyList.length > 0 && (
                            <div className="space-y-2 pt-2">
                                <h4 className="text-xs font-bold text-gray-700">Added Family Members:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {familyList.map((f) => (
                                        <span key={f.id} className="px-3 py-1 bg-gray-100 border text-gray-800 text-xs font-semibold rounded-full">
                                            {f.name} ({f.relation}, {f.age} yrs)
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 6: Lifestyle & Health Goals */}
                {currentStep === 6 && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-800">
                            🏃 Lifestyle & Personal Health Goals
                        </h2>
                        <p className="text-xs text-gray-500">
                            Tell us about your sleep quality, physical activity, and what health goals you want to achieve with your AI friend!
                        </p>
                        <textarea
                            rows={4}
                            value={lifestyleGoals}
                            onChange={(e) => setLifestyleGoals(e.target.value)}
                            placeholder="e.g. 7 hours sleep, moderate walking 3x a week. Goals: Weight loss & stress management"
                            className="w-full p-4 border border-gray-300 rounded-2xl text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
                {currentStep > 1 ? (
                    <button
                        type="button"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition"
                    >
                        ← Back
                    </button>
                ) : (
                    <div />
                )}

                <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={loading}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:opacity-95 transition text-sm disabled:opacity-50"
                >
                    {loading
                        ? 'Initializing AI Companion...'
                        : currentStep === totalSteps
                        ? 'Finish & Meet AI Friend 🤖 →'
                        : 'Continue →'}
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
