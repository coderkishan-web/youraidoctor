import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const HealthMemory = () => {
    const { backendUrl, token, userData, loadUserProfileData } = useContext(AppContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('memory'); // 'memory' | 'family' | 'emergency' | 'reminders'

    // Family Member Form State
    const [familyMembers, setFamilyMembers] = useState([]);
    const [famName, setFamName] = useState('');
    const [famRelation, setFamRelation] = useState('Spouse');
    const [famAge, setFamAge] = useState('');
    const [famBlood, setFamBlood] = useState('O+');
    const [famNotes, setFamNotes] = useState('');

    // Reminders State
    const [reminders, setReminders] = useState([]);
    const [remTitle, setRemTitle] = useState('');
    const [remTime, setRemTime] = useState('08:00 AM');
    const [remType, setRemType] = useState('Medication');

    // Emergency Card State
    const [emergencyCard, setEmergencyCard] = useState(null);

    useEffect(() => {
        if (!token) {
            toast.info("Please login to access your Lifetime Health Memory");
            navigate('/login');
            return;
        }

        fetchFamilyMembers();
        fetchReminders();
        fetchEmergencyCard();
    }, [token]);

    const fetchFamilyMembers = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/family/list', { headers: { token } });
            if (data.success) {
                setFamilyMembers(data.familyMembers);
            }
        } catch (e) {
            console.error("Error fetching family members", e);
        }
    };

    const handleAddFamilyMember = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(
                backendUrl + '/api/family/add',
                { name: famName, relation: famRelation, age: famAge, bloodGroup: famBlood, medicalNotes: famNotes },
                { headers: { token } }
            );

            if (data.success) {
                toast.success("Family member added!");
                setFamilyMembers(data.familyMembers);
                setFamName('');
                setFamNotes('');
                setFamAge('');
            } else {
                toast.error(data.message);
            }
        } catch (e) {
            toast.error("Failed to add family member");
        }
    };

    const handleRemoveFamily = async (memberId) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/family/remove',
                { memberId },
                { headers: { token } }
            );
            if (data.success) {
                toast.info("Family member removed");
                setFamilyMembers(data.familyMembers);
            }
        } catch (e) {
            toast.error("Failed to remove family member");
        }
    };

    const fetchReminders = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/reminder/list', { headers: { token } });
            if (data.success) {
                setReminders(data.reminders);
            }
        } catch (e) {
            console.error("Error fetching reminders", e);
        }
    };

    const handleAddReminder = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(
                backendUrl + '/api/reminder/add',
                { title: remTitle, time: remTime, type: remType },
                { headers: { token } }
            );
            if (data.success) {
                toast.success("Reminder created!");
                setRemTitle('');
                fetchReminders();
            } else {
                toast.error(data.message);
            }
        } catch (e) {
            toast.error("Failed to add reminder");
        }
    };

    const handleToggleReminder = async (reminderId) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/reminder/toggle',
                { reminderId },
                { headers: { token } }
            );
            if (data.success) {
                fetchReminders();
            }
        } catch (e) {
            toast.error("Failed to update reminder");
        }
    };

    const fetchEmergencyCard = async () => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/ai/emergency-share',
                {},
                { headers: { token } }
            );
            if (data.success) {
                setEmergencyCard(data);
            }
        } catch (e) {
            console.error("Error fetching emergency card", e);
        }
    };

    const copyShareUrl = () => {
        if (emergencyCard?.shareUrl) {
            navigator.clipboard.writeText(emergencyCard.shareUrl);
            toast.success("Emergency Card Link copied to clipboard!");
        }
    };

    const hp = userData?.healthProfile || {};

    return (
        <div className="max-w-6xl mx-auto my-6 p-4 sm:p-6 bg-white rounded-2xl shadow-xl border border-gray-100 min-h-[80vh]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-200 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        🧬 Lifetime Health Memory & Family Dashboard
                    </h1>
                    <p className="text-xs text-gray-500">
                        Permanent health records, family profiles, emergency credentials, and post-consultation reminders.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveTab('memory')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            activeTab === 'memory' ? 'bg-primary text-white shadow' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        📋 My Health Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('family')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            activeTab === 'family' ? 'bg-primary text-white shadow' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        👨‍👩‍👧 Family Dashboard ({familyMembers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('emergency')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            activeTab === 'emergency' ? 'bg-red-600 text-white shadow' : 'bg-red-50 text-red-700'
                        }`}
                    >
                        🚨 Emergency Card
                    </button>
                    <button
                        onClick={() => setActiveTab('reminders')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            activeTab === 'reminders' ? 'bg-primary text-white shadow' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        ⏰ Reminders ({reminders.length})
                    </button>
                </div>
            </div>

            {/* TAB 1: Health Profile Memory */}
            {activeTab === 'memory' && (
                <div className="my-6 space-y-6">
                    <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full uppercase">
                                {hp.ageLabel || 'General Adult Profile'}
                            </span>
                            <h2 className="text-2xl font-bold mt-2">{userData?.name}</h2>
                            <p className="text-xs text-blue-100 mt-1">
                                Email: {userData?.email} | Phone: {userData?.phone || 'Not set'}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/ai-assistant')}
                            className="px-4 py-2 bg-white text-blue-700 font-semibold rounded-xl text-sm hover:bg-blue-50 transition shadow"
                        >
                            Update via AI Companion →
                        </button>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50 shadow-sm">
                            <h3 className="font-bold text-gray-800 text-sm mb-2">🩺 Known Medical Conditions</h3>
                            <p className="text-sm text-gray-600">{hp.conditions || 'None reported during intake'}</p>
                        </div>

                        <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50 shadow-sm">
                            <h3 className="font-bold text-gray-800 text-sm mb-2">⚠️ Allergies & Sensitivity</h3>
                            <p className="text-sm text-gray-600">{hp.allergies || 'No known allergies'}</p>
                        </div>

                        <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50 shadow-sm">
                            <h3 className="font-bold text-gray-800 text-sm mb-2">🧬 Family Medical History</h3>
                            <p className="text-sm text-gray-600">{hp.familyHistory || 'None recorded'}</p>
                        </div>

                        <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50 shadow-sm">
                            <h3 className="font-bold text-gray-800 text-sm mb-2">🏃 Lifestyle & Health Goals</h3>
                            <p className="text-sm text-gray-600">{hp.lifestyleGoals || 'General wellness'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: Family Dashboard */}
            {activeTab === 'family' && (
                <div className="my-6 space-y-6">
                    {/* Add Family Form */}
                    <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">➕ Add Family Member Account</h3>
                        <form onSubmit={handleAddFamilyMember} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-600">Full Name</label>
                                <input
                                    type="text"
                                    value={famName}
                                    onChange={(e) => setFamName(e.target.value)}
                                    placeholder="e.g. Sarah Smith"
                                    className="w-full p-2.5 mt-1 border rounded-xl text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600">Relationship</label>
                                <select
                                    value={famRelation}
                                    onChange={(e) => setFamRelation(e.target.value)}
                                    className="w-full p-2.5 mt-1 border rounded-xl text-sm"
                                >
                                    <option>Spouse</option>
                                    <option>Child</option>
                                    <option>Parent</option>
                                    <option>Sibling</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600">Age</label>
                                <input
                                    type="text"
                                    value={famAge}
                                    onChange={(e) => setFamAge(e.target.value)}
                                    placeholder="e.g. 12"
                                    className="w-full p-2.5 mt-1 border rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-600">Blood Group</label>
                                <select
                                    value={famBlood}
                                    onChange={(e) => setFamBlood(e.target.value)}
                                    className="w-full p-2.5 mt-1 border rounded-xl text-sm"
                                >
                                    <option>O+</option>
                                    <option>A+</option>
                                    <option>B+</option>
                                    <option>AB+</option>
                                    <option>O-</option>
                                    <option>A-</option>
                                    <option>B-</option>
                                    <option>AB-</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-gray-600">Medical Notes / Conditions</label>
                                <input
                                    type="text"
                                    value={famNotes}
                                    onChange={(e) => setFamNotes(e.target.value)}
                                    placeholder="e.g. Asthma, Peanut Allergy"
                                    className="w-full p-2.5 mt-1 border rounded-xl text-sm"
                                />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                                <button type="submit" className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm shadow">
                                    Add Family Member
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Linked Family Members Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {familyMembers.map((member) => (
                            <div key={member.id} className="p-5 border border-gray-200 rounded-2xl bg-white shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800 text-lg">{member.name}</h4>
                                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                            {member.relation}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Age: {member.age} | Blood: <span className="font-bold text-red-600">{member.bloodGroup}</span>
                                    </p>
                                    <p className="text-xs text-gray-600 mt-3 p-2 bg-gray-50 rounded-lg">
                                        Notes: {member.medicalNotes}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleRemoveFamily(member.id)}
                                    className="mt-4 text-xs font-semibold text-red-600 hover:text-red-800 text-left"
                                >
                                    Remove Profile ✖
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: Emergency Card */}
            {activeTab === 'emergency' && (
                <div className="my-6 max-w-xl mx-auto p-6 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl text-white shadow-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-white/20 pb-3">
                        <span className="font-bold text-sm tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
                            🚨 Emergency Medical ID
                        </span>
                        <span className="text-xs font-mono bg-black/30 px-2 py-1 rounded">
                            {emergencyCard?.emergencyCard?.shareToken || 'EMG-ACTIVE'}
                        </span>
                    </div>

                    <div>
                        <h2 className="text-2xl font-extrabold">{userData?.name}</h2>
                        <p className="text-xs text-red-100">Primary Emergency Contact: {userData?.phone || '108 / Emergency Response'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-white/10 p-4 rounded-xl border border-white/10">
                        <div>
                            <p className="text-red-200">Blood Type</p>
                            <p className="text-lg font-extrabold">{emergencyCard?.emergencyCard?.bloodType || 'O+'}</p>
                        </div>
                        <div>
                            <p className="text-red-200">Allergies</p>
                            <p className="font-semibold">{hp.allergies || 'None reported'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-red-200">Critical Medical Conditions</p>
                            <p className="font-semibold">{hp.conditions || 'None'}</p>
                        </div>
                    </div>

                    <button
                        onClick={copyShareUrl}
                        className="w-full py-3 bg-white text-red-600 font-bold rounded-xl shadow hover:bg-red-50 transition text-sm flex justify-center items-center gap-2"
                    >
                        🔗 Copy Emergency Sharing Link for Responders
                    </button>
                </div>
            )}

            {/* TAB 4: Reminders */}
            {activeTab === 'reminders' && (
                <div className="my-6 space-y-6">
                    <form onSubmit={handleAddReminder} className="p-4 bg-gray-50 border rounded-2xl flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-gray-600">Reminder Title</label>
                            <input
                                type="text"
                                value={remTitle}
                                onChange={(e) => setRemTitle(e.target.value)}
                                placeholder="e.g. Take Blood Pressure Medication"
                                className="w-full p-2.5 mt-1 border rounded-xl text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600">Time</label>
                            <input
                                type="text"
                                value={remTime}
                                onChange={(e) => setRemTime(e.target.value)}
                                placeholder="08:00 AM"
                                className="w-full p-2.5 mt-1 border rounded-xl text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600">Category</label>
                            <select
                                value={remType}
                                onChange={(e) => setRemType(e.target.value)}
                                className="w-full p-2.5 mt-1 border rounded-xl text-sm"
                            >
                                <option>Medication</option>
                                <option>Doctor Follow-up</option>
                                <option>Lab Test</option>
                                <option>Lifestyle Check</option>
                            </select>
                        </div>
                        <button type="submit" className="px-6 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm shadow">
                            + Add Reminder
                        </button>
                    </form>

                    <div className="space-y-3">
                        {reminders.map((rem) => (
                            <div
                                key={rem._id}
                                className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm flex justify-between items-center"
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={rem.active}
                                        onChange={() => handleToggleReminder(rem._id)}
                                        className="w-5 h-5 accent-primary cursor-pointer"
                                    />
                                    <div>
                                        <h4 className={`font-bold text-sm ${rem.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                                            {rem.title}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            ⏰ {rem.time} | Type: {rem.type}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${rem.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                    {rem.active ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthMemory;
