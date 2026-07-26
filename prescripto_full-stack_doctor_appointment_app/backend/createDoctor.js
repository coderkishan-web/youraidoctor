/**
 * createDoctor.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Script to create a doctor account via the command line.
 * Works with both MySQL and JSON file fallback (same as the main app).
 *
 * Usage:
 *   node createDoctor.js
 *
 * Edit the doctorData object below before running to set your own values.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import bcrypt from "bcrypt";
import 'dotenv/config';
import { connectDB } from "./config/database.js";
import doctorModel from "./models/doctorModel.js";

const createDoctor = async () => {
    try {
        // Connect to DB (MySQL or JSON fallback — same as server.js)
        await connectDB();
        console.log("✅ Database ready\n");

        // ── Edit these values ────────────────────────────────────────────────
        const doctorData = {
            name:       "Dr. Richard James",
            email:      "richard@prescripto.com",
            password:   "Doctor@123",           // plain text — will be hashed below
            image:      "https://via.placeholder.com/150",
            speciality: "General Physician",
            degree:     "MBBS",
            experience: "4 Years",
            about:      "A dedicated physician with 4 years of clinical experience.",
            fees:       50,
            address:    { line1: "17th Cross, Richmond", line2: "Circle, Ring Road, London" },
            available:  true,
            date:       Date.now()
        };
        // ────────────────────────────────────────────────────────────────────

        // Hash password
        const salt = await bcrypt.genSalt(10);
        doctorData.password = await bcrypt.hash(doctorData.password, salt);

        // Check if doctor already exists
        const existingDoctor = await doctorModel.findOne({ email: doctorData.email });

        if (existingDoctor) {
            // Update password only
            await doctorModel.findByIdAndUpdate(existingDoctor._id, {
                password: doctorData.password
            });
            console.log(`🔄 Doctor already exists — password updated.`);
            console.log(`   Email: ${doctorData.email}`);
        } else {
            const newDoctor = new doctorModel(doctorData);
            await newDoctor.save();
            console.log(`✅ Doctor created successfully!`);
            console.log(`   Name:  ${doctorData.name}`);
            console.log(`   Email: ${doctorData.email}`);
        }

    } catch (error) {
        console.error("❌ Error creating doctor:", error.message);
    } finally {
        process.exit(0);
    }
};

createDoctor();
