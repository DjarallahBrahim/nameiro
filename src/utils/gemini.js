import { db } from '../firebase';
import { getDoc, doc } from 'firebase/firestore';

export const fetchApiKey = async () => {
    const settingsSnap = await getDoc(doc(db, "settings", "api_keys"));
    if (!settingsSnap.exists() || !settingsSnap.data().google_genai_key) {
        throw new Error("API Key not found!");
    }
    return settingsSnap.data();
};

export const callGeminiPrompt = async (domainName) => {
    const { google_genai_key } = await fetchApiKey();
    const TEXT_MODEL = 'gemini-2.5-pro';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${google_genai_key}`;

    const systemInstruction = `
        You are an expert AI image prompt generator.
        I will give you a domain name: "${domainName}".
        
        YOUR TASK:
        1. Analyze the domain to find the root word (e.g., 'Pay' in 'PayBip') or meaning.
        2. Write a precise image generation prompt following these rules:
           - Subject: A clean, modern design with a light/white background.
           - Centerpiece: The text "${domainName}" written clearly and centrally in the middle, using a bold, professional font.
           - Iconography: Add a simple, minimal icon related to the root word (e.g., if 'Pay', use a wallet/card icon). If the domain is abstract/brandable, use an abstract modern shape.
           - Style: Brandable, easy to use on a landing page, high quality.
           
        OUTPUT:
        Return ONLY the prompt text. Do not include "Here is the prompt" or quotes.
    `;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemInstruction }] }] })
    });

    const data = await response.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim();
    } else {
        throw new Error("Gemini returned invalid response.");
    }
};

export const callGeminiImage = async (prompt) => {
    const { google_genai_key, model_name } = await fetchApiKey();
    const MODEL = model_name || 'gemini-2.5-flash-image';
    let endpoint, body;

    if (MODEL.toLowerCase().includes('gemini')) {
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${google_genai_key}`;
        body = { contents: [{ parts: [{ text: prompt }] }] };
    } else {
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict?key=${google_genai_key}`;
        body = { instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio: "1:1" } };
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    let base64Image = null;
    if (data.predictions?.[0]?.bytesBase64Encoded) {
        base64Image = data.predictions[0].bytesBase64Encoded;
    } else if (data.candidates?.[0]?.content?.parts) {
        const parts = data.candidates[0].content.parts;
        const imagePart = parts.find(p => p.inline_data || p.inlineData);
        if (imagePart) base64Image = (imagePart.inline_data || imagePart.inlineData).data;
    } else if (data.predictions?.[0]?.bytes) {
        base64Image = data.predictions[0].bytes;
    }

    if (!base64Image) throw new Error("No image data found in response.");
    return `data:image/png;base64,${base64Image}`;
};
