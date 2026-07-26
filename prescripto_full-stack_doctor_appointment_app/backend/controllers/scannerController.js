import userModel from '../models/userModel.js';

// Controller: Medicine Label & Pill Box Scanner
export const scanMedicine = async (req, res) => {
    try {
        const { userId, medicineName, query } = req.body;
        if (!userId) {
            return res.json({ success: false, message: "User authentication required" });
        }

        const name = (medicineName || query || 'Paracetamol').trim();
        const searchKey = name.toLowerCase();

        // Database of common medicine details & precautions
        const medicineDatabase = {
            'paracetamol': {
                name: 'Paracetamol / Acetaminophen (500mg)',
                category: 'Analgesic & Antipyretic',
                uses: 'Fever reduction, mild to moderate pain relief (headache, body ache).',
                dosage: '500mg - 1000mg every 4-6 hours as needed (Max 4000mg per 24 hours).',
                precautions: 'Do not consume with alcohol. Avoid taking multiple paracetamol-containing cold products simultaneously.',
                foodInteraction: 'Can be taken with or without food. Drink plenty of water.'
            },
            'amoxicillin': {
                name: 'Amoxicillin (500mg)',
                category: 'Penicillin Antibiotic',
                uses: 'Bacterial infections of throat, ear, chest, and urinary tract.',
                dosage: '500mg 3 times daily for 5-7 days as prescribed by your doctor.',
                precautions: 'Complete full prescribed course even if symptoms improve. Do not use if allergic to penicillin.',
                foodInteraction: 'Take at the start of a meal to minimize gastrointestinal discomfort.'
            },
            'cetirizine': {
                name: 'Cetirizine (10mg)',
                category: 'Antihistamine',
                uses: 'Allergy relief (sneezing, runny nose, watery eyes, skin itching).',
                dosage: '10mg once daily (preferably in the evening).',
                precautions: 'May cause drowsiness. Avoid driving or operating machinery after taking.',
                foodInteraction: 'May be taken with or without food.'
            },
            'metformin': {
                name: 'Metformin (500mg / 850mg)',
                category: 'Anti-Diabetic',
                uses: 'Blood sugar control in Type 2 Diabetes.',
                dosage: 'As prescribed by Endocrinologist / General Physician.',
                precautions: 'Monitor blood sugar levels regularly. Stay hydrated.',
                foodInteraction: 'Take with or immediately after meals to reduce stomach upset.'
            },
            'ibuprofen': {
                name: 'Ibuprofen (400mg)',
                category: 'NSAID (Anti-inflammatory)',
                uses: 'Pain relief, inflammation reduction, dental pain, joint pain.',
                dosage: '400mg every 6-8 hours after food.',
                precautions: 'Avoid taking on an empty stomach. Consult doctor if you have gastritis or kidney issues.',
                foodInteraction: 'Strictly take after food or with milk.'
            }
        };

        let result = null;
        for (const [key, details] of Object.entries(medicineDatabase)) {
            if (searchKey.includes(key)) {
                result = details;
                break;
            }
        }

        if (!result) {
            result = {
                name: name.toUpperCase(),
                category: 'Pharmaceutical Medication',
                uses: `General medicine query for ${name}. Helps manage symptoms when taken as prescribed.`,
                dosage: 'Follow doctor prescription label carefully.',
                precautions: 'Keep out of reach of children. Consult a pharmacist or doctor for exact dosage.',
                foodInteraction: 'Take with warm water after light food.'
            };
        }

        // Save scan to User's Isolated Scanned Medicines List
        const user = await userModel.findById(userId);
        if (user) {
            const scannedList = user.scannedMedicines || [];
            scannedList.unshift({
                id: 'scan-' + Date.now(),
                medicineName: result.name,
                category: result.category,
                scannedAt: new Date().toISOString()
            });
            await userModel.findByIdAndUpdate(userId, { scannedMedicines: scannedList });
        }

        res.json({
            success: true,
            medicine: result
        });

    } catch (error) {
        console.error("Medicine Scanner Error:", error);
        res.json({ success: false, message: error.message });
    }
};
