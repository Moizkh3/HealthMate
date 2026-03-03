import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function list() {
    try {
        const models = await genAI.models.list();
        console.log("Available models:", JSON.stringify(models, null, 2));
    } catch (e) {
        console.error("List models failed:", e);
    }
}
list();
