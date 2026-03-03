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
- DO NOT use short phrases like "N/A", "Not Applicable", or "Laagu nahi".
- If information for a specific field is missing from the report, provide a friendly explanation like "Information not specified in this document" (EN) and "Is report mein is hawale se koi maloomat faraham nahi ki gayi" (UR).
- The summary should be BIG, easy to understand, and provide actionable context for a parent or patient.
- Ensure the tone is supportive and professional.

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

        // Strip markdown backticks if present
        const cleanJson = result.text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
        const analysis = JSON.parse(cleanJson);

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
