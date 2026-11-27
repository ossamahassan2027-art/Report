import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
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
  app.use(express.json({ limit: '15mb' }));

  const DOCX_MIME =
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const ALLOWED_CV_MIME_TYPES = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'text/plain',
    DOCX_MIME,
  ]);

  const CV_EXTRACTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      fullName: { type: Type.STRING },
      targetJobTitle: { type: Type.STRING },
      phone: { type: Type.STRING },
      email: { type: Type.STRING },
      location: { type: Type.STRING },
      websiteOrLink: { type: Type.STRING },
      summary: { type: Type.STRING },
      experiences: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            jobTitle: { type: Type.STRING },
            company: { type: Type.STRING },
            location: { type: Type.STRING },
            dateRange: { type: Type.STRING },
            bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['jobTitle', 'company', 'location', 'dateRange', 'bullets'],
        },
      },
      education: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            degree: { type: Type.STRING },
            institution: { type: Type.STRING },
            dateRange: { type: Type.STRING },
            details: { type: Type.STRING },
          },
          required: ['degree', 'institution', 'dateRange', 'details'],
        },
      },
      skills: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            level: { type: Type.STRING },
          },
          required: ['name', 'level'],
        },
      },
      certifications: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            issuer: { type: Type.STRING },
            date: { type: Type.STRING },
          },
          required: ['name', 'issuer', 'date'],
        },
      },
      languages: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            proficiency: { type: Type.STRING },
          },
          required: ['name', 'proficiency'],
        },
      },
      trainings: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            provider: { type: Type.STRING },
            dateRange: { type: Type.STRING },
          },
          required: ['title', 'provider', 'dateRange'],
        },
      },
    },
    required: [
      'fullName',
      'targetJobTitle',
      'phone',
      'email',
      'location',
      'websiteOrLink',
      'summary',
      'experiences',
      'education',
      'skills',
      'certifications',
      'languages',
      'trainings',
    ],
  };

  const CERTIFICATE_EXTRACTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      docType: { type: Type.STRING },
      title: { type: Type.STRING },
      issuer: { type: Type.STRING },
      year: { type: Type.STRING },
      keywordSkill: { type: Type.STRING },
    },
    required: ['docType', 'title', 'issuer', 'year', 'keywordSkill'],
  };

  app.post('/api/cv/extract-cv', async (req, res) => {
    try {
      const { mimeType, base64Data, plainText, targetLanguage = 'ar' } = req.body ?? {};

      const hasText = typeof plainText === 'string' && plainText.trim().length > 0;
      const hasBinary = typeof base64Data === 'string' && base64Data.trim().length > 0;

      if (!hasText && !hasBinary) {
        return res.status(400).json({ error: 'يرجى إرفاق ملف السيرة الذاتية أو نص واضح للاستخراج.' });
      }

      if (hasBinary) {
        if (typeof mimeType !== 'string' || !ALLOWED_CV_MIME_TYPES.has(mimeType)) {
          return res.status(400).json({ error: 'صيغة الملف غير مدعومة. الصيغ المدعومة: PDF، Word، صور، أو نص.' });
        }
        // Reject oversized base64 payloads (~10MB binary max)
        if (base64Data.length > 14 * 1024 * 1024) {
          return res.status(400).json({ error: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت.' });
        }
      }

      const ai = getAiClient();
      const langLabel = targetLanguage === 'en' ? 'English' : 'Arabic';
      const instructionPrompt = `
Extract structured CV fields from the attached document in ${langLabel} (keep proper names, emails, URLs, and dates accurate).
STRICT ANTI-HALLUCINATION RULES:
1. Extract ONLY facts explicitly stated in the provided CV. NEVER invent, guess, or fabricate missing details.
2. If any scalar field (fullName, targetJobTitle, phone, email, location, websiteOrLink, summary) is missing or unreadable, set it strictly to "[ ... ]".
3. Normalize dates where clear to "MM/YYYY - MM/YYYY" or "MM/YYYY - ${targetLanguage === 'en' ? 'Present' : 'حتى الآن'}" (or "MM/YYYY" for single dates). If unclear, use "[ ... ]".
4. Keep skills concise (name + level like "${targetLanguage === 'en' ? 'Intermediate' : 'متوسط'}" or "" if level is not stated).
5. Return valid JSON matching the exact schema.
`;

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      let extractedDocxText = '';
      if (hasBinary && mimeType === DOCX_MIME) {
        const buffer = Buffer.from(base64Data.trim(), 'base64');
        const docxResult = await mammoth.extractRawText({ buffer });
        extractedDocxText = (docxResult.value || '').trim();
        if (!extractedDocxText) {
          return res.status(400).json({ error: 'لم يتم العثور على نص مقروء داخل ملف Word (.docx).' });
        }
      } else if (hasBinary) {
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data.trim(),
          },
        });
      }

      const combinedText = [plainText || '', extractedDocxText].filter(Boolean).join('\n').trim();
      if (combinedText) {
        parts.push({
          text: `${instructionPrompt}\n\nCV Text Content:\n"""\n${combinedText.slice(0, 60000)}\n"""`,
        });
      } else {
        parts.push({ text: instructionPrompt });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'You are a high-precision CV parser for ATS compliance. Extract strictly what is present in the source document; never fabricate values and use "[ ... ]" for missing text.',
          responseMimeType: 'application/json',
          responseSchema: CV_EXTRACTION_SCHEMA,
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      return res.json({ cv: parsed });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر استخراج بيانات السيرة الذاتية.';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/cv/extract-certificate', async (req, res) => {
    try {
      const { mimeType, base64Data, plainText, targetLanguage = 'ar' } = req.body ?? {};
      const hasText = typeof plainText === 'string' && plainText.trim().length > 0;
      const hasBinary = typeof base64Data === 'string' && base64Data.trim().length > 0;

      if (!hasText && !hasBinary) {
        return res.status(400).json({ error: 'يرجى إرفاق ملف الشهادة أو الوثيقة أولاً.' });
      }

      if (hasBinary) {
        if (typeof mimeType !== 'string' || !ALLOWED_CV_MIME_TYPES.has(mimeType)) {
          return res.status(400).json({ error: 'صيغة الوثيقة غير مدعومة.' });
        }
        if (base64Data.length > 14 * 1024 * 1024) {
          return res.status(400).json({ error: 'حجم الملف يتجاوز الحد الأقصى (10 ميجابايت).' });
        }
      }

      const ai = getAiClient();
      const isEn = targetLanguage === 'en';
      const prompt = `
Analyze this certificate, training course document, or experience letter and extract ONLY concise ATS-ready keywords/metadata. NEVER copy the full certificate paragraph text.
Output language: ${isEn ? 'English' : 'Arabic'}.
Fields required:
- docType: must be one of ${isEn ? '"Certificate", "Training", "Experience Letter"' : '"شهادة", "دورة", "خطاب خبرة"'}.
- title: concise official name of the certificate, course, or job title in the letter (max 10 words). Use "[ ... ]" if unclear.
- issuer: issuing organization/academy/company name. Use "[ ... ]" if unclear.
- year: date or year in "MM/YYYY" or "YYYY" format. Use "[ ... ]" if unclear.
- keywordSkill: 1 concise keyword or short skill phrase (2-4 words max) representing the core skill acquired. Use "[ ... ]" if unclear.
NEVER invent missing data.
`;

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      let extractedDocxText = '';
      if (hasBinary && mimeType === DOCX_MIME) {
        const buffer = Buffer.from(base64Data.trim(), 'base64');
        const docxResult = await mammoth.extractRawText({ buffer });
        extractedDocxText = (docxResult.value || '').trim();
        if (!extractedDocxText) {
          return res.status(400).json({ error: 'لم يتم العثور على نص مقروء داخل ملف Word (.docx).' });
        }
      } else if (hasBinary) {
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data.trim(),
          },
        });
      }

      const combinedText = [plainText || '', extractedDocxText].filter(Boolean).join('\n').trim();
      if (combinedText) {
        parts.push({ text: `${prompt}\n\nDocument Text:\n"""\n${combinedText.slice(0, 25000)}\n"""` });
      } else {
        parts.push({ text: prompt });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'Extract concise certificate/document metadata and 1 short keyword skill only. Never copy full body text and never hallucinate.',
          responseMimeType: 'application/json',
          responseSchema: CERTIFICATE_EXTRACTION_SCHEMA,
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      return res.json({ certificate: parsed });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر قراءة بيانات الشهادة.';
      return res.status(500).json({ error: message });
    }
  });

  const JOB_AD_EXTRACTION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      jobTitle: { type: Type.STRING },
      organization: { type: Type.STRING },
      sector: { type: Type.STRING },
      cleanedText: { type: Type.STRING },
      keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['jobTitle', 'organization', 'sector', 'cleanedText', 'keywords'],
  };

  app.post('/api/cv/extract-job-ad', async (req, res) => {
    try {
      const { mimeType, base64Data, plainText, targetLanguage = 'ar' } = req.body ?? {};
      const hasText = typeof plainText === 'string' && plainText.trim().length > 0;
      const hasBinary = typeof base64Data === 'string' && base64Data.trim().length > 0;

      if (!hasText && !hasBinary) {
        return res.status(400).json({ error: 'يرجى إرفاق ملف إعلان الوظيفة أو لصق نصه أولاً.' });
      }

      if (hasBinary) {
        if (typeof mimeType !== 'string' || !ALLOWED_CV_MIME_TYPES.has(mimeType)) {
          return res.status(400).json({ error: 'صيغة ملف إعلان الوظيفة غير مدعومة.' });
        }
        if (base64Data.length > 14 * 1024 * 1024) {
          return res.status(400).json({ error: 'حجم الملف يتجاوز الحد الأقصى (10 ميجابايت).' });
        }
      }

      const ai = getAiClient();
      const isEn = targetLanguage === 'en';
      const prompt = `
Extract structured information from this job advertisement in ${isEn ? 'English' : 'Arabic'}.
STRICT RULES:
1. Extract ONLY facts explicitly stated in the job advertisement. NEVER invent requirements.
2. jobTitle: the advertised job title, or "[ ... ]" if missing.
3. organization: hiring organization/entity name, or "[ ... ]" if missing.
4. sector: industry/field of the role, or "[ ... ]" if unclear.
5. cleanedText: clean, plain-text summary of the job description & requirements suitable for ATS matching.
6. keywords: concise list of up to 16 explicit required skills/tools/competencies mentioned in the ad.
`;

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      let extractedDocxText = '';
      if (hasBinary && mimeType === DOCX_MIME) {
        const buffer = Buffer.from(base64Data.trim(), 'base64');
        const docxResult = await mammoth.extractRawText({ buffer });
        extractedDocxText = (docxResult.value || '').trim();
        if (!extractedDocxText) {
          return res.status(400).json({ error: 'لم يتم العثور على نص مقروء داخل ملف Word (.docx).' });
        }
      } else if (hasBinary) {
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data.trim(),
          },
        });
      }

      const combinedText = [plainText || '', extractedDocxText].filter(Boolean).join('\n').trim();
      if (combinedText) {
        parts.push({ text: `${prompt}\n\nJob Advertisement Text:\n"""\n${combinedText.slice(0, 30000)}\n"""` });
      } else {
        parts.push({ text: prompt });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'Extract strictly stated job advertisement details and ATS keywords only. Never fabricate requirements.',
          responseMimeType: 'application/json',
          responseSchema: JOB_AD_EXTRACTION_SCHEMA,
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      return res.json({ jobAd: parsed });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر قراءة إعلان الوظيفة.';
      return res.status(500).json({ error: message });
    }
  });

  const CV_TAILOR_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      targetJobTitle: { type: Type.STRING },
      summary: { type: Type.STRING },
    },
    required: ['targetJobTitle', 'summary'],
  };

  app.post('/api/cv/tailor', async (req, res) => {
    try {
      const {
        cv,
        targetOrganization = '',
        targetSector = '',
        experienceLevel = '',
        jobDescriptionText = '',
        language = 'ar',
      } = req.body ?? {};

      if (!cv || typeof cv !== 'object') {
        return res.status(400).json({ error: 'بيانات السيرة الذاتية مطلوبة للتخصيص.' });
      }

      const ai = getAiClient();
      const isEn = language === 'en';
      const prompt = `
Tailor ONLY the Professional Summary and targetJobTitle phrasing of this CV in ${isEn ? 'English' : 'Arabic'} for ATS alignment.
Target Context:
- Target Organization / Entity Type: ${String(targetOrganization || 'Not specified')}
- Target Sector / Field: ${String(targetSector || 'Not specified')}
- Experience Level: ${String(experienceLevel || 'Not specified')}
- Optional Job Advertisement Context: ${String(jobDescriptionText || '').slice(0, 4000)}

STRICT ANTI-HALLUCINATION RULES:
1. Base the tailored summary STRICTLY on the candidate's real experiences, education, skills, and certifications provided in the JSON below.
2. NEVER invent fake skills, fake employers, fake degrees, or fake years of experience.
3. Keep ATS plain-text style: crisp 3-4 lines, zero icons, clear keywords already truthful to the candidate.
4. Keep targetJobTitle concise and ATS-standard.

Candidate CV JSON:
${JSON.stringify({
  targetJobTitle: cv.targetJobTitle,
  summary: cv.summary,
  experiences: cv.experiences,
  education: cv.education,
  skills: cv.skills,
  certifications: cv.certifications,
})}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Rewrite only the CV targetJobTitle and summary for ATS alignment using strictly verified candidate facts. Never fabricate credentials.',
          responseMimeType: 'application/json',
          responseSchema: CV_TAILOR_SCHEMA,
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      return res.json(parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر تخصيص الملخص المهني حالياً.';
      return res.status(500).json({ error: message });
    }
  });

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

  app.post('/api/report/trusted-enrichment', async (req, res) => {
    try {
      const { complaintText = '', condition = 'كل الحالات', allowedOrgs = ['NIMH', 'DSM-5-TR', 'WHO', 'CDC', 'ASHA'] } =
        req.body ?? {};
      const cleanComplaint = String(complaintText || '').trim();
      if (!cleanComplaint) {
        return res.status(400).json({ error: 'Complaint text is required.' });
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ citations: [], onlineUsed: false });
      }
      const ai = getAiClient();
      const prompt = `
Provide concise, factual Arabic clinical-educational evidence notes strictly from these authoritative bodies ONLY: ${(allowedOrgs as string[]).join(', ')}
Topic / Behavioral Observation: ${cleanComplaint.slice(0, 600)}
Focus Axis: ${String(condition)}

STRICT RULES:
1. Cite ONLY NIMH, DSM-5-TR, WHO, CDC, or ASHA official pages.
2. STRICTLY ZERO MEDICATION OR PHARMACEUTICAL ADVICE: Do NOT mention any drug names, dosages, or prescriptions. Focus exclusively on educational, behavioral, sensory, speech, family, and school accommodations.
3. Return JSON array of up to 3 items matching schema: [{ "org": "NIMH|DSM-5-TR|WHO|CDC|ASHA", "title": "...", "url": "https://...", "summaryAr": "..." }].
`;
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction:
            'Only output evidence-based non-pharmacological educational & rehabilitation guidance strictly from NIMH, DSM-5-TR, WHO, CDC, or ASHA.',
          responseMimeType: 'application/json',
        },
      });
      const raw = (response.text ?? '[]').trim();
      const parsed = JSON.parse(raw);
      const medBlock =
        /\b(ريتالين|كونسيرتا|ستراتيرا|أتوموكسيتين|ميثيلفينيديت|ريسبيريدون|دواء|أدوية|عقار|جرعة|ritalin|concerta|strattera|atomoxetine|methylphenidate|risperidone|medication|dosage|drug)\b/i;
      const validOrgs = new Set(['NIMH', 'DSM-5-TR', 'WHO', 'CDC', 'ASHA']);
      const list = (Array.isArray(parsed) ? parsed : [])
        .filter((it: { org?: string; url?: string; summaryAr?: string; title?: string }) =>
          it &&
          validOrgs.has(String(it.org || '')) &&
          typeof it.url === 'string' &&
          it.url.startsWith('https://') &&
          !medBlock.test(String(it.summaryAr || ''))
        )
        .slice(0, 3)
        .map((it: { org: string; url: string; summaryAr: string; title: string }, idx: number) => ({
          id: `online-cit-${Date.now()}-${idx}`,
          org: it.org,
          title: it.title || it.org,
          url: it.url,
          retrievedDate: new Date().toISOString().slice(0, 10),
          summaryAr: it.summaryAr,
        }));
      return res.json({ citations: list, onlineUsed: list.length > 0 });
    } catch {
      return res.json({ citations: [], onlineUsed: false });
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
