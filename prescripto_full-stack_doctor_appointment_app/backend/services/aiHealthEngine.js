import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const kbPath = path.join(process.cwd(), 'data', 'healthKnowledgeBase.json');
const datasetPath = path.join(process.cwd(), 'data', 'medical_dataset.json');
const fullDatasetPath = path.join(process.cwd(), 'data', 'full_medical_dataset.jsonl');

function loadKnowledgeBase() {
    try {
        if (fs.existsSync(kbPath)) {
            return JSON.parse(fs.readFileSync(kbPath, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading health knowledge base:', e);
    }
    return {
        firstAidGuides: [],
        symptomsMatrix: [],
        whoHealthGuidelines: [],
        ageGroups: {}
    };
}

function loadMedicalDatasetSample() {
    try {
        if (fs.existsSync(fullDatasetPath)) {
            const fileContent = fs.readFileSync(fullDatasetPath, 'utf8');
            const lines = fileContent.split('\n').filter(line => line.trim());
            const pairs = lines.map(line => JSON.parse(line));
            console.log(`[Database] Loaded ${pairs.length} medical dialogue records from: ${fullDatasetPath}`);
            return pairs;
        } else if (fs.existsSync(datasetPath)) {
            const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
            return data.qaPairs || [];
        }
    } catch (e) {
        console.error('Error loading medical dataset:', e);
    }
    return [];
}

const kb = loadKnowledgeBase();
const datasetSample = loadMedicalDatasetSample();

export function getAgeCategory(dobOrAge) {
    let age = 30; // default
    if (typeof dobOrAge === 'number') {
        age = dobOrAge;
    } else if (typeof dobOrAge === 'string' && dobOrAge.includes('-')) {
        const birthYear = new Date(dobOrAge).getFullYear();
        if (!isNaN(birthYear)) age = new Date().getFullYear() - birthYear;
    } else if (typeof dobOrAge === 'string' && !isNaN(parseInt(dobOrAge))) {
        age = parseInt(dobOrAge);
    }

    if (age < 18) return 'child_teen';
    if (age >= 60) return 'senior';
    return 'adult';
}

function detectLanguageStyle(text, profileLang = 'English') {
    const t = text.toLowerCase();

    // Check for Devanagari script
    if (/[\u0900-\u097F]/.test(text)) {
        if (text.includes('मराठी') || text.includes('आहे') || text.includes('डोके')) return 'marathiglish';
        return 'hinglish';
    }

    const marathiWords = [
        'majha', 'maza', 'dok', 'doka', 'doke', 'duktai', 'dukhtay', 'dukhat', 'dukhte', 'dukhataay',
        'mala', 'taap', 'tap', 'ahe', 'jhalay', 'alha', 'potat', 'pot', 'chatit', 'chati',
        'kay', 'karu', 'madhe', 'khup', 'khallay', 'tras', 'sang', 'naki', 'bar', 'vattay', 'dokadukhi',
        'kasa', 'kase', 'ahat', 'ahes', 'namaskar'
    ];
    if (marathiWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(t))) {
        return 'marathiglish';
    }

    const hinglishWords = [
        'mujhe', 'hai', 'kya', 'kaise', 'karu', 'kal', 'se', 'sar', 'dard', 'dawa', 'bukhar',
        'thik', 'samajh', 'raha', 'rahi', 'ho', 'bhai', 'doctor saab', 'khana', 'paani', 'tension',
        'pet', 'chhati', 'seene', 'batao', 'hoon', 'hote'
    ];
    if (hinglishWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(t))) {
        return 'hinglish';
    }

    // Default to English if no explicit Hinglish/Marathi words were typed
    return 'english';
}

function matchSpecialty(text) {
    const t = text.toLowerCase();
    
    if (['eye', 'eyes', 'vision', 'ophthalmology', 'aankh', 'aankhein', 'dola', 'dole'].some(w => t.includes(w))) {
        return { name: 'Ophthalmologist', icon: '👁️', description: 'Eye & Vision Specialist' };
    }
    if (['chest pain', 'seene', 'chhati', 'heart', 'angina', 'arm pain', 'jaw pain'].some(w => t.includes(w))) {
        return { name: 'Cardiologist', icon: '🫀', description: 'Heart & Cardiovascular Specialist' };
    }
    if (['headache', 'migraine', 'doka', 'dokadukhi', 'sar dard', 'sirdard', 'dizziness', 'numbness'].some(w => t.includes(w))) {
        return { name: 'Neurologist', icon: '🧠', description: 'Brain & Nervous System Specialist' };
    }
    if (['stomach', 'acidity', 'gas', 'potat', 'pet dard', 'heartburn', 'reflux', 'indigestion', 'vomit', 'nausea'].some(w => t.includes(w))) {
        return { name: 'Gastroenterologist', icon: '🫄', description: 'Digestive & Stomach Specialist' };
    }
    if (['skin', 'rash', 'itching', 'eczema', 'khaj', 'fungal', 'acne', 'pimples', 'allergy'].some(w => t.includes(w))) {
        return { name: 'Dermatologist', icon: '🩺', description: 'Skin & Allergy Specialist' };
    }
    if (['joint', 'bone', 'knee', 'back pain', 'sandhidukhi', 'kamar dard', 'arthritis', 'fracture'].some(w => t.includes(w))) {
        return { name: 'Orthopedic', icon: '🦴', description: 'Bone & Joint Specialist' };
    }
    if (['fever', 'taap', 'bukhar', 'cold', 'sardi', 'flu', 'fatigue', 'cough', 'khokla', 'body pain'].some(w => t.includes(w))) {
        return { name: 'General Physician', icon: '👨‍⚕️', description: 'Primary Care & General Medicine' };
    }
    
    return { name: 'General Physician', icon: '👨‍⚕️', description: 'Primary Care & General Medicine' };
}

function extractNewInsights(userMessage) {
    const text = userMessage.toLowerCase();
    const insights = [];

    if (text.includes('allergic to') || text.includes('allergy to')) {
        insights.push(`Allergy Note: ${userMessage}`);
    }
    if (text.includes('migraine when') || text.includes('headache when')) {
        insights.push(`Headache Trigger: ${userMessage}`);
    }
    if (text.includes('takes') || text.includes('taking') || text.includes('medication')) {
        insights.push(`Medication Usage: ${userMessage}`);
    }
    if (text.includes('bp') || text.includes('blood pressure')) {
        insights.push(`Blood Pressure Note: ${userMessage}`);
    }

    return insights;
}

export async function processOnboardingStep(stepIndex, userResponse, accumulatedData = {}) {
    const steps = [
        {
            key: 'preferredLanguage',
            question: "🌐 Select your **preferred language** style:",
            options: ["Marathiglish (Marathi + English)", "Hinglish (Hindi + English)", "English", "Hindi (हिंदी)", "Marathi (मराठी)", "Spanish (Español)"]
        },
        {
            key: 'age_gender',
            question: "👤 What is your **Age** and **Gender**?",
            placeholder: "e.g., 28, Male / Female"
        },
        {
            key: 'health_history',
            question: "🩺 Tell us about your **health history till now** & any current medical issues:",
            placeholder: "e.g., Mild BP, or No major issues"
        },
        {
            key: 'medications_allergies',
            question: "💊 Any **regular medications** or **allergies**?",
            placeholder: "e.g., Dust allergy, Vitamins"
        },
        {
            key: 'family_history',
            question: "👨‍👩‍👧 Any **family health history** to track?",
            placeholder: "e.g., Father has Diabetes"
        },
        {
            key: 'lifestyle_goals',
            question: "🏃 What are your **lifestyle & health goals**?",
            placeholder: "e.g., Fitness, weight loss, 7h sleep"
        }
    ];

    const updatedData = { ...accumulatedData };
    if (stepIndex > 0 && userResponse) {
        const prevKey = steps[stepIndex - 1].key;
        updatedData[prevKey] = userResponse;
    }

    const isFinished = stepIndex >= steps.length;

    if (isFinished) {
        const ageCategory = getAgeCategory(updatedData.age_gender || '');
        const ageInfo = kb.ageGroups[ageCategory] || kb.ageGroups['adult'];

        const profileSummary = {
            preferredLanguage: updatedData.preferredLanguage || 'Marathiglish',
            ageGender: updatedData.age_gender || 'Not specified',
            ageCategory: ageCategory,
            ageLabel: ageInfo.label,
            healthHistory: updatedData.health_history || 'No major issues reported',
            medicationsAllergies: updatedData.medications_allergies || 'None reported',
            familyHistory: updatedData.family_history || 'None reported',
            lifestyleGoals: updatedData.lifestyle_goals || 'General health maintenance',
            learnedInsights: [],
            completedAt: new Date().toISOString()
        };

        const completionMessage = `🤝 **Health Profile Saved!**\n\n` +
            `I am now your personal **AI Family Doctor Assistant** in **${profileSummary.preferredLanguage}**.\n\n` +
            `I have recorded your complete background and will remember your health history in every conversation. How are you feeling right now? Tell me any symptom or health query!`;

        return {
            isFinished: true,
            message: completionMessage,
            profileSummary,
            nextStepIndex: steps.length
        };
    }

    return {
        isFinished: false,
        question: steps[stepIndex].question,
        options: steps[stepIndex].options || null,
        placeholder: steps[stepIndex].placeholder || '',
        nextStepIndex: stepIndex + 1,
        accumulatedData: updatedData
    };
}

export async function fetchWhoData() {
    try {
        const url = 'https://ghoapi.azureedge.net/api/Indicator?$top=5';
        const res = await fetch(url, { timeout: 3000 });
        if (res.ok) {
            const data = await res.json();
            if (data && data.value) {
                return data.value.map(item => ({
                    code: item.IndicatorCode,
                    name: item.IndicatorName
                }));
            }
        }
    } catch (e) {}
    return kb.whoHealthGuidelines;
}

// Condition-Specific Clinical Diagnostic Catalog
const clinicalCatalog = {
    headache: {
        categoryName: 'Headache & Neurological Checkup',
        specialty: { name: 'Neurologist', icon: '🧠', description: 'Brain & Nervous System Specialist' },
        turn1Questions: (name, lang) => {
            if (lang === 'marathiglish') return `🤝 Kalaji karu naka ${name}, mi ethe ahe.\n\nDokadukhi badal mhatvache clinical details sanga:\n1. Ha tras **kasa feel hoto** — throbbing (dhab-dhab), heavy pressure, ki sharp pain?\n2. Ha tras **ekach bajula** (left/right temple) ahe ki sarv doke dukhat ahe?\n3. Ha tras **kadhapasun hoto ahe** (hours / days)?`;
            if (lang === 'hinglish') return `🤝 Tension mat lijiye ${name}, main hoon na.\n\nSar dard ke baare me kuch zaroori clinical details batayein:\n1. Yeh dard **kaisa feel ho raha hai** — throbbing (dhap-dhap), heavy pressure, ya sharp pain?\n2. Yeh dard **ek taraf** (left/right) hai ya pure sar me hai?\n3. Yeh **kab se shuru hua hai** (ghante ya din)?`;
            return `🤝 Don't worry ${name}, I am right here with you.\n\nTo evaluate your headache accurately, please share a few clinical details:\n1. **Nature of Pain**: Is it a throbbing/pulsating pain, a dull heavy pressure, or a sharp stabbing pain?\n2. **Location**: Is it focused on one side (left/right temple) or all over your head?\n3. **Duration**: How many hours or days has it been persisting?`;
        },
        turn2Questions: (name, lang) => {
            if (lang === 'marathiglish') return `👍 Samajhlo ${name}.\n\nAjun 2 mhatvache clinical signs check kara:\n1. Tumhala **light/sound sensitivity, dhundhla visual, kinva nausea (ultee sarakh)** vatatay ka?\n2. Mane madhe (neck stiffness) tight pain kinva taap (fever) ahe ka?`;
            if (lang === 'hinglish') return `👍 Samajh gaya ${name}.\n\nKuch aur zaroori clinical signs check karein:\n1. Kya aapko **light/sound sensitivity, blurred vision, ya nausea (ulti jaisa)** feel ho raha hai?\n2. Gardan (neck stiffness) me akad ya bukhar bhi hai?`;
            return `👍 Thank you for clarifying, ${name}.\n\nTwo critical clinical diagnostic checks:\n1. Are you experiencing any **sensitivity to light/sound, visual blurriness, or nausea**?\n2. Do you have any **neck stiffness or fever** along with the headache?`;
        },
        getAssessment: (responses, name) => {
            const allText = responses.join(' ').toLowerCase();
            const isMigraine = allText.includes('one side') || allText.includes('throbbing') || allText.includes('light') || allText.includes('nausea') || allText.includes('dhap');
            const primaryDiag = isMigraine ? 'Migraine with/without Aura' : 'Tension-Type Headache';
            return {
                primaryDiag,
                secondaryDiag: 'Stress & Cervicogenic Strain / Dehydration',
                tests: 'MRI/CT Brain (if severe/persistent), Ophthalmic Vision Check, Blood Pressure Log',
                homeCare: 'Rest in a dark quiet room, drink 2-3L water daily, apply cold forehead compress, limit screen exposure.',
                specialty: { name: 'Neurologist', icon: '🧠', description: 'Brain & Nervous System Specialist' }
            };
        }
    },
    stomach: {
        categoryName: 'Gastrointestinal & Stomach Checkup',
        specialty: { name: 'Gastroenterologist', icon: '🫄', description: 'Digestive & Stomach Specialist' },
        turn1Questions: (name, lang) => {
            if (lang === 'marathiglish') return `🤝 Kalaji karu naka ${name}, mi ethe ahe.\n\nPotachya trasabaddal sanga:\n1. Ha tras **varachya bhagat (chest/acidity center)** ahe ki **khali potat** (lower abdomen)?\n2. Jevanantarch (after spicy/oily food) ha tras vadhata ka?\n3. Burning (jalan/stomach burn) feel hota ka?`;
            if (lang === 'hinglish') return `🤝 Tension mat lijiye ${name}, main hoon na.\n\nPet ke dard ke baare me batayein:\n1. Yeh dard **upar ke hisse me (chest/acidity)** hai ya **niche pet me**?\n2. Kya khana khane ke baad (spicy/oily food) yeh badhta hai?\n3. Burning (jalan) feel ho rahi hai?`;
            return `🤝 Don't worry ${name}, I am here for you.\n\nTo analyze your stomach discomfort:\n1. **Location**: Is the pain in the upper stomach (below ribcage) or lower abdomen?\n2. **Sensation**: Is it a burning acidity feeling, cramping, or heavy bloating?\n3. **Meal Relation**: Does it worsen after spicy, oily, or heavy meals?`;
        },
        turn2Questions: (name, lang) => {
            if (lang === 'marathiglish') return `👍 Samajhlo ${name}.\n\nAjun 2 mhatvache clinical check:\n1. Tumhala **nausea / vomiting / sour burps (khatte dakar)** yeta ka?\n2. Stool/Motion clear ahe ka, kinva constipation/diarrhea hoto ahe?`;
            if (lang === 'hinglish') return `👍 Samajh gaya ${name}.\n\nDo aur clinical checks:\n1. Kya **nausea / vomiting / khatti dakar** aa rahi hai?\n2. Motion clear hai ya constipation / diarrhea ki dikkat hai?`;
            return `👍 Got it, ${name}.\n\nTwo more clinical checks:\n1. Are you experiencing **nausea, vomiting, or acid reflux (sour burps)**?\n2. Have you noticed any **constipation, diarrhea, or unusual bowel changes**?`;
        },
        getAssessment: (responses, name) => {
            const allText = responses.join(' ').toLowerCase();
            const isReflux = allText.includes('burn') || allText.includes('acidity') || allText.includes('chest') || allText.includes('spicy');
            const primaryDiag = isReflux ? 'GERD (Gastroesophageal Reflux) / Hyperacidity' : 'Acute Gastritis / Functional Dyspepsia';
            return {
                primaryDiag,
                secondaryDiag: 'Irritable Bowel Syndrome / Dietary Intolerance',
                tests: 'Upper GI Endoscopy (if chronic), Abdominal Ultrasound, H. pylori Stool Antigen Test',
                homeCare: 'Eat small frequent bland meals, do not lie down for 2 hours after meals, drink warm water, avoid caffeine & sodas.',
                specialty: { name: 'Gastroenterologist', icon: '🫄', description: 'Digestive & Stomach Specialist' }
            };
        }
    },
    joint: {
        categoryName: 'Orthopedic & Joint Checkup',
        specialty: { name: 'Orthopedic', icon: '🦴', description: 'Bone & Joint Specialist' },
        turn1Questions: (name, lang) => {
            if (lang === 'marathiglish') return `🤝 Kalaji karu naka ${name}, mi ethe ahe.\n\nJoint/Kamar pain baddal sanga:\n1. Konthya **joint madhe** (knee/shoulder/lower back) tras ahe?\n2. Swelling (suj) kinva redness ahe ka?\n3. Chaltana kinva stairs chadhana vadhata ka?`;
            if (lang === 'hinglish') return `🤝 Tension mat lijiye ${name}, main hoon na.\n\nJoint/Kamar pain ke baare me bataiye:\n1. Kis **joint me** (ghutna/knee, kamar/back, shoulder) dard hai?\n2. Kya **sujan (swelling)** ya redness bhi hai?\n3. Chalne ya stairs chadhne me dard badhta hai?`;
            return `🤝 Don't worry ${name}, I am right here.\n\nTo evaluate your joint discomfort:\n1. **Affected Joint**: Which joint is hurting (knee, lower back, shoulder, ankle)?\n2. **Swelling & Mobility**: Is there visible swelling, warmth, or difficulty walking/climbing stairs?\n3. **Duration**: How long have you been experiencing this pain or stiffness?`;
        },
        turn2Questions: (name, lang) => {
            if (lang === 'marathiglish') return `👍 Samajhlo ${name}.\n\nAjun ek mhatvacha check:\n1. Sakali uthlyavar **30 mins peksa jaast akad (morning stiffness)** aste ka?\n2. Popping/clicking sound kinva joint locking hoto ka?`;
            if (lang === 'hinglish') return `👍 Samajh gaya ${name}.\n\nEk aur clinical check:\n1. Subah uthne par **30 mins se zyada akad (morning stiffness)** rehti hai?\n2. Kya joint me clicking sound ya locking feel hoti hai?`;
            return `👍 Thank you, ${name}.\n\nTwo diagnostic checks:\n1. Do you experience **morning joint stiffness lasting over 30 minutes** after waking up?\n2. Have you noticed any **clicking sounds or joint locking** when bending?`;
        },
        getAssessment: (responses, name) => {
            const allText = responses.join(' ').toLowerCase();
            const isArthritis = allText.includes('stiffness') || allText.includes('swelling') || allText.includes('morning');
            const primaryDiag = isArthritis ? 'Early Osteoarthritis / Inflammatory Arthropathy' : 'Mechanical Joint Strain / Tendonitis';
            return {
                primaryDiag,
                secondaryDiag: 'Ligamentous Strain / Cartilage Wear',
                tests: 'Weight-Bearing X-Ray of Joint, Serum Uric Acid, Vitamin D3 & Calcium Panel, ESR/CRP',
                homeCare: 'Apply ice for acute swelling or warm compress for chronic stiffness; avoid twisting/high-impact jumps; do gentle quadriceps exercises.',
                specialty: { name: 'Orthopedic', icon: '🦴', description: 'Bone & Joint Specialist' }
            };
        }
    },
    fever: {
        categoryName: 'Febrile & Viral Infection Checkup',
        specialty: { name: 'General Physician', icon: '👨‍⚕️', description: 'Primary Care & General Medicine' },
        turn1Questions: (name, lang) => {
            if (lang === 'marathiglish') return `🤝 Kalaji karu naka ${name}, mi ethe ahe.\n\nTaap/Fever baddal sanga:\n1. Highest **temperature** kiti record jhala ahe (e.g. 100°F, 102°F)?\n2. Hyasobat **khokla (cough), sardi, sore throat, kinva bodyache** ahe ka?\n3. Thandi (chills) vajun taap yeto ka?`;
            if (lang === 'hinglish') return `🤝 Tension mat lijiye ${name}, main hoon na.\n\nBukhar ke baare me bataiye:\n1. Highest **temperature kitna** record hua hai (e.g. 100°F, 102°F)?\n2. Kya saath me **khansi (cough), sardi, gale me dard, ya body pain** hai?\n3. Thand/Chills lag ke bukhar aata hai?`;
            return `🤝 Don't worry ${name}, I am here to help.\n\nTo assess your fever:\n1. **Temperature**: What is your highest recorded temperature (e.g. 100°F, 102°F)?\n2. **Symptoms**: Do you have a cold, cough, sore throat, or severe body aches?\n3. **Chills**: Are you experiencing shivering or chills with temperature spikes?`;
        },
        turn2Questions: (name, lang) => {
            if (lang === 'marathiglish') return `👍 Samajhlo ${name}.\n\nAjun 2 mhatvache check:\n1. **Khup thakva (extreme fatigue) / nausea** ahe ka?\n2. Skin var rash kinva aankhon ke peeche dard ahe ka?`;
            if (lang === 'hinglish') return `👍 Samajh gaya ${name}.\n\nDo aur checks:\n1. Kya **extreme fatigue/weakness ya nausea** feel ho raha hai?\n2. Skin par rash ya aankhon ke peeche dard hai?`;
            return `👍 Thank you, ${name}.\n\nTwo critical checks:\n1. Are you experiencing **extreme fatigue, loss of appetite, or severe muscle aches**?\n2. Have you noticed any **skin rashes or pain behind your eyes**?`;
        },
        getAssessment: (responses, name) => {
            const allText = responses.join(' ').toLowerCase();
            const isRespiratory = allText.includes('cough') || allText.includes('throat') || allText.includes('sardi');
            const primaryDiag = isRespiratory ? 'Acute Upper Respiratory Tract Viral Infection' : 'Acute Febrile Viral Syndrome';
            return {
                primaryDiag,
                secondaryDiag: 'Viral Influenza / Seasonal Infection',
                tests: 'Complete Blood Count (CBC) with Platelets, Dengue NS1 & Malarial Antigen (if fever >3 days), CRP',
                homeCare: 'Hydrate continuously with ORS, coconut water, & warm soups; rest adequately; sponge with lukewarm water if temp >101°F.',
                specialty: { name: 'General Physician', icon: '👨‍⚕️', description: 'Primary Care & General Medicine' }
            };
        }
    },
    skin: {
        categoryName: 'Dermatology & Skin Checkup',
        specialty: { name: 'Dermatologist', icon: '🩺', description: 'Skin & Allergy Specialist' },
        turn1Questions: (name, lang) => {
            if (lang === 'marathiglish') return `🤝 Kalaji karu naka ${name}, mi ethe ahe.\n\nSkin rash baddal sanga:\n1. Sharirachya **konthya bhagat** rash/itching ahe?\n2. Khaj (itching) khup ahe ka?\n3. Red bumps, dry patches, kinva blisters phode ahet ka?`;
            if (lang === 'hinglish') return `🤝 Tension mat lijiye ${name}, main hoon na.\n\nSkin rash ke baare me bataiye:\n1. Body ke **kis part me** rash/khajli hai?\n2. Khajli (itching) zyada ho rahi hai?\n3. Red bumps, dry patches ya blisters hain?`;
            return `🤝 Don't worry ${name}, I am right here.\n\nTo evaluate your skin concern:\n1. **Location**: Where on your body is the rash or irritation located?\n2. **Appearance**: Are there red bumps, scaly patches, or fluid blisters?\n3. **Itching**: Is it intensely itchy or actively spreading?`;
        },
        turn2Questions: (name, lang) => {
            if (lang === 'marathiglish') return `👍 Samajhlo ${name}.\n\nAjun 2 check:\n1. Recently navin soap, cosmetics, kinva medication start kele ka?\n2. Kahi food allergy history ahe ka?`;
            if (lang === 'hinglish') return `👍 Samajh gaya ${name}.\n\nDo aur checks:\n1. Kya koi naya soap, cosmetic, ya oral medication start kiya?\n2. Koi food ya environmental allergy ki history hai?`;
            return `👍 Thank you, ${name}.\n\nTwo allergy checks:\n1. Have you recently started using any **new soap, cosmetic, detergent, or oral medication**?\n2. Do you have a known history of **food or environmental allergies**?`;
        },
        getAssessment: (responses, name) => {
            const allText = responses.join(' ').toLowerCase();
            const isAllergic = allText.includes('soap') || allText.includes('cosmetic') || allText.includes('itch') || allText.includes('khaj');
            const primaryDiag = isAllergic ? 'Acute Contact Dermatitis / Urticarial Rash' : 'Eczematous Dermatosis / Superficial Mycosis';
            return {
                primaryDiag,
                secondaryDiag: 'Atopic Dermatitis / Allergic Flare',
                tests: 'Serum IgE & Allergy Panel Test, Skin Scraping for KOH (if fungal suspected), Dermoscopy',
                homeCare: 'Avoid scratching area; apply gentle fragrance-free moisturizer; use lukewarm water; wear loose breathable cotton clothing.',
                specialty: { name: 'Dermatologist', icon: '🩺', description: 'Skin & Allergy Specialist' }
            };
        }
    },
    eye: {
        categoryName: 'Ophthalmology & Eye Discomfort Checkup',
        specialty: { name: 'Ophthalmologist', icon: '👁️', description: 'Eye & Vision Specialist' },
        turn1Questions: (name, lang) => {
            if (lang === 'marathiglish') return `🤝 Kalaji karu naka ${name}, mi ethe ahe.\n\nDolyanchya trasabaddal sanga:\n1. Doley **burning/watery (paani yene/jalgai)** ahet ki redness/pain ahe?\n2. Screen work (laptop/mobile) mule vadhata ka?\n3. Visual blurriness (dhundhla distay) ahe ka?`;
            if (lang === 'hinglish') return `🤝 Tension mat lijiye ${name}, main hoon na.\n\nAankhon ki dikkat ke baare me batayein:\n1. Aankhein **burning/watery (pani aana/jalan)** hain ya redness/dard hai?\n2. Kya screen work (laptop/phone) se yeh badhta hai?\n3. Dhundhla (blurred vision) bhi feel ho raha hai?`;
            return `🤝 Don't worry ${name}, I am right here for you.\n\nTo analyze your eye discomfort:\n1. **Sensation**: Are your eyes feeling burning, watery, or dry & irritated?\n2. **Screen & Triggers**: Did this start after long hours of screen work (laptop/phone)?\n3. **Vision Changes**: Are you experiencing any blurred vision or double vision?`;
        },
        turn2Questions: (name, lang) => {
            if (lang === 'marathiglish') return `👍 Samajhlo ${name}.\n\nAjun 2 mhatvache clinical check:\n1. Dolyant **puss/discharge (chikkat paani)** alay ka?\n2. Light kdhe pahtana pain vadhata ka (photophobia)?`;
            if (lang === 'hinglish') return `👍 Samajh gaya ${name}.\n\nDo aur clinical checks:\n1. Kya aankhon me **pus/discharge ya redness** hai?\n2. Light ki taraf dekhne me dard badhta hai (photophobia)?`;
            return `👍 Got it, ${name}.\n\nTwo critical eye safety checks:\n1. Is there any **yellow discharge/pus or severe eye redness**?\n2. Are your eyes **painfully sensitive to bright light (photophobia)** or do you have a headache?`;
        },
        getAssessment: (responses, name) => {
            const allText = responses.join(' ').toLowerCase();
            const isComputerStrain = allText.includes('screen') || allText.includes('laptop') || allText.includes('read') || allText.includes('burn');
            const primaryDiag = isComputerStrain ? 'Computer Vision Syndrome (CVS) / Digital Eye Strain' : 'Dry Eye Syndrome / Allergic Conjunctivitis';
            return {
                primaryDiag,
                secondaryDiag: 'Refractive Error / Ocular Surface Inflammation',
                tests: 'Ophthalmic Visual Acuity Test, Slit Lamp Eye Examination, Tear Film Breakup Time (TBUT)',
                homeCare: 'Follow 20-20-20 rule (every 20 min look 20 ft away for 20 sec); use lubricating eye drops; reduce screen brightness; wear anti-glare glasses.',
                specialty: { name: 'Ophthalmologist', icon: '👁️', description: 'Eye & Vision Specialist' }
            };
        }
    }
};

function getConditionCategory(messageText) {
    const t = messageText.toLowerCase();

    if (['eye', 'eyes', 'vision', 'burning eyes', 'watery eyes', 'eye pain', 'blurred vision', 'dola', 'dole', 'aankh', 'aankhein'].some(w => t.includes(w))) {
        return 'eye';
    }
    if (['headache', 'migraine', 'doka', 'dokadukhi', 'sar dard', 'sirdard', 'head pain', 'dizziness'].some(w => t.includes(w))) {
        return 'headache';
    }
    if (['stomach', 'acidity', 'gas', 'potat', 'pet dard', 'heartburn', 'reflux', 'indigestion', 'vomit', 'nausea', 'gut'].some(w => t.includes(w))) {
        return 'stomach';
    }
    if (['joint', 'knee', 'back pain', 'kamar', 'sandhidukhi', 'bone', 'ankle', 'shoulder', 'arthritis'].some(w => t.includes(w))) {
        return 'joint';
    }
    if (['fever', 'taap', 'bukhar', 'cold', 'sardi', 'flu', 'cough', 'khokla', 'chills', 'temperature'].some(w => t.includes(w))) {
        return 'fever';
    }
    if (['skin', 'rash', 'itching', 'khaj', 'acne', 'pimples', 'allergy', 'eczema', 'bump'].some(w => t.includes(w))) {
        return 'skin';
    }

    return 'general';
}

function findDatasetInsights(userText, categoryKey) {
    if (!datasetSample || datasetSample.length === 0) return null;
    const catWords = {
        headache: ['headache', 'migraine', 'head', 'spine', 'numbness'],
        stomach: ['stomach', 'acidity', 'reflux', 'gastritis', 'digestion', 'abdominal'],
        joint: ['joint', 'knee', 'back', 'spine', 'arthritis', 'shoulder'],
        fever: ['fever', 'flu', 'cough', 'chills', 'viral'],
        skin: ['skin', 'rash', 'acne', 'eczema', 'itching']
    };

    const targetWords = catWords[categoryKey] || [];
    if (targetWords.length === 0) return null;

    for (const pair of datasetSample) {
        const queryLower = (pair.patientQuery || '').toLowerCase();
        if (targetWords.some(w => queryLower.includes(w))) {
            return pair.doctorResponse;
        }
    }
    return null;
}

async function callGeminiAPI(userMessage, systemPrompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: `${systemPrompt}\n\nPatient Input: ${userMessage}\nPersonal Doctor Response (Concise & clinically empathetic):` }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 400,
                    temperature: 0.7
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                let text = data.candidates[0].content.parts[0].text.trim();
                text = text.replace(/\*\*/g, ''); // Strip raw asterisks
                return text;
            }
        }
    } catch (e) {
        console.error("Gemini API Error:", e);
    }
    return null;
}

async function callHuggingFaceLLM(userMessage, systemPrompt) {
    const token = process.env.HF_TOKEN || "";
    const models = [
        "Qwen/Qwen2.5-72B-Instruct",
        "meta-llama/Llama-3.3-70B-Instruct",
        "google/gemma-3-27b-it"
    ];

    for (const model of models) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ],
                    max_tokens: 300,
                    temperature: 0.7
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && data.choices && data.choices[0] && data.choices[0].message) {
                    let text = data.choices[0].message.content.trim();
                    text = text.replace(/\*\*/g, '');
                    return text;
                }
            }
        } catch (e) {
            // Failover to local clinical engine
        }
    }
    return null;
}

function scanAllergyConflicts(userAllergies, responseText) {
    if (!userAllergies || userAllergies.toLowerCase().includes('none') || userAllergies.trim() === '') return null;
    
    // Clean and split user allergies into keywords
    const allergyKeywords = userAllergies.toLowerCase()
        .replace(/[.,;]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['have', 'dust', 'regular', 'food', 'none', 'allergy', 'allergies'].includes(w));

    const responseLower = responseText.toLowerCase();
    const matches = [];

    for (const keyword of allergyKeywords) {
        if (responseLower.includes(keyword)) {
            matches.push(keyword.toUpperCase());
        }
    }

    if (matches.length > 0) {
        return `⚠️ ALLERGY CONFLICT WARNING:\n` +
               `You have reported an allergy to "${matches.join(', ')}" in your health profile.\n` +
               `Do NOT consume any medications, ingredients, or remedies containing these components without direct physician authorization.`;
    }
    return null;
}

// Multi-Turn Diagnostic Session Engine
export async function generateAIHealthResponse(userMessage, userProfile = {}) {
    const msg = userMessage.toLowerCase();
    const userName = userProfile?.name || 'friend';
    const profileLang = userProfile?.healthProfile?.preferredLanguage || 'English';
    const langStyle = detectLanguageStyle(userMessage, profileLang);
    const categoryKey = getConditionCategory(userMessage);
    const catalogItem = clinicalCatalog[categoryKey];
    const matchedSpecialty = catalogItem ? catalogItem.specialty : matchSpecialty(userMessage);
    const newInsights = extractNewInsights(userMessage);

    // Get active diagnostic intake session state
    const healthProfile = userProfile?.healthProfile || {};
    let session = healthProfile.activeSession || {
        turn: 0,
        status: 'none',
        symptoms: [],
        responses: []
    };
    if (!Array.isArray(session.responses)) {
        session.responses = [];
    }

    // 0.5 Crisis & Self-Harm Safety Bypass
    const crisisKeywords = ['suicide', 'kill myself', 'self harm', 'harm myself', 'end my life', 'want to die', 'poisoned myself', 'aatmahatya', 'marne ki'];
    if (crisisKeywords.some(w => msg.includes(w))) {
        return {
            type: 'emergency_triage',
            urgency: 'CRITICAL SAFETY EMERGENCY',
            riskBadge: 'SAFETY CRITICAL CRISIS',
            reply: `🚨 SAFETY ALERT: Please reach out for support immediately.\n\n` +
                   `Dear ${userName}, your life is extremely valuable. If you are experiencing thoughts of self-harm or emotional distress, please contact these free, confidential professional helplines immediately:\n\n` +
                   `• NIMHANS Mental Health Helpline: 080-46110007 (Available 24/7)\n` +
                   `• AASRA Suicide Prevention: +91-9820466726\n` +
                   `• Vandrevala Foundation: +91 9999 666 555 / +91 8999 003 003\n` +
                   `• National Emergency Services: 112 / 100\n\n` +
                   `Please talk to a family member, trusted friend, or healthcare provider right away. You are not alone.`,
            newInsights,
            recommendedSpecialty: { name: 'General Physician', icon: '👨‍⚕️', description: 'Mental & Physical Health Support' },
            bookingAction: false,
            session: { turn: 0, status: 'completed', responses: [] }
        };
    }

    // 1. Sub-Millisecond Red-Flag Emergency Bypass
    for (const guide of kb.firstAidGuides || []) {
        if (guide.triggerWords && guide.triggerWords.some(kw => msg.includes(kw))) {
            return {
                type: 'emergency_triage',
                urgency: guide.urgency || 'HIGH EMERGENCY',
                riskBadge: 'HIGH EMERGENCY',
                reply: `🚨 EMERGENCY WARNING: ${guide.title.toUpperCase()}\n\n` +
                       `Dear ${userName}, please stay calm. Follow these immediate emergency steps:\n` +
                       guide.steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n') + `\n\n` +
                       `⚠️ Do Not: ${guide.doNot.join(' ')}\n\n` +
                       `📞 Call Emergency Ambulance (108 / 112) immediately!`,
                newInsights,
                recommendedSpecialty: { name: 'Cardiologist', icon: '🫀', description: 'Immediate Medical & Cardiovascular Care' },
                bookingAction: true,
                session: { turn: 0, status: 'completed', responses: [] }
            };
        }
    }

    // 2. Warm Time-Aware Greetings
    const hour = new Date().getHours();
    const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const greetings = ['hi', 'hello', 'hey', 'kaise ho', 'kasa ahes', 'kasa ahat', 'namaskar', 'good morning', 'good evening', 'good afternoon'];

    if (greetings.some(g => msg.includes(g)) && session.turn === 0) {
        return {
            type: 'general',
            riskBadge: null,
            reply: langStyle === 'marathiglish'
                ? `${timeGreet} ${userName}! 😊 Kase ahat? Sanga, aaj tumhala kasa vatatay? Mi tumchya borobar ahe.`
                : langStyle === 'hinglish'
                ? `${timeGreet} ${userName}! 😊 Aap kaise hain? Batao, aaj kya feel ho raha hai? Main hoon na aapke saath.`
                : `${timeGreet}, ${userName}! 😊 How are you doing today? Tell me what's on your mind — I'm right here for you.`,
            newInsights,
            session: { turn: 0, status: 'none', responses: [] }
        };
    }

    // 3. Multi-Turn Condition-Specific Diagnostic Flow
    const currentTurn = session.turn + 1;
    session.responses.push(userMessage);

    if (currentTurn === 1) {
        // TURN 1: Ask Condition-Specific Clinical Questions
        session.turn = 1;
        session.status = 'in_progress';
        session.categoryKey = categoryKey;
        session.specialty = matchedSpecialty;

        const turn1Reply = catalogItem
            ? catalogItem.turn1Questions(userName, langStyle)
            : (langStyle === 'marathiglish'
                ? `🤝 Kalaji karu naka ${userName}, mi ethe ahe.\n\nTumhi sangu shakta ka: Ha tras kadhapasun hoto ahe (hours/days) ani exact konthya bhagat hoto ahe?`
                : langStyle === 'hinglish'
                ? `🤝 Tension mat lijiye ${userName}, main hoon na.\n\nKya aap bata sakte hain: Yeh dikkat kab se shuru hui hai aur exact kis jagah pe feel ho rahi hai?`
                : `🤝 Don't worry ${userName}, I'm here with you.\n\nCould you tell me: How long have you been feeling this (hours/days) and where exactly is the discomfort located?`);

        return {
            type: 'symptom_assessment',
            riskBadge: null,
            reply: turn1Reply,
            newInsights,
            session,
            bookingAction: false
        };

    } else if (currentTurn === 2) {
        // TURN 2: Ask Condition-Specific Associated Symptoms & Red Flags
        session.turn = 2;

        const activeCat = session.categoryKey || categoryKey;
        const activeItem = clinicalCatalog[activeCat];

        const turn2Reply = activeItem
            ? activeItem.turn2Questions(userName, langStyle)
            : (langStyle === 'marathiglish'
                ? `👍 Samajhlo ${userName}.\n\nAjun ek: Tumhala hyasobat nausea / fever / dizziness asa kahi hoto ka? Ani ha tras kashamule vadhato?`
                : langStyle === 'hinglish'
                ? `👍 Samajh gaya ${userName}.\n\nEk aur baat: Kya aapko iske saath nausea / bukhar / chakkar bhi ho raha hai? Aur yeh kab badhta hai?`
                : `👍 Got it, ${userName} — thank you.\n\nOne more thing: Are you also experiencing any nausea, fever, or dizziness? And does anything seem to trigger or worsen it?`);

        return {
            type: 'symptom_assessment',
            riskBadge: null,
            reply: turn2Reply,
            newInsights,
            session,
            bookingAction: false
        };

    } else {
        // TURN 3: Accurate Synthesis, Differential Diagnoses, Diagnostic Tests & Doctor Recommendation
        session.turn = 3;
        session.status = 'completed';

        const activeCat = session.categoryKey || categoryKey;
        const activeItem = clinicalCatalog[activeCat];
        const turnHistoryText = session.responses.join('; ');
        const severityStage = determineSeverityStage(userMessage, turnHistoryText);

        let assessmentData;
        if (activeItem) {
            assessmentData = activeItem.getAssessment(session.responses, userName);
        } else {
            const spec = matchSpecialty(turnHistoryText);
            assessmentData = {
                primaryDiag: 'General Medical Discomfort / Viral Syndrome',
                secondaryDiag: 'Stress / Environmental Strain',
                tests: 'Routine Complete Blood Count (CBC) & Vital Signs Log',
                homeCare: 'Rest adequately, maintain liquid hydration (2L/day), monitor symptoms.',
                specialty: spec
            };
        }

        // Define Ayurvedic traditional remedies for Stage 2 moderate conditions
        const ayurvedicRemedies = {
            headache: 'Apply warm ginger paste or sandalwood paste on forehead; drink warm herbal ginger tea.',
            stomach: 'Chew fennel seeds (saunf) after meals; drink lukewarm cumin (jeera) water or fresh coconut water to soothe reflux.',
            joint: 'Massage the affected joint gently with warm sesame (til) oil; drink warm organic turmeric (haldi) milk daily.',
            fever: 'Drink warm Tulsi-ginger herbal infusion (kadha) with honey; practice steam inhalation for cold or congestion.',
            skin: 'Apply fresh organic Aloe Vera gel or organic neem leaf paste to soothe irritation; avoid harsh chemical soaps.',
            eye: 'Wash eyes with clean cool water; place cotton pads soaked in organic rose water or chilled cucumber slices over eyelids.',
            general: 'Drink warm water regularly; consume organic ginger-honey tea; maintain light, easily digestible meals.'
        };
        const activeAyurveda = ayurvedicRemedies[activeCat] || ayurvedicRemedies.general;

        // Search dataset for matching doctor advice sample (out of all 3,100 records!)
        const doctorDatasetNote = findDatasetInsights(turnHistoryText, activeCat);
        const datasetSnippet = doctorDatasetNote
            ? `\n\n💡 Clinical Medical Knowledge Note:\n${doctorDatasetNote.substring(0, 320)}...`
            : '';

        // Construct System Prompt for Gemini Pro / HuggingFace LLM incorporating Severity Stages
        const systemPrompt = `You are a warm, highly professional AI Personal Family Doctor.
Analyze the patient's multi-turn symptom checkup:
- Patient Name: ${userName}
- Health Profile: Age/Gender: ${healthProfile.ageGender || 'unspecified'}, History: ${healthProfile.healthHistory || 'none'}, Allergies: ${healthProfile.medicationsAllergies || 'none'}.
- Symptom Intake History: ${turnHistoryText}

You MUST tailor your response to Clinical Severity Stage: STAGE ${severityStage}.
- STAGE 1 (Mild/Common): Focus on simple reassuring lifestyle remedies, common OTC drugs (like Paracetamol or Antacids), and tell them it can be easily managed at home. Do not advise doctor visit unless getting worse.
- STAGE 2 (Moderate): Provide clear clinical home care, safe OTC options, and suggest safe natural Ayurvedic/herbal home remedies (like ginger-tulsi kadha, turmeric milk, or cumin water). Advise them to consult a specialist doctor if symptoms do not improve in 48 hours.
- STAGE 3 (Critical/Emergency): Focus strictly on immediate first-aid instructions, direct emergency hotline calls, and visiting the nearest doctor/ER immediately.

Provide a clinical report including:
1. CLINICAL DIFFERENTIAL DIAGNOSES (Primary suspected condition & secondary differential).
2. RECOMMENDED DIAGNOSTIC TESTS TO DISCUSS WITH DOCTOR.
3. CLINICAL PRECAUTIONS & HOME CARE (Detailed safe over-the-counter remedies, lifestyle diet remedies).
4. NATURAL AYURVEDIC REMEDIES (Mandatory if Stage 2: recommend specific safe traditional remedies).
5. Keep the tone clinically sound. Do NOT use any double asterisks (**) for formatting.`;

        let summaryAnalysis = "";
        
        // Attempt Google Gemini Pro API first
        const geminiReply = await callGeminiAPI(turnHistoryText, systemPrompt);
        if (geminiReply) {
            summaryAnalysis = `📋 CLINICAL ASSESSMENT REPORT (${userName})\n\n` + geminiReply + datasetSnippet;
        } else {
            // Attempt HuggingFace LLM fallback
            const hfReply = await callHuggingFaceLLM(turnHistoryText, systemPrompt);
            if (hfReply) {
                summaryAnalysis = `📋 CLINICAL ASSESSMENT REPORT (${userName})\n\n` + hfReply + datasetSnippet;
            } else {
                // High-precision local database/knowledge matrix fallback
                let localPrecautions = `• ${assessmentData.homeCare}`;
                if (severityStage === 2) {
                    localPrecautions += `\n• 🌱 Ayurvedic Natural Remedy: ${activeAyurveda}`;
                }

                summaryAnalysis = `📋 CLINICAL ASSESSMENT REPORT (${userName}) [Stage ${severityStage}]\n\n` +
                    `• Primary Concern: ${session.responses[0] || 'Reported Symptom'}\n` +
                    `• Duration & Location Details: ${session.responses[1] || 'Noted'}\n` +
                    `• Associated Symptoms & Triggers: ${session.responses[2] || 'Noted'}\n\n` +
                    `🔍 CLINICAL DIFFERENTIAL DIAGNOSES:\n` +
                    `1. Primary Suspected Condition: ${assessmentData.primaryDiag}\n` +
                    `2. Secondary Differential: ${assessmentData.secondaryDiag}\n\n` +
                    `🧪 RECOMMENDED DIAGNOSTIC TESTS TO DISCUSS WITH DOCTOR:\n` +
                    `• ${assessmentData.tests}\n\n` +
                    `🛡️ CLINICAL PRECAUTIONS & HOME CARE:\n` +
                    localPrecautions +
                    datasetSnippet;

                if (severityStage === 3) {
                    summaryAnalysis += `\n\n🚨 CRITICAL WARNING: Please seek immediate professional medical attention. Consult a ${assessmentData.specialty.name} or visit the nearest ER immediately!`;
                } else if (severityStage === 2) {
                    summaryAnalysis += `\n\n👨‍⚕️ DOCTOR CONSULTATION RECOMMENDATION:\nIf symptoms do not improve or get worse after 48 hours, we recommend consulting a ${assessmentData.specialty.name} for a physical examination.`;
                } else {
                    summaryAnalysis += `\n\n😊 This looks like a mild condition that should resolve with rest. Mark the issue as resolved below!`;
                }
            }
        }

        // Append Safety Guidelines and Disclaimer
        const safetyDisclaimer = `\n\n⚖️ Disclaimer: I am an AI Family Doctor assistant, not a licensed medical physician. This analysis is for educational and triage guidance. If you are experiencing severe symptoms, consult a doctor physically or visit the nearest emergency room immediately.`;
        const medicationSafety = `\n\n💊 Medication Safety: Always check packaging for correct dosage, cross-reference with your active allergies, and consult a pharmacist or doctor before taking new medication.`;
        
        summaryAnalysis += medicationSafety + safetyDisclaimer;

        // Perform Allergy Cross-Reference Check
        const allergyConflict = scanAllergyConflicts(healthProfile.medicationsAllergies, summaryAnalysis);
        if (allergyConflict) {
            summaryAnalysis = `🚨 ALLERGY WARNING:\n${allergyConflict}\n\n` + summaryAnalysis;
        }

        const completedSession = { turn: 0, status: 'completed', responses: [] };

        // Hide doctor booking completely for Stage 1 (mild common things)
        const showBookingButton = (severityStage === 3 || severityStage === 2);

        return {
            type: 'symptom_assessment',
            urgency: severityStage === 3 ? 'HIGH' : severityStage === 2 ? 'MODERATE' : 'LOW',
            riskBadge: severityStage === 3 ? 'CRITICAL STAGE 3 EMERGENCY' : null,
            reply: summaryAnalysis,
            newInsights,
            recommendedSpecialty: assessmentData.specialty,
            bookingAction: showBookingButton,
            session: completedSession
        };
    }
}

function determineSeverityStage(messageText, turnHistoryText) {
    const t = (messageText + " " + turnHistoryText).toLowerCase();

    // STAGE 3: Critical Emergencies
    const stage3Keywords = [
        'chest pain', 'shortness of breath', 'difficulty breathing', 'choking', 'unresponsive',
        'stopped breathing', 'cardiac arrest', 'severe burn', 'seizure', 'paralysis', 'stroke',
        'heart attack', 'poisoning', 'severe bleeding', 'unconscious', 'heavily bleeding',
        'severe chest discomfort', 'radiating pain to arm', 'seene me dard', 'chatit dukhat'
    ];
    if (stage3Keywords.some(w => t.includes(w))) {
        return 3;
    }

    // STAGE 2: Moderate/Chronic Illnesses
    const stage2Keywords = [
        'fever', 'cough', 'rash', 'acne', 'allergy', 'joint pain', 'knee pain', 'back pain',
        'shoulder pain', 'stomach pain', 'vomiting', 'diarrhea', 'constipation', 'sore throat',
        'asthma', 'wheezing', 'eczema', 'taap', 'bukhar', 'khokla', 'khansi'
    ];
    if (stage2Keywords.some(w => t.includes(w))) {
        return 2;
    }

    // STAGE 1: Common / Mild Issues
    return 1;
}
