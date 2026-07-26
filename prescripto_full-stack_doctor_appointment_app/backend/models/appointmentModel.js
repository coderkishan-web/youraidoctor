/**
 * appointmentModel.js  — MySQL + JSON fallback, Mongoose-compatible API
 *
 * Controllers use:
 *   const newAppointment = new appointmentModel(data)
 *   await newAppointment.save()
 *   appointmentModel.findById(id)
 *   appointmentModel.find({ userId }) / find({ docId }) / find({})
 *   appointmentModel.findByIdAndUpdate(id, updates)
 */

import { pool, isSQL } from '../config/database.js';
import { readJson, writeJson, nextId } from './jsonHelper.js';

const FILE = 'appointments.json';

// ─── Normalise row → object ───────────────────────────────────────────────────
function rowToObj(row) {
    if (!row) return null;
    return {
        _id:         String(row.id || row._id),
        userId:      row.userId,
        docId:       row.docId,
        slotDate:    row.slotDate,
        slotTime:    row.slotTime,
        userData:    typeof row.userData === 'string' ? JSON.parse(row.userData || '{}') : (row.userData || {}),
        docData:     typeof row.docData  === 'string' ? JSON.parse(row.docData  || '{}') : (row.docData  || {}),
        amount:      Number(row.amount   || 0),
        date:        Number(row.date     || 0),
        cancelled:   row.cancelled   === 1 || row.cancelled   === true,
        payment:     row.payment     === 1 || row.payment     === true,
        isCompleted: row.isCompleted === 1 || row.isCompleted === true,
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MySQL implementations
// ═══════════════════════════════════════════════════════════════════════════════

async function sqlFind(filter = {}) {
    const conn = await pool.getConnection();
    try {
        const keys = Object.keys(filter);
        let sql = 'SELECT * FROM appointments';
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
        const [rows] = await conn.query('SELECT * FROM appointments WHERE id = ?', [id]);
        return rowToObj(rows[0]);
    } finally { conn.release(); }
}

async function sqlInsert(data) {
    const conn = await pool.getConnection();
    try {
        const [result] = await conn.query(
            `INSERT INTO appointments
             (userId, docId, slotDate, slotTime, userData, docData, amount, date, cancelled, payment, isCompleted)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.userId,
                data.docId,
                data.slotDate,
                data.slotTime,
                JSON.stringify(data.userData || {}),
                JSON.stringify(data.docData  || {}),
                data.amount      || 0,
                data.date        || Date.now(),
                data.cancelled   ? 1 : 0,
                data.payment     ? 1 : 0,
                data.isCompleted ? 1 : 0,
            ]
        );
        return { _id: String(result.insertId), ...data };
    } finally { conn.release(); }
}

async function sqlUpdate(id, updates) {
    const conn = await pool.getConnection();
    try {
        const colMap = {
            cancelled:'cancelled', payment:'payment', isCompleted:'isCompleted',
            userId:'userId', docId:'docId', slotDate:'slotDate', slotTime:'slotTime',
            userData:'userData', docData:'docData', amount:'amount', date:'date'
        };
        const fields = [];
        const vals = [];
        for (const [key, val] of Object.entries(updates)) {
            if (colMap[key] !== undefined) {
                fields.push(`${colMap[key]} = ?`);
                if (key === 'userData' || key === 'docData') {
                    vals.push(JSON.stringify(val));
                } else if (['cancelled', 'payment', 'isCompleted'].includes(key)) {
                    vals.push(val ? 1 : 0);
                } else {
                    vals.push(val);
                }
            }
        }
        if (!fields.length) return;
        vals.push(id);
        await conn.query(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`, vals);
    } finally { conn.release(); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JSON fallback implementations
// ═══════════════════════════════════════════════════════════════════════════════

function jsonFind(filter = {}) {
    const records = readJson(FILE);
    if (!Object.keys(filter).length) return records;
    return records.filter(r =>
        Object.entries(filter).every(([k, v]) => String(r[k]) === String(v))
    );
}

function jsonFindById(id) {
    return readJson(FILE).find(r => String(r._id) === String(id)) || null;
}

function jsonInsert(data) {
    const records = readJson(FILE);
    const _id = String(nextId(records));
    const newRecord = {
        _id,
        userId:      data.userId,
        docId:       data.docId,
        slotDate:    data.slotDate,
        slotTime:    data.slotTime,
        userData:    data.userData    || {},
        docData:     data.docData     || {},
        amount:      Number(data.amount || 0),
        date:        data.date         || Date.now(),
        cancelled:   data.cancelled    || false,
        payment:     data.payment      || false,
        isCompleted: data.isCompleted  || false,
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

class appointmentModel {
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

    static async find(filter = {}) {
        return isSQL() ? sqlFind(filter) : jsonFind(filter);
    }

    static async findById(id) {
        if (!id) return null;
        return isSQL() ? sqlFindById(id) : jsonFindById(id);
    }

    static async findByIdAndUpdate(id, updates) {
        if (isSQL()) await sqlUpdate(id, updates);
        else jsonUpdate(id, updates);
    }
}

export default appointmentModel;