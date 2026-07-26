/**
 * doctorModel.js  — MySQL + JSON fallback, Mongoose-compatible API
 *
 * Controllers use:
 *   const newDoctor = new doctorModel(data)
 *   await newDoctor.save()
 *   doctorModel.findById(id).select('-password')
 *   doctorModel.find({}).select(['-password', '-email'])
 *   doctorModel.findOne({ email })
 *   doctorModel.findByIdAndUpdate(id, updates)
 */

import { pool, isSQL } from '../config/database.js';
import { readJson, writeJson, nextId } from './jsonHelper.js';

const FILE = 'doctors.json';

// ─── Normalise row → object ───────────────────────────────────────────────────
function rowToObj(row) {
    if (!row) return null;
    return {
        _id:          String(row.id || row._id),
        name:         row.name,
        email:        row.email,
        password:     row.password,
        image:        row.image       || '',
        speciality:   row.speciality  || '',
        degree:       row.degree      || '',
        experience:   row.experience  || '',
        about:        row.about       || '',
        available:    row.available === 1 || row.available === true,
        fees:         Number(row.fees || 0),
        slots_booked: typeof row.slots_booked === 'string'
                        ? JSON.parse(row.slots_booked || '{}')
                        : (row.slots_booked || {}),
        address:      typeof row.address === 'string'
                        ? JSON.parse(row.address || '{}')
                        : (row.address || {}),
        date:         Number(row.date || 0),
    };
}

// ─── .select() helper ─────────────────────────────────────────────────────────
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
        let sql = 'SELECT * FROM doctors';
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
        const [rows] = await conn.query('SELECT * FROM doctors WHERE id = ?', [id]);
        return rowToObj(rows[0]);
    } finally { conn.release(); }
}

async function sqlInsert(data) {
    const conn = await pool.getConnection();
    try {
        const [result] = await conn.query(
            `INSERT INTO doctors
             (name, email, password, image, speciality, degree, experience, about, available, fees, slots_booked, address, date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.name,
                data.email,
                data.password,
                data.image        || '',
                data.speciality   || '',
                data.degree       || '',
                data.experience   || '',
                data.about        || '',
                data.available !== false ? 1 : 0,
                data.fees         || 0,
                JSON.stringify(data.slots_booked || {}),
                JSON.stringify(data.address      || {}),
                data.date         || Date.now()
            ]
        );
        return { _id: String(result.insertId), ...data };
    } finally { conn.release(); }
}

async function sqlUpdate(id, updates) {
    const conn = await pool.getConnection();
    try {
        const colMap = {
            name:'name', email:'email', password:'password', image:'image',
            speciality:'speciality', degree:'degree', experience:'experience',
            about:'about', available:'available', fees:'fees',
            slots_booked:'slots_booked', address:'address', date:'date'
        };
        const fields = [];
        const vals = [];
        for (const [key, val] of Object.entries(updates)) {
            if (colMap[key] !== undefined) {
                fields.push(`${colMap[key]} = ?`);
                if (key === 'slots_booked' || key === 'address') {
                    vals.push(JSON.stringify(val));
                } else if (key === 'available') {
                    vals.push(val ? 1 : 0);
                } else {
                    vals.push(val);
                }
            }
        }
        if (!fields.length) return;
        vals.push(id);
        await conn.query(`UPDATE doctors SET ${fields.join(', ')} WHERE id = ?`, vals);
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
    const newRecord = {
        _id,
        name:         data.name,
        email:        data.email,
        password:     data.password,
        image:        data.image        || '',
        speciality:   data.speciality   || '',
        degree:       data.degree       || '',
        experience:   data.experience   || '',
        about:        data.about        || '',
        available:    data.available !== false,
        fees:         Number(data.fees  || 0),
        slots_booked: data.slots_booked || {},
        address:      data.address      || {},
        date:         data.date         || Date.now(),
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

class doctorModel {
    constructor(data) {
        this._data = data;
    }

    async save() {
        const result = isSQL()
            ? await sqlInsert(this._data)
            : jsonInsert(this._data);
        this._id = result._id;
        Object.assign(this, result);
        return this;
    }

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

export default doctorModel;