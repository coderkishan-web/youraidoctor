import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const DoctorsEmbedded = ({ initialSpecialty = 'All' }) => {
    const { backendUrl, token, doctors, getDoctosData } = useContext(AppContext);
    const [selectedSpecialty, setSelectedSpecialty] = useState(initialSpecialty || 'All');
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [slotDate, setSlotDate] = useState('');
    const [slotTime, setSlotTime] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    const specialties = [
        "All", "General physician", "Gynecologist", "Dermatologist",
        "Pediatricians", "Neurologist", "Gastroenterologist", "Cardiologist"
    ];

    useEffect(() => {
        if (initialSpecialty) {
            setSelectedSpecialty(initialSpecialty);
        }
    }, [initialSpecialty]);

    useEffect(() => {
        if (doctors && doctors.length > 0) {
            if (selectedSpecialty === 'All') {
                setFilteredDoctors(doctors);
            } else {
                setFilteredDoctors(
                    doctors.filter(doc => doc.speciality.toLowerCase().includes(selectedSpecialty.toLowerCase()))
                );
            }
        }
    }, [doctors, selectedSpecialty]);

    const handleBookAppointment = async (docId) => {
        if (!slotDate || !slotTime) {
            toast.error("Please select both Date and Time for your appointment");
            return;
        }

        setBookingLoading(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(
                backendUrl + '/api/user/book-appointment',
                { docId, slotDate, slotTime },
                { headers: { token } }
            );

            if (data.success) {
                toast.success("Appointment booked successfully with " + selectedDoc.name + "!");
                setSelectedDoc(null);
                setSlotDate('');
                setSlotTime('');
                if (getDoctosData) getDoctosData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to book appointment");
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className="p-6 bg-[#262626] rounded-2xl border border-[#3E3F4B] space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#383838]">
                <div>
                    <h3 className="font-extrabold text-white text-xl flex items-center gap-2">
                        👨‍⚕️ Book Doctor Specialist Appointment
                    </h3>
                    <p className="text-xs text-gray-400">Consult top verified medical specialists directly from your AI Workspace</p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap gap-1.5">
                    {specialties.map(spec => (
                        <button
                            key={spec}
                            onClick={() => setSelectedSpecialty(spec)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                selectedSpecialty.toLowerCase() === spec.toLowerCase()
                                    ? 'bg-blue-600 text-white font-bold shadow'
                                    : 'bg-[#343541] text-gray-300 hover:bg-[#3E3F4B]'
                            }`}
                        >
                            {spec}
                        </button>
                    ))}
                </div>
            </div>

            {/* Doctors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-1">
                {filteredDoctors.map((doc) => (
                    <div
                        key={doc._id}
                        className="p-4 bg-[#2A2B32] border border-[#3E3F4B] rounded-2xl hover:border-blue-500/50 transition flex flex-col justify-between"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <img
                                src={doc.image}
                                alt={doc.name}
                                className="w-14 h-14 rounded-full object-cover bg-blue-900/30 border border-blue-500/30"
                            />
                            <div>
                                <h4 className="font-bold text-white text-sm">{doc.name}</h4>
                                <span className="inline-block px-2 py-0.5 mt-1 bg-blue-500/20 text-blue-300 rounded text-[10px] font-bold uppercase border border-blue-500/30">
                                    {doc.speciality}
                                </span>
                                <p className="text-[11px] text-gray-400 mt-1">{doc.degree} • {doc.experience}</p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-[#383838] flex justify-between items-center text-xs">
                            <span className="font-bold text-emerald-400">Consultation: ₹{doc.fees}</span>
                            <button
                                onClick={() => setSelectedDoc(doc)}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow"
                            >
                                Book Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Booking Modal Popup */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-[#212121] border border-[#444654] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-[#303030] pb-3">
                            <h4 className="font-extrabold text-white text-base">Book with {selectedDoc.name}</h4>
                            <button onClick={() => setSelectedDoc(null)} className="text-gray-400 hover:text-white font-bold">✕</button>
                        </div>

                        <div className="text-xs space-y-3">
                            <div>
                                <label className="block text-gray-300 font-bold mb-1">Select Date:</label>
                                <input
                                    type="date"
                                    value={slotDate}
                                    onChange={(e) => setSlotDate(e.target.value)}
                                    className="w-full p-2.5 bg-[#2A2B32] border border-[#3E3F4B] rounded-xl text-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 font-bold mb-1">Select Time Slot:</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM", "07:30 PM"].map(time => (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => setSlotTime(time)}
                                            className={`p-2 rounded-xl text-xs font-bold transition border ${
                                                slotTime === time
                                                    ? 'bg-blue-600 text-white border-blue-500'
                                                    : 'bg-[#2A2B32] text-gray-300 border-[#3E3F4B] hover:bg-[#343541]'
                                            }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setSelectedDoc(null)}
                                className="flex-1 py-2.5 bg-[#2A2B32] hover:bg-[#343541] text-gray-300 font-bold rounded-xl text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleBookAppointment(selectedDoc._id)}
                                disabled={bookingLoading}
                                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-xs shadow hover:opacity-95 disabled:opacity-50"
                            >
                                {bookingLoading ? 'Confirming...' : 'Confirm Appointment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorsEmbedded;
