import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const REPORT_CONTENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    schoolAddressee: { type: Type.STRING },
    reportTitle: { type: Type.STRING },
    reportSubtitle: { type: Type.STRING },
    childName: { type: Type.STRING },
    birthDate: { type: Type.STRING },
    age: { type: Type.STRING },
    diagnosis: { type: Type.STRING },
    backgroundParagraph1: { type: Type.STRING },
    backgroundParagraph2: { type: Type.STRING },
    envIntro: { type: Type.STRING },
    envPositive: { type: Type.STRING },
    envNegativeIntro: { type: Type.STRING },
    envNegativePoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    homeSchoolIntro: { type: Type.STRING },
    homeSchoolBenefits: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    recommendationsIntro: { type: Type.STRING },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    opinionParagraph1: { type: Type.STRING },
    opinionParagraph2: { type: Type.STRING },
    opinionParagraph3: { type: Type.STRING },
    coreGoalQuote: { type: Type.STRING },
    closingSalutation: { type: Type.STRING },
    centerName: { type: Type.STRING },
    centerCity: { type: Type.STRING },
    directorName: { type: Type.STRING },
    directorRole: { type: Type.STRING },
    preparedBy: { type: Type.STRING },
    professionalTitle: { type: Type.STRING },
    signCenterName: { type: Type.STRING },
  },
  required: [
    'schoolAddressee',
    'reportTitle',
    'reportSubtitle',
    'childName',
    'birthDate',
    'age',
    'diagnosis',
    'backgroundParagraph1',
    'backgroundParagraph2',
    'envIntro',
    'envPositive',
    'envNegativeIntro',
    'envNegativePoints',
    'homeSchoolIntro',
    'homeSchoolBenefits',
    'recommendationsIntro',
    'recommendations',
    'opinionParagraph1',
    'opinionParagraph2',
    'opinionParagraph3',
    'coreGoalQuote',
    'closingSalutation',
    'centerName',
    'centerCity',
    'directorName',
    'directorRole',
    'preparedBy',
    'professionalTitle',
    'signCenterName',
  ],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/report/from-complaint', async (req, res) => {
    try {
      const {
        complaintText,
        childName,
        birthDate,
        age,
        targetPurpose,
        language = 'ar',
      } = req.body ?? {};

      if (!complaintText || typeof complaintText !== 'string' || !complaintText.trim()) {
        return res.status(400).json({ error: 'يرجى كتابة نص الشكوى أو الملاحظات السلوكية أولاً.' });
      }

      const ai = getAiClient();
      const targetLangLabel = language === 'en' ? 'formal clinical-educational English' : 'formal institutional Arabic';

      const prompt = `
You are an expert educational psychologist and technical director at "المركز الشامل لرعاية الطفل بدمنهور" (Comprehensive Child Care Center - Damanhour).
Convert the following parent/teacher complaint or case notes into a complete, structured, empathetic, official educational report addressed to a school.

Complaint / Case Notes:
"""
${complaintText.trim()}
"""

Optional Metadata Provided:
- Child Name: ${childName || 'Extract from complaint or use appropriate label'}
- Birth Date: ${birthDate || 'Extract from complaint or "غير محدد"'}
- Age: ${age || 'Extract from complaint or "غير محدد"'}
- Report Purpose / Requested Arrangement: ${targetPurpose || 'دعم الاحتياجات التعليمية والبيئية للطفل'}
- Output Language: ${targetLangLabel}

Requirements:
1. Write all fields strictly in ${targetLangLabel}.
2. Keep professional, non-judgmental, supportive educational-clinical phrasing suitable for a school principal and educational committee.
3. Provide 4 to 5 concise items in envNegativePoints.
4. Provide 5 to 7 clear items in homeSchoolBenefits (focusing on structured learning environment benefits or tailored support arrangements matching the target purpose).
5. Provide 8 to 10 practical items in recommendations.
6. Set centerName, centerCity, directorName, directorRole, preparedBy, professionalTitle, signCenterName appropriately in ${language === 'en' ? 'English (Comprehensive Child Care Center, Damanhour, Osama El-Samad, Technical Director)' : 'Arabic (المركز الشامل لرعاية الطفل، دمنهور، أسامة الصماد، مدير فني المركز، أ/ أسامة الصماد، مدير فني المركز، المركز الشامل لرعاية الطفل بدمنهور)'}.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Produce clean, formal, compassionate clinical-educational documentation formatted strictly according to the JSON schema.',
          responseMimeType: 'application/json',
          responseSchema: REPORT_CONTENT_SCHEMA,
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      return res.json({ report: parsed });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate report from complaint';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/report/translate', async (req, res) => {
    try {
      const { report, targetLang = 'en' } = req.body ?? {};
      if (!report || typeof report !== 'object') {
        return res.status(400).json({ error: 'Report payload is required for translation.' });
      }

      const ai = getAiClient();
      const directionPrompt =
        targetLang === 'en'
          ? 'Translate all text fields accurately from Arabic into formal, authoritative clinical-educational English suitable for an international or bilingual school administration. Keep proper nouns (like Adnan A HEMIDA), dates, and reference numbers intact. Translate "المركز الشامل لرعاية الطفل" as "Comprehensive Child Care Center", "دمنهور" as "Damanhour", "أسامة الصماد" as "Osama El-Samad", and "مدير فني المركز" as "Technical Director of the Center".'
          : 'Translate all text fields accurately from English into formal institutional Arabic suitable for an Egyptian school administration. Keep proper nouns, dates, and reference numbers intact.';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `${directionPrompt}\n\nSource JSON:\n${JSON.stringify(report)}`,
        config: {
          systemInstruction:
            'Return ONLY valid JSON matching the schema with faithful, complete translation of every array item and paragraph.',
          responseMimeType: 'application/json',
          responseSchema: REPORT_CONTENT_SCHEMA,
        },
      });

      const raw = (response.text ?? '{}').trim();
      const translated = JSON.parse(raw);
      return res.json({ report: translated });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to translate report';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/report/shortcut', async (req, res) => {
    try {
      const { report, mode = 'executive', language = 'ar' } = req.body ?? {};
      if (!report || typeof report !== 'object') {
        return res.status(400).json({ error: 'Report payload is required.' });
      }

      const ai = getAiClient();
      const langDesc = language === 'en' ? 'English' : 'Arabic';
      let modeInstruction = '';
      if (mode === 'executive') {
        modeInstruction =
          'Condense the report into a crisp, high-impact 1-page executive version keeping every essential clinical/educational point, shortening verbose sentences while preserving 4 key envNegativePoints, 5 homeSchoolBenefits, and 6 top recommendations.';
      } else if (mode === 'parent-brief') {
        modeInstruction =
          'Reframe the tone into a warm, encouraging, actionable guide addressed to the child’s parents/guardians while preserving all factual data and key recommendations.';
      } else {
        modeInstruction =
          'Reframe the report as a formal concise official school memorandum requesting immediate classroom & testing accommodations.';
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Language: ${langDesc}\nTask: ${modeInstruction}\n\nSource Report JSON:\n${JSON.stringify(report)}`,
        config: {
          systemInstruction:
            'Return valid JSON matching the exact schema without omitting required keys.',
          responseMimeType: 'application/json',
          responseSchema: REPORT_CONTENT_SCHEMA,
        },
      });

      const raw = (response.text ?? '{}').trim();
      const updated = JSON.parse(raw);
      return res.json({ report: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply smart shortcut';
      return res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
