import { GoogleGenAI } from "@google/genai";
import { cloudinary } from "../config/cloudinary.js";
import fs from "fs";
import reportModel from "../models/reportModel.js";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Controller to upload image to Cloudinary
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.json({ success: false, message: "No file uploaded" });
        }
        res.json({ success: true, imageUrl: req.file.path, publicId: req.file.filename });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Controller to analyze image content using Gemini
const analyzeReport = async (req, res) => {
    try {
        const { imageUrl, title, type, date } = req.body;
        const userId = req.userId;

        if (!imageUrl) {
            return res.json({ success: false, message: "Image URL is required" });
        }

        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString("base64");

        const structuredPrompt = `
Analyze this medical report image. 

Provide a COMPREHENSIVE and EASY TO UNDERSTAND analysis.
For all text fields, provide a Bilingual response: one in English and one in Roman Urdu (Urdu written in English script).

IMPORTANT GUIDELINES:
- If information for a specific field is strictly missing from the report (like Patient Age), provide a friendly explanation like "Information not specified in this document" (EN).
- HOWEVER, for "doctor_questions", "dietary_advice", and "home_remedies", you MUST generate these yourself based on your analysis of the report findings to help the patient or their family, even if they are not explicitly written in the document.
- CRITICAL: Even if the report is an autopsy or medical examiner's report for a deceased person, DO NOT say "not applicable". Instead, provide proactive health insights (e.g., preventative measures for relatives based on the findings) or general wellness tips related to the condition mentioned.
- The summary should be BIG, easy to understand, and provide actionable context for a parent or patient.
- Ensure the tone is supportive and professional.
- ALWAYS include a friendly concluding note: "Always consult your doctor before making any decision." (EN) and "Koi bhi faisla karne se pehle hamesha apne doctor se mashwara karein." (UR).

Return ONLY valid JSON in this exact format:

{
  "summary": {
    "en": "Big and easy to understand summary in English",
    "ur": "Roman Urdu mein wazeh aur bari tafseelat"
  },
  "patient_info": {
    "age": "",
    "gender": ""
  },
  "primary_diagnosis": {
    "en": "",
    "ur": ""
  },
  "medical_conditions": [
    { "en": "", "ur": "" }
  ],
  "developmental_status": {
    "speech": { "en": "", "ur": "" },
    "gross_motor": { "en": "", "ur": "" },
    "fine_motor": { "en": "", "ur": "" },
    "social": { "en": "", "ur": "" },
    "behavior": { "en": "", "ur": "" }
  },
  "strengths": [
    { "en": "", "ur": "" }
  ],
  "recommendations": [
    { "en": "", "ur": "" }
  ],
  "doctor_questions": [
    { "en": "Question 1", "ur": "Sawal 1" }
  ],
  "dietary_advice": {
    "foods_to_avoid": [ { "en": "", "ur": "" } ],
    "foods_to_eat": [ { "en": "", "ur": "" } ]
  },
  "home_remedies": [
    { "en": "", "ur": "" }
  ]
}
`;

        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: structuredPrompt },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Data,
                            },
                        },
                    ],
                },
            ],
            config: {
                generationConfig: {
                    responseMimeType: "application/json",
                },
            },
        });

        const responseText = result.text || "";

        // Robust JSON extraction: Find the first '{' and last '}'
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("AI Response was:", responseText);
            throw new Error("AI failed to return valid JSON format");
        }

        const analysis = JSON.parse(jsonMatch[0]);

        // Save to Database
        const newReport = new reportModel({
            userId,
            title: title || "Medical Report",
            type: type || "General",
            date: date || new Date(),
            imageUrl,
            analysis
        });

        await newReport.save();

        res.json({ success: true, analysis, reportId: newReport._id });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get all reports for a user
const getUserReports = async (req, res) => {
    try {
        const userId = req.userId;
        const reports = await reportModel.find({ userId }).sort({ date: -1 });
        res.json({ success: true, reports });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get single report by ID
const getReportById = async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.userId;
        const report = await reportModel.findOne({ _id: reportId, userId });

        if (!report) {
            return res.json({ success: false, message: "Report not found or access denied" });
        }

        res.json({ success: true, report });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export { uploadImage, analyzeReport, getUserReports, getReportById };
