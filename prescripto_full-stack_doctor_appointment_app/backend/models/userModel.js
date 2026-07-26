/**
 * userModel.js  — MySQL + JSON fallback, Mongoose-compatible API
 *
 * Controllers use:
 *   const newUser = new userModel(data)
 *   const user = await newUser.save()        → user._id
 *   userModel.findById(id)                   → supports .select('-password')
 *   userModel.findOne({ email })
 *   userModel.find({})
 *   userModel.findByIdAndUpdate(id, updates)
 */

import { pool, isSQL } from '../config/database.js';
import { readJson, writeJson, nextId } from './jsonHelper.js';

const FILE = 'users.json';

const DEFAULT_USER_IMAGE =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAB3RJTUUH6AcXEjQXRMNrCQAAAAxpVFh0Q29tbWVudAAAAAAAvK6ymQAAABF0RVh0U29mdHdhcmUAU25pcGFzdGUuTmV0V29sZqUAAAAldEVYdENyZWF0aW9uIFRpbWUAMjAyNC0wNy0yM1QxMjoxMjoxMFoK6G0+AAAFxklEQVR4nO3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBuAABHgAAAABJRU5ErkJggg==';

// ─── Normalise a row → plain object with string _id ───────────────────────────
function rowToObj(row) {
    if (!row) return null;
    const now = Date.now();
    return {
        _id:      String(row.id || row._id),
        name:     row.name,
        email:    row.email,
        password: row.password,
        image:    row.image    || DEFAULT_USER_IMAGE,
        phone:    row.phone    || '000000000',
        address:  typeof row.address === 'string'
                    ? JSON.parse(row.address || '{"line1":"","line2":""}')
                    : (row.address || { line1: '', line2: '' }),
        gender:   row.gender   || 'Not Selected',
        dob:      row.dob      || 'Not Selected',
        role:     row.role     || 'patient',
        hasCompletedOnboarding: row.hasCompletedOnboarding !== undefined ? Boolean(row.hasCompletedOnboarding) : false,
        healthProfile: typeof row.healthProfile === 'string'
                    ? JSON.parse(row.healthProfile || '{}')
                    : (row.healthProfile || {}),
        familyMembers: typeof row.familyMembers === 'string'
                    ? JSON.parse(row.familyMembers || '[]')
                    : (row.familyMembers || []),
        subscription: typeof row.subscription === 'string'
                    ? JSON.parse(row.subscription || '{}')
                    : (row.subscription || {
                        plan: 'patient_100',
                        status: 'trial',
                        trialStartDate: now,
                        trialEndDate: now + 7 * 24 * 60 * 60 * 1000,
                        price: 100
                    }),
        emergencyCard: typeof row.emergencyCard === 'string'
                    ? JSON.parse(row.emergencyCard || '{}')
                    : (row.emergencyCard || {}),
        vitalsLog: typeof row.vitalsLog === 'string'
                    ? JSON.parse(row.vitalsLog || '[]')
                    : (row.vitalsLog || []),
        vaccineSchedules: typeof row.vaccineSchedules === 'string'
                    ? JSON.parse(row.vaccineSchedules || '[]')
                    : (row.vaccineSchedules || []),
        scannedMedicines: typeof row.scannedMedicines === 'string'
                    ? JSON.parse(row.scannedMedicines || '[]')
                    : (row.scannedMedicines || []),
        aiChatHistory: typeof row.aiChatHistory === 'string'
                    ? JSON.parse(row.aiChatHistory || '[]')
                    : (row.aiChatHistory || [])
    };
}

// ─── .select() chaining helper ────────────────────────────────────────────────
function withSelect(promise) {
    promise.select = function(fields) {
        const toOmit = (Array.isArray(fields) ? fields : [fields])
            .join(' ')
            .split(/\s+/)
            .filter(f => f.startsWith('-'))
            .map(f => f.slice(1));

        return promise.then(result => {
            if (!result) return null;
            const strip = obj => {
                if (!obj) return null;
                const r = { ...obj };
                toOmit.forEach(k => delete r[k]);
                return r;
            };
            return Array.isArray(result) ? result.map(strip) : strip(result);
        });
    };
    return promise;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MySQL implementations
// ═══════════════════════════════════════════════════════════════════════════════

async function sqlFind(filter = {}) {
    const conn = await pool.getConnection();
    try {
        const keys = Object.keys(filter);
        let sql = 'SELECT * FROM users';
        const vals = [];
        if (keys.length) {
            sql += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
            vals.push(...Object.values(filter));
        }
        const [rows] = await conn.query(sql, vals);
        return rows.map(rowToObj);
    } finally { conn.release(); }
}

async function sqlFindById(id) {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
        return rowToObj(rows[0]);
    } finally { conn.release(); }
}

async function sqlInsert(data) {
    const conn = await pool.getConnection();
    try {
        const [result] = await conn.query(
            `INSERT INTO users (name, email, password, image, phone, address, gender, dob, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.name,
                data.email,
                data.password,
                data.image   || DEFAULT_USER_IMAGE,
                data.phone   || '000000000',
                JSON.stringify(data.address || { line1: '', line2: '' }),
                data.gender  || 'Not Selected',
                data.dob     || 'Not Selected',
                Date.now()
            ]
        );
        return { _id: String(result.insertId), ...data };
    } finally { conn.release(); }
}

async function sqlUpdate(id, updates) {
    const conn = await pool.getConnection();
    try {
        const colMap = { name:'name', email:'email', password:'password',
                         image:'image', phone:'phone', address:'address',
                         gender:'gender', dob:'dob' };
        const fields = [];
        const vals = [];
        for (const [key, val] of Object.entries(updates)) {
            if (colMap[key] !== undefined) {
                fields.push(`${colMap[key]} = ?`);
                vals.push(typeof val === 'object' ? JSON.stringify(val) : val);
            }
        }
        if (!fields.length) return;
        vals.push(id);
        await conn.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, vals);
    } finally { conn.release(); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JSON fallback implementations
// ═══════════════════════════════════════════════════════════════════════════════

function jsonFind(filter = {}) {
    const records = readJson(FILE);
    if (!Object.keys(filter).length) return records;
    return records.filter(r => Object.entries(filter).every(([k, v]) => r[k] === v));
}

function jsonFindById(id) {
    return readJson(FILE).find(r => String(r._id) === String(id)) || null;
}

function jsonInsert(data) {
    const records = readJson(FILE);
    const _id = String(nextId(records));
    const now = Date.now();
    const newRecord = {
        _id,
        name:    data.name,
        email:   data.email,
        password: data.password,
        image:   data.image   || DEFAULT_USER_IMAGE,
        phone:   data.phone   || '000000000',
        address: data.address || { line1: '', line2: '' },
        gender:  data.gender  || 'Not Selected',
        dob:     data.dob     || 'Not Selected',
        role:    data.role    || 'patient',
        hasCompletedOnboarding: false,
        healthProfile: data.healthProfile || {},
        familyMembers: data.familyMembers || [],
        subscription: data.subscription || {
            plan: 'patient_100',
            status: 'trial',
            trialStartDate: now,
            trialEndDate: now + 7 * 24 * 60 * 60 * 1000,
            price: 100
        },
        emergencyCard: data.emergencyCard || {},
        vitalsLog: data.vitalsLog || [],
        vaccineSchedules: data.vaccineSchedules || [],
        scannedMedicines: data.scannedMedicines || [],
        aiChatHistory: data.aiChatHistory || []
    };
    records.push(newRecord);
    writeJson(FILE, records);
    return newRecord;
}

function jsonUpdate(id, updates) {
    const records = readJson(FILE);
    const idx = records.findIndex(r => String(r._id) === String(id));
    if (idx === -1) return;
    records[idx] = { ...records[idx], ...updates };
    writeJson(FILE, records);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Model Class — mirrors Mongoose Model API
// ═══════════════════════════════════════════════════════════════════════════════

class userModel {
    constructor(data) {
        this._data = data;
    }

    async save() {
        const result = isSQL()
            ? await sqlInsert(this._data)
            : jsonInsert(this._data);
        // Expose _id directly on instance so controllers can do `user._id`
        this._id = result._id;
        Object.assign(this, result);
        return this;
    }

    // ── Static methods ─────────────────────────────────────────────────────────

    static find(filter = {}) {
        return withSelect(
            isSQL() ? sqlFind(filter) : Promise.resolve(jsonFind(filter))
        );
    }

    static findById(id) {
        if (!id) return withSelect(Promise.resolve(null));
        return withSelect(
            isSQL() ? sqlFindById(id) : Promise.resolve(jsonFindById(id))
        );
    }

    static async findOne(filter) {
        const results = isSQL() ? await sqlFind(filter) : jsonFind(filter);
        return results[0] || null;
    }

    static async findByIdAndUpdate(id, updates) {
        if (isSQL()) await sqlUpdate(id, updates);
        else jsonUpdate(id, updates);
    }
}

export default userModel;