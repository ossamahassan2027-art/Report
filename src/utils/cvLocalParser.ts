import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import { createWorker } from 'tesseract.js';
import {
  CvCertificationItem,
  CvData,
  CvEducationItem,
  CvExperienceItem,
  CvLanguage,
  CvLanguageItem,
  CvSkillItem,
  CvTrainingItem,
  ExtractedCertificateSummary,
  ExtractedJobAdSummary,
} from '../types/cv';
import { extractJobDescriptionKeywords, normalizeDateString } from './cvAtsEngine';

if (typeof pdfWorkerUrl === 'string' && pdfWorkerUrl.length > 0) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export const LOCAL_EXTRACTION_TIMEOUT_MS = 30000;

export type LocalProgressCallback = (percent: number, stageLabel: string) => void;

export interface LocalPreparedFileLike {
  fileName: string;
  kind: 'pdf' | 'word' | 'image' | 'text';
  mimeType: string;
  base64Data?: string;
  plainText?: string;
  previewDataUrl?: string;
}

export interface LocalExtractedCvResult {
  cvData: CvData;
  extractedFieldCount: number;
  missingFields: string[];
  rawText: string;
}

function isPlaceholderOrEmpty(val: unknown): boolean {
  if (typeof val !== 'string') return true;
  const trimmed = val.trim();
  return !trimmed || trimmed === '[ ... ]' || trimmed === '...';
}

function toLatinDigits(str: string): string {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const easternDigits = '۰۱۲۳۴۵۶۷۸۹';
  return str
    .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(easternDigits.indexOf(d)));
}

function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeoutCleanup?: () => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      try {
        onTimeoutCleanup?.();
      } catch {
        // ignore cleanup error
      }
      reject(
        new Error('الاستخراج أخذ وقتاً طويلاً، جرب صورة أوضح أو ملف PDF نصي.')
      );
    }, timeoutMs);

    promise.then(
      (val) => {
        window.clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function preprocessImageForOcr(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const minTargetWidth = 1400;
        const scale = img.width < minTargetWidth ? Math.min(2.5, minTargetWidth / Math.max(1, img.width)) : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

export async function extractTextWithTesseract(
  imageSrc: string,
  onProgress?: LocalProgressCallback
): Promise<string> {
  type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;
  let worker: TesseractWorker | null = null;
  let aborted = false;

  const terminateWorkerSafely = async () => {
    const w = worker as TesseractWorker | null;
    if (w) {
      await w.terminate().catch(() => {});
      worker = null;
    }
  };

  const runOcr = async () => {
    onProgress?.(5, 'جاري قراءة الصورة');
    const processedSrc = await preprocessImageForOcr(imageSrc);

    const createdWorker = await createWorker('ara+eng', 1, {
      logger: (m) => {
        if (aborted) return;
        const p = typeof m.progress === 'number' ? m.progress : 0;
        if (m.status === 'loading tesseract core') {
          onProgress?.(Math.min(18, Math.max(8, Math.round(8 + p * 10))), 'جاري قراءة الصورة');
        } else if (m.status === 'loading language traineddata') {
          onProgress?.(Math.min(40, Math.max(18, Math.round(18 + p * 22))), 'جاري قراءة الصورة');
        } else if (m.status === 'recognizing text') {
          onProgress?.(Math.min(98, Math.max(42, Math.round(42 + p * 56))), 'جاري قراءة الصورة');
        }
      },
    });
    worker = createdWorker;

    const { data } = await createdWorker.recognize(processedSrc);
    onProgress?.(100, 'جاري قراءة الصورة');
    return (data?.text || '').trim();
  };

  try {
    const text = await withTimeout(runOcr(), LOCAL_EXTRACTION_TIMEOUT_MS, () => {
      aborted = true;
      void terminateWorkerSafely();
    });
    if (!text) {
      throw new Error('تعذر قراءة الملف، برجاء تجربة ملف أوضح أو الصق النص يدوياً.');
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.message.includes('الاستخراج أخذ وقتاً طويلاً')) {
      throw err;
    }
    throw new Error('تعذر قراءة الملف، برجاء تجربة ملف أوضح أو الصق النص يدوياً.');
  } finally {
    await terminateWorkerSafely();
  }
}

export async function extractTextWithPdfJs(
  uint8: Uint8Array,
  onProgress?: LocalProgressCallback
): Promise<string> {
  const runPdf = async () => {
    onProgress?.(8, 'جاري قراءة ملف PDF');
    const loadingTask = pdfjsLib.getDocument({ data: uint8 });
    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const lines: string[] = [];
      let currentLine = '';
      let lastY: number | null = null;

      for (const rawItem of content.items) {
        if (!('str' in rawItem)) continue;
        const textPart = rawItem.str || '';
        const y = Array.isArray(rawItem.transform) ? rawItem.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = textPart;
        } else {
          currentLine = currentLine ? `${currentLine} ${textPart}` : textPart;
        }
        if (y !== null) lastY = y;
      }
      if (currentLine.trim()) lines.push(currentLine.trim());
      pageTexts.push(lines.join('\n'));

      const pct = Math.min(95, Math.round((pageNum / Math.max(1, pdf.numPages)) * 90));
      onProgress?.(pct, `جاري قراءة صفحة ${pageNum} من ${pdf.numPages}`);
    }

    let fullText = pageTexts.join('\n\n').trim();

    // If scanned PDF with no selectable text layer, OCR first 2 pages locally
    if (fullText.replace(/\s+/g, '').length < 20 && pdf.numPages > 0) {
      const ocrChunks: string[] = [];
      const pagesToScan = Math.min(2, pdf.numPages);
      for (let pageNum = 1; pageNum <= pagesToScan; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          const imgUrl = canvas.toDataURL('image/png');
          const ocrText = await extractTextWithTesseract(imgUrl, onProgress);
          if (ocrText) ocrChunks.push(ocrText);
        }
      }
      fullText = ocrChunks.join('\n').trim();
    }

    onProgress?.(100, 'اكتملت قراءة الملف');
    return fullText;
  };

  try {
    const text = await withTimeout(runPdf(), LOCAL_EXTRACTION_TIMEOUT_MS);
    if (!text) {
      throw new Error('تعذر قراءة الملف، برجاء تجربة ملف أوضح أو الصق النص يدوياً.');
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.message.includes('الاستخراج أخذ وقتاً طويلاً')) {
      throw err;
    }
    throw new Error('تعذر قراءة الملف، برجاء تجربة ملف أوضح أو الصق النص يدوياً.');
  }
}

export async function extractTextWithMammoth(
  uint8: Uint8Array,
  onProgress?: LocalProgressCallback
): Promise<string> {
  const runDocx = async () => {
    onProgress?.(20, 'جاري قراءة ملف Word');
    const arrayBuffer = uint8.buffer.slice(
      uint8.byteOffset,
      uint8.byteOffset + uint8.byteLength
    ) as ArrayBuffer;
    const result = await mammoth.extractRawText({ arrayBuffer });
    onProgress?.(100, 'اكتملت قراءة ملف Word');
    return (result.value || '').trim();
  };

  try {
    const text = await withTimeout(runDocx(), LOCAL_EXTRACTION_TIMEOUT_MS);
    if (!text) {
      throw new Error('تعذر قراءة الملف، برجاء تجربة ملف أوضح أو الصق النص يدوياً.');
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.message.includes('الاستخراج أخذ وقتاً طويلاً')) {
      throw err;
    }
    throw new Error('تعذر قراءة الملف، برجاء تجربة ملف أوضح أو الصق النص يدوياً.');
  }
}

export async function extractRawTextLocally(
  prepared: LocalPreparedFileLike,
  onProgress?: LocalProgressCallback
): Promise<string> {
  if (prepared.plainText && prepared.plainText.trim()) {
    onProgress?.(100, 'جاري تحليل النص');
    return prepared.plainText.trim();
  }

  if (prepared.kind === 'pdf') {
    if (!prepared.base64Data) {
      throw new Error('تعذر قراءة الملف، برجاء تجربة ملف أوضح أو الصق النص يدوياً.');
    }
    return extractTextWithPdfJs(base64ToUint8Array(prepared.base64Data), onProgress);
  }

  if (prepared.kind === 'word') {
    if (!prepared.base64Data) {
      throw new Error('تعذر قراءة الملف، برجاء تجربة ملف أوضح أو الصق النص يدوياً.');
    }
    return extractTextWithMammoth(base64ToUint8Array(prepared.base64Data), onProgress);
  }

  if (prepared.kind === 'image') {
    const src =
      prepared.previewDataUrl ||
      (prepared.base64Data ? `data:${prepared.mimeType};base64,${prepared.base64Data}` : '');
    if (!src) {
      throw new Error('تعذر قراءة الملف، برجاء تجربة ملف أوضح أو الصق النص يدوياً.');
    }
    return extractTextWithTesseract(src, onProgress);
  }

  throw new Error('تعذر قراءة الملف، برجاء تجربة ملف أوضح أو الصق النص يدوياً.');
}

// ============================================================================
// Pure Local Regex & Section Parser (Zero AI / Zero Network)
// ============================================================================

type SectionBucket =
  | 'header'
  | 'summary'
  | 'experiences'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'trainings'
  | 'languages'
  | 'contact';

const SECTION_HEADING_PATTERNS: [SectionBucket, RegExp][] = [
  ['experiences', /^(?:الخبرات\s*(?:العملية|المهنية|السابقة)?|خبرة\s*العمل|work\s*experience|professional\s*experience|experience)\s*[:：\-]?$/i],
  ['education', /^(?:التعليم|المؤهل(?:ات)?\s*(?:العلمية|الدراسية)?|المستوى\s*التعليمي|education(?:\s*&\s*qualifications?)?)\s*[:：\-]?$/i],
  ['skills', /^(?:المهارات(?:\s*الشخصية|\s*المهنية|\s*الفنية)?|skills|core\s*competencies)\s*[:：\-]?$/i],
  ['certifications', /^(?:الشهادات(?:\s*والدورات)?|الشهادات\s*المعتمدة|certifications?|licenses?)\s*[:：\-]?$/i],
  ['trainings', /^(?:الدورات\s*(?:التدريبية)?|التدريب|training(?:\s*courses)?|courses)\s*[:：\-]?$/i],
  ['languages', /^(?:اللغات|languages)\s*[:：\-]?$/i],
  ['summary', /^(?:نبذة\s*عني|نبذة\s*مختصرة|الملخص\s*(?:المهني)?|عن\s*المتقدم|professional\s*summary|summary|about\s*me|profile)\s*[:：\-]?$/i],
  ['contact', /^(?:معلومات\s*الاتصال|بيانات\s*التواصل|التواصل|contact(?:\s*info(?:rmation)?)?)\s*[:：\-]?$/i],
];

const JOB_TITLE_KEYWORDS =
  /(أخصائي|أخصائية|مدير|مشرف|معلم|معلمة|أستاذ|استشاري|محلل|منسق|مدرب|محاضر|تربية\s*خاصة|علاج\s*وظيفي|تأهيل|تعديل\s*سلوك|specialist|manager|director|teacher|consultant|therapist|supervisor|coordinator|trainer)/i;

const EDUCATION_KEYWORDS =
  /(دبلوم|بكالوريوس|ليسانس|ماجستير|دكتوراه|كلية|جامعة|معهد|دفعة|bachelor|diploma|master|phd|university|college|faculty)/i;

const DATE_RANGE_REGEX =
  /((?:من\s*)?(?:\d{1,2}\s*\/\s*\d{4}|(?:19|20)\d{2}|(?:يناير|فبراير|مارس|ابريل|أبريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|أكتوبر|اكتوبر|نوفمبر|ديسمبر|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z\u0600-\u06FF\s]*\d{4})\s*(?:[-–—]|إلى|الى|to|حتى)?\s*(?:حتى\s*ال[آا]ن|ال[آا]ن|present|current|now|\d{1,2}\s*\/\s*\d{4}|(?:19|20)\d{2})?)/i;

function cleanLine(raw: string): string {
  return raw
    .replace(/[•●▪▫■□►▸◦]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectSectionHeading(line: string): SectionBucket | null {
  const normalized = line.replace(/[|•*_#\[\]]/g, '').trim();
  if (!normalized || normalized.length > 52) return null;
  for (const [bucket, regex] of SECTION_HEADING_PATTERNS) {
    if (regex.test(normalized)) return bucket;
  }
  return null;
}

function extractInlineSectionTag(line: string): { bucket: SectionBucket; remainder: string } | null {
  const prefixes: [SectionBucket, RegExp][] = [
    ['experiences', /^(?:الخبرات\s*(?:العملية|المهنية)?|work\s*experience|experience)\s*[:：]\s*(.+)$/i],
    ['education', /^(?:التعليم|المؤهلات\s*العلمية|education)\s*[:：]\s*(.+)$/i],
    ['skills', /^(?:المهارات|skills)\s*[:：]\s*(.+)$/i],
    ['certifications', /^(?:الشهادات(?:\s*والدورات)?|certifications?)\s*[:：]\s*(.+)$/i],
    ['trainings', /^(?:الدورات\s*التدريبية|trainings?|courses?)\s*[:：]\s*(.+)$/i],
    ['languages', /^(?:اللغات|languages)\s*[:：]\s*(.+)$/i],
    ['summary', /^(?:نبذة\s*عني|الملخص\s*المهني|summary|about)\s*[:：]\s*(.+)$/i],
  ];
  for (const [bucket, rx] of prefixes) {
    const m = line.match(rx);
    if (m && m[1]?.trim()) {
      return { bucket, remainder: m[1].trim() };
    }
  }
  return null;
}

function extractPhoneFromText(text: string): string {
  const normalized = toLatinDigits(text);
  // Egyptian mobile number with optional +20 / 0020 / 20 prefix
  const egMatch = normalized.match(/(?:(?:\+|00)?20[\s.-]*)?(0?1[0125][\s.-]*[0-9]{4}[\s.-]*[0-9]{4})/);
  if (egMatch && egMatch[1]) {
    const digits = egMatch[1].replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('1')) {
      return `0${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('01')) {
      return digits;
    }
  }
  // Fallback international phone
  const intlMatch = normalized.match(/(?:\+|00)?[0-9]{1,3}[\s.-]?[0-9]{3,4}[\s.-]?[0-9]{3,4}[\s.-]?[0-9]{2,4}/);
  if (intlMatch) {
    const cleaned = intlMatch[0].replace(/\s+/g, '').trim();
    if (cleaned.replace(/\D/g, '').length >= 9) return cleaned;
  }
  return '[ ... ]';
}

function extractEmailFromText(text: string): string {
  // Repair occasional OCR whitespace right around @ or dot in email
  const repaired = toLatinDigits(text).replace(/\s*@\s*/g, '@');
  const m = repaired.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].trim() : '[ ... ]';
}

function extractWebsiteFromText(text: string): string {
  const m = text.match(/(?:https?:\/\/[^\s]+|www\.[^\s]+|linkedin\.com\/[^\s]+)/i);
  if (m && !m[0].includes('@')) {
    return m[0].replace(/[،,.)]+$/, '').trim();
  }
  return '[ ... ]';
}

function extractLocationFromLines(lines: string[]): string {
  for (const line of lines) {
    const explicit = line.match(/^(?:العنوان|الموقع|السكن|address|location)\s*[:：\-]\s*(.+)$/i);
    if (explicit && explicit[1]?.trim()) {
      return explicit[1].trim();
    }
  }
  const geoLine = lines.find((l) =>
    /(جمهورية\s*مصر|محافظة\s*البحيرة|دمنهور|القاهرة|الإسكندرية|الجيزة|شارع|بجوار|الإمارات|السعودية|egypt|cairo|damanhour|alexandria|riyadh|uae)/i.test(l) &&
    !JOB_TITLE_KEYWORDS.test(l) &&
    l.length < 110
  );
  return geoLine ? geoLine.trim() : '[ ... ]';
}

function extractNameFromLines(lines: string[], targetJobTitle: string): string {
  for (const line of lines) {
    const labeled = line.match(/^(?:الاسم(?:\s*الكامل)?|full\s*name|name)\s*[:：\-]\s*(.+)$/i);
    if (labeled && labeled[1]?.trim()) {
      return labeled[1].trim();
    }
  }

  const candidateLines: string[] = [];
  for (const line of lines.slice(0, 12)) {
    const stripped = line.replace(/[|•\-_*]/g, ' ').trim();
    if (!stripped) continue;
    if (/^\d{4}$/.test(stripped)) continue; // year banner like 2026
    if (detectSectionHeading(stripped)) break;
    if (/@|http|www\.|01[0125]\d{8}/i.test(stripped)) continue;
    if (/(خبر[ةه]\s*(أكثر|اكثر)?\s*من|معلومات\s*الاتصال|نبذة\s*عني)/i.test(stripped)) continue;

    // If the line has "اسم الشخص أخصائي ..." take text before the job title keyword
    if (JOB_TITLE_KEYWORDS.test(stripped)) {
      const idx = stripped.search(JOB_TITLE_KEYWORDS);
      if (idx > 3) {
        const beforeTitle = stripped.slice(0, idx).replace(/[-–—|/،,]+$/, '').trim();
        if (beforeTitle.length >= 4 && !beforeTitle.includes('عام')) {
          candidateLines.push(beforeTitle);
          break;
        }
      }
      continue;
    }

    if (stripped === targetJobTitle) continue;
    if (stripped.length >= 4 && stripped.length <= 48 && !/\d{5,}/.test(stripped)) {
      candidateLines.push(stripped);
      if (candidateLines.length >= 2) {
        // Combine Arabic + English name pair if both look like names
        const firstIsAr = /[\u0600-\u06FF]/.test(candidateLines[0]);
        const secondIsEn = /^[a-zA-Z\s.'-]+$/.test(candidateLines[1]);
        if (firstIsAr && secondIsEn) {
          return `${candidateLines[0]} / ${candidateLines[1]}`;
        }
        return candidateLines[0];
      }
    }
  }

  return candidateLines[0] || '[ ... ]';
}

function extractJobTitleFromLines(lines: string[]): string {
  for (const line of lines) {
    const labeled = line.match(/^(?:المسمى\s*الوظيفي|الوظيفة\s*الحالية|job\s*title|title)\s*[:：\-]\s*(.+)$/i);
    if (labeled && labeled[1]?.trim()) {
      return labeled[1].trim();
    }
  }

  const matchedTitles: string[] = [];
  for (const line of lines.slice(0, 18)) {
    if (detectSectionHeading(line)) break;
    if (JOB_TITLE_KEYWORDS.test(line) && !/نبذة|عملت\s*في\s*مجال/.test(line)) {
      matchedTitles.push(line.trim());
      if (matchedTitles.length >= 2) break;
    }
  }
  return matchedTitles.length > 0 ? matchedTitles.join(' - ') : '[ ... ]';
}

function parseExperiences(
  expLines: string[],
  allLines: string[],
  targetLanguage: CvLanguage,
  nowId: number
): CvExperienceItem[] {
  const sourceLines = expLines.length > 0 ? expLines : [];

  // Fallback: if no dedicated section lines found, collect lines with date ranges + job keywords
  if (sourceLines.length === 0) {
    allLines.forEach((line, idx) => {
      const normalized = toLatinDigits(line);
      if (
        DATE_RANGE_REGEX.test(normalized) &&
        !EDUCATION_KEYWORDS.test(line) &&
        (JOB_TITLE_KEYWORDS.test(line) || JOB_TITLE_KEYWORDS.test(allLines[idx - 1] || ''))
      ) {
        if (idx > 0 && JOB_TITLE_KEYWORDS.test(allLines[idx - 1]) && !DATE_RANGE_REGEX.test(toLatinDigits(allLines[idx - 1]))) {
          sourceLines.push(allLines[idx - 1]);
        }
        sourceLines.push(line);
      }
    });
  }

  if (sourceLines.length === 0) return [];

  const items: CvExperienceItem[] = [];
  let current: CvExperienceItem | null = null;

  const pushCurrent = () => {
    if (current && (!isPlaceholderOrEmpty(current.jobTitle) || !isPlaceholderOrEmpty(current.company))) {
      if (current.bullets.length === 0) current.bullets = ['[ ... ]'];
      items.push(current);
    }
  };

  for (let i = 0; i < sourceLines.length; i++) {
    const line = sourceLines[i].trim();
    if (!line) continue;
    const normLine = toLatinDigits(line);
    const dateMatch = normLine.match(DATE_RANGE_REGEX);

    const looksLikeNewRole =
      Boolean(dateMatch) ||
      (JOB_TITLE_KEYWORDS.test(line) && line.length < 90 && (!current || current.bullets.length > 0));

    if (looksLikeNewRole) {
      // Check if previous entry just had jobTitle without dateRange and this line is its date/company
      if (
        current &&
        isPlaceholderOrEmpty(current.dateRange) &&
        dateMatch &&
        !JOB_TITLE_KEYWORDS.test(line)
      ) {
        current.dateRange = normalizeDateString(dateMatch[1].trim(), targetLanguage);
        const remainder = line
          .replace(dateMatch[0], '')
          .replace(/[()|\-–—]+/g, ' ')
          .trim();
        if (remainder) {
          if (isPlaceholderOrEmpty(current.company)) current.company = remainder;
          else current.bullets.push(remainder);
        }
        continue;
      }

      pushCurrent();

      let dateRange = '[ ... ]';
      let cleanRole = line;
      if (dateMatch) {
        dateRange = normalizeDateString(dateMatch[1].trim(), targetLanguage);
        cleanRole = normLine
          .replace(dateMatch[0], '')
          .replace(/[()]+/g, ' ')
          .replace(/^[\s\-•*·]+/, '')
          .replace(/\s+(?:منذ|من|from|since)\s*$/i, '')
          .trim();
      } else {
        cleanRole = line.replace(/^[\s\-•*·]+/, '').trim();
      }

      // Split on separators like | or - or — if both role & company are on one line
      const splitParts = cleanRole
        .split(/\s*[|—–]\s*|\s+-\s+/)
        .map((p) => p.replace(/^[\s\-•*·]+/, '').trim())
        .filter(Boolean);

      current = {
        id: `exp-imp-${nowId}-${items.length}`,
        jobTitle: splitParts[0] || (JOB_TITLE_KEYWORDS.test(line) ? cleanRole : '[ ... ]'),
        company: splitParts[1] || '[ ... ]',
        location: '[ ... ]',
        dateRange,
        bullets: splitParts.slice(2),
      };
    } else if (current) {
      if (
        isPlaceholderOrEmpty(current.company) &&
        /(مركز|مؤسس[ةه]|جمعي[ةه]|مستشف[ىي]|مدرس[ةه]|شرك[ةه]|جامع[ةه]|وزار[ةه]|center|academy|hospital|school|company|foundation)/i.test(line)
      ) {
        current.company = line;
      } else {
        current.bullets.push(line);
      }
    } else {
      current = {
        id: `exp-imp-${nowId}-${items.length}`,
        jobTitle: line,
        company: '[ ... ]',
        location: '[ ... ]',
        dateRange: '[ ... ]',
        bullets: [],
      };
    }
  }

  pushCurrent();
  return items;
}

function parseEducation(
  eduLines: string[],
  allLines: string[],
  targetLanguage: CvLanguage,
  nowId: number
): CvEducationItem[] {
  const candidates = [...eduLines];
  // Also catch degree lines anywhere in the document if missing from edu section
  allLines.forEach((l) => {
    if (EDUCATION_KEYWORDS.test(l) && !candidates.includes(l)) {
      candidates.push(l);
    }
  });

  if (candidates.length === 0) return [];

  const items: CvEducationItem[] = [];
  let pendingInstitution = '';
  let pendingYear = '';

  for (const rawLine of candidates) {
    const line = rawLine.trim();
    if (!line) continue;
    const norm = toLatinDigits(line);
    const yearMatch = norm.match(/(?:دفعة\s*)?((?:19|20)\d{2}(?:\s*[-–]\s*(?:19|20)\d{2})?)/);
    const lineYear = yearMatch ? normalizeDateString(yearMatch[1], targetLanguage) : '';

    const hasDegreeWord = /(دبلوم|بكالوريوس|ليسانس|ماجستير|دكتوراه|bachelor|diploma|master|phd)/i.test(line);
    const hasInstWord = /(جامعة|كلية|معهد|أكاديمية|university|college|faculty|institute)/i.test(line);

    if (hasDegreeWord && hasInstWord) {
      const parts = line.split(/\s*[|—–\-]\s*/).map((p) => p.trim()).filter(Boolean);
      const degPart = parts.find((p) => /(دبلوم|بكالوريوس|ليسانس|ماجستير|دكتوراه|bachelor|diploma|master)/i.test(p)) || line;
      const instPart = parts.find((p) => p !== degPart && /(جامعة|كلية|معهد|university|college|faculty)/i.test(p)) || '[ ... ]';
      items.push({
        id: `edu-imp-${nowId}-${items.length}`,
        degree: degPart,
        institution: instPart,
        dateRange: lineYear || pendingYear || '[ ... ]',
        details: '',
      });
      pendingInstitution = '';
      pendingYear = '';
    } else if (hasInstWord && !hasDegreeWord) {
      pendingInstitution = line.replace(/\|\s*دفعة\s*\d{4}/g, '').trim();
      if (lineYear) pendingYear = lineYear;
    } else if (hasDegreeWord) {
      items.push({
        id: `edu-imp-${nowId}-${items.length}`,
        degree: line,
        institution: pendingInstitution || '[ ... ]',
        dateRange: lineYear || pendingYear || '[ ... ]',
        details: '',
      });
      pendingInstitution = '';
      pendingYear = '';
    }
  }

  if (items.length === 0 && pendingInstitution) {
    items.push({
      id: `edu-imp-${nowId}-0`,
      degree: '[ ... ]',
      institution: pendingInstitution,
      dateRange: pendingYear || '[ ... ]',
      details: '',
    });
  }

  return items;
}

function parseSkills(skillLines: string[], nowId: number): CvSkillItem[] {
  if (skillLines.length === 0) return [];
  const rawTokens = skillLines
    .join('\n')
    .split(/[،,•\n|]+|\s+-\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 90);

  const unique = Array.from(new Set(rawTokens));
  return unique.map((name, idx) => ({
    id: `sk-imp-${nowId}-${idx}`,
    name,
    level: '',
  }));
}

function parseCertificationsAndTrainings(
  certLines: string[],
  trnLines: string[],
  targetLanguage: CvLanguage,
  nowId: number
): { certifications: CvCertificationItem[]; trainings: CvTrainingItem[] } {
  const combinedCerts: CvCertificationItem[] = [];
  const combinedTrns: CvTrainingItem[] = [];

  const splitEntries = (lines: string[]) =>
    lines
      .join('\n')
      .split(/\n|[•]|،(?=\s*(?:شهادة|دورة|الحصول))/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 3);

  splitEntries(certLines).forEach((entry, idx) => {
    const yearMatch = toLatinDigits(entry).match(/(19|20)\d{2}/);
    const parts = entry.split(/\s*[—–\-|]\s*/).map((p) => p.trim()).filter(Boolean);
    combinedCerts.push({
      id: `cert-imp-${nowId}-${idx}`,
      name: parts[0] || entry,
      issuer: parts[1] || '[ ... ]',
      date: yearMatch ? normalizeDateString(yearMatch[0], targetLanguage) : '[ ... ]',
    });
  });

  splitEntries(trnLines).forEach((entry, idx) => {
    const yearMatch = toLatinDigits(entry).match(/(19|20)\d{2}/);
    const parts = entry.split(/\s*[—–\-|]\s*/).map((p) => p.trim()).filter(Boolean);
    combinedTrns.push({
      id: `trn-imp-${nowId}-${idx}`,
      title: parts[0] || entry,
      provider: parts[1] || '[ ... ]',
      dateRange: yearMatch ? normalizeDateString(yearMatch[0], targetLanguage) : '[ ... ]',
    });
  });

  return { certifications: combinedCerts, trainings: combinedTrns };
}

function parseLanguages(langLines: string[], fullText: string, nowId: number): CvLanguageItem[] {
  const entries = langLines
    .join('\n')
    .split(/[،,•\n|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 60);

  const items: CvLanguageItem[] = entries.map((entry, idx) => {
    const parts = entry.split(/\s*[:\-–()]\s*/).map((p) => p.trim()).filter(Boolean);
    return {
      id: `lang-imp-${nowId}-${idx}`,
      name: parts[0] || entry,
      proficiency: parts[1] || '[ ... ]',
    };
  });

  if (items.length === 0) {
    if (/(اللغة\s*العربية|العربية|arabic)/i.test(fullText)) {
      items.push({ id: `lang-imp-${nowId}-ar`, name: 'العربية', proficiency: '[ ... ]' });
    }
    if (/(اللغة\s*الإنجليزية|اللغة\s*الانجليزية|الإنجليزية|الانجليزية|english)/i.test(fullText)) {
      items.push({ id: `lang-imp-${nowId}-en`, name: 'الإنجليزية', proficiency: '[ ... ]' });
    }
  }

  return items;
}

export function parseRawTextToCv(
  rawText: string,
  targetLanguage: CvLanguage,
  existingCv?: CvData
): LocalExtractedCvResult {
  const nowId = Date.now();
  const lines = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const buckets: Record<SectionBucket, string[]> = {
    header: [],
    summary: [],
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    trainings: [],
    languages: [],
    contact: [],
  };

  let activeBucket: SectionBucket = 'header';
  for (const line of lines) {
    const heading = detectSectionHeading(line);
    if (heading) {
      activeBucket = heading;
      continue;
    }
    const inlineTag = extractInlineSectionTag(line);
    if (inlineTag) {
      activeBucket = inlineTag.bucket;
      buckets[inlineTag.bucket].push(inlineTag.remainder);
      continue;
    }
    buckets[activeBucket].push(line);
  }

  const phone = extractPhoneFromText(rawText);
  const email = extractEmailFromText(rawText);
  const websiteOrLink = extractWebsiteFromText(rawText);
  const location = extractLocationFromLines(
    buckets.contact.length > 0 ? [...buckets.contact, ...lines] : lines
  );

  const targetJobTitle = extractJobTitleFromLines(lines);
  const fullName = extractNameFromLines(lines, targetJobTitle);

  const summary =
    buckets.summary.length > 0
      ? buckets.summary.join(' ').trim()
      : '[ ... ]';

  const experiences = parseExperiences(buckets.experiences, lines, targetLanguage, nowId);
  const education = parseEducation(buckets.education, lines, targetLanguage, nowId);
  const skills = parseSkills(buckets.skills, nowId);
  const { certifications, trainings } = parseCertificationsAndTrainings(
    buckets.certifications,
    buckets.trainings,
    targetLanguage,
    nowId
  );
  const languages = parseLanguages(buckets.languages, rawText, nowId);

  const cvData: CvData = {
    fullName,
    targetJobTitle,
    phone,
    email,
    location,
    websiteOrLink,
    summary,
    experiences,
    education,
    skills,
    certifications,
    languages,
    trainings,
    jobDescriptionText: existingCv?.jobDescriptionText || '',
    targetOrganization: existingCv?.targetOrganization || '',
    targetSector: existingCv?.targetSector || '',
    experienceLevel: existingCv?.experienceLevel || '',
    personalPhotoDataUrl: existingCv?.personalPhotoDataUrl,
    showPhotoInCv: existingCv?.showPhotoInCv ?? false,
  };

  let extractedFieldCount = 0;
  const missingFields: string[] = [];

  const scalarChecks: [
    keyof Pick<CvData, 'fullName' | 'targetJobTitle' | 'phone' | 'email' | 'location' | 'summary'>,
    string,
  ][] = [
    ['fullName', 'الاسم الكامل'],
    ['targetJobTitle', 'المسمى الوظيفي'],
    ['phone', 'الهاتف'],
    ['email', 'البريد الإلكتروني'],
    ['location', 'العنوان / الموقع'],
    ['summary', 'الملخص المهني'],
  ];

  scalarChecks.forEach(([key, label]) => {
    if (!isPlaceholderOrEmpty(cvData[key])) extractedFieldCount += 1;
    else missingFields.push(label);
  });

  if (cvData.experiences.length > 0) extractedFieldCount += cvData.experiences.length;
  else missingFields.push('الخبرات العملية');

  if (cvData.education.length > 0) extractedFieldCount += cvData.education.length;
  else missingFields.push('التعليم');

  if (cvData.skills.length > 0) extractedFieldCount += cvData.skills.length;
  else missingFields.push('المهارات');

  if (cvData.certifications.length > 0) extractedFieldCount += cvData.certifications.length;
  if (cvData.languages.length > 0) extractedFieldCount += cvData.languages.length;
  if (cvData.trainings.length > 0) extractedFieldCount += cvData.trainings.length;

  return {
    cvData,
    extractedFieldCount,
    missingFields,
    rawText,
  };
}

export async function extractCvLocally(
  prepared: LocalPreparedFileLike,
  targetLanguage: CvLanguage,
  existingCv?: CvData,
  onProgress?: LocalProgressCallback
): Promise<LocalExtractedCvResult> {
  const rawText = await extractRawTextLocally(prepared, onProgress);
  return parseRawTextToCv(rawText, targetLanguage, existingCv);
}

export async function extractCertificateLocally(
  prepared: LocalPreparedFileLike,
  onProgress?: LocalProgressCallback
): Promise<ExtractedCertificateSummary> {
  const rawText = await extractRawTextLocally(prepared, onProgress);
  const lines = rawText.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const normalized = toLatinDigits(rawText);
  const yearMatch = normalized.match(/(19|20)\d{2}/);

  let docType: ExtractedCertificateSummary['docType'] = 'شهادة';
  if (/(دورة|تدريب|ورشة|course|training|workshop)/i.test(rawText)) docType = 'دورة';
  else if (/(خبرة|شهادة\s*خبرة|إفادة\s*عمل|experience\s*letter)/i.test(rawText)) docType = 'خبرة';
  else if (/(ترخيص|تقدير|خطاب|letter|license)/i.test(rawText)) docType = 'خطاب';

  const titleLine =
    lines.find((l) => /(شهادة|دبلوم|دورة|برنامج|aba|abat|certificate|diploma)/i.test(l) && l.length > 5) ||
    lines[0] ||
    '[ ... ]';

  const issuerLine =
    lines.find((l) => l !== titleLine && /(جامعة|مركز|مؤسسة|جمعية|أكاديمية|معهد|هيئة|university|institute|center|academy)/i.test(l)) ||
    '[ ... ]';

  const skillWords = lines
    .find((l) => /(تأهيل|تعديل\s*سلوك|تحليل\s*سلوك|علاج\s*وظيفي|تربية\s*خاصة|صعوبات\s*تعلم|تخاطب|IEP|ABA)/i.test(l));

  return {
    docType,
    title: titleLine.slice(0, 120),
    issuer: issuerLine.slice(0, 120),
    year: yearMatch ? yearMatch[0] : '[ ... ]',
    keywordSkill: skillWords ? skillWords.slice(0, 70) : titleLine.slice(0, 60),
  };
}

export async function extractJobAdLocally(
  prepared: LocalPreparedFileLike,
  emptyCvForKeywordScan: CvData,
  onProgress?: LocalProgressCallback
): Promise<ExtractedJobAdSummary> {
  const rawText = await extractRawTextLocally(prepared, onProgress);
  const lines = rawText.split(/\r?\n/).map(cleanLine).filter(Boolean);

  const jobTitleLine =
    lines.find((l) => JOB_TITLE_KEYWORDS.test(l) && l.length < 95) || lines[0] || '';
  const orgLine =
    lines.find((l) => /(مركز|مدرسة|مؤسسة|شركة|مستشفى|جمعية|جامعة|academy|center|school|company|hospital)/i.test(l)) ||
    '';

  let sector = '';
  if (/(تربية\s*خاصة|تأهيل|ذوي\s*الهمم|سلوك|علاج\s*وظيفي|تخاطب)/i.test(rawText)) {
    sector = 'التربية الخاصة والتأهيل';
  } else if (/(تعليم|مدرس|تدريس|education|school)/i.test(rawText)) {
    sector = 'التعليم والتدريب';
  } else if (/(طب|مستشفى|صحي|medical|health)/i.test(rawText)) {
    sector = 'الرعاية الصحية';
  }

  const kwAnalysis = extractJobDescriptionKeywords(rawText, emptyCvForKeywordScan);
  const keywords = Array.from(
    new Set([...kwAnalysis.matchedInCv, ...kwAnalysis.unmatchedFromJd])
  ).slice(0, 18);

  return {
    jobTitle: jobTitleLine,
    organization: orgLine,
    sector,
    cleanedText: rawText,
    keywords,
  };
}

export function tailorCvLocally(params: {
  cv: CvData;
  targetOrganization: string;
  targetSector: string;
  experienceLevel: string;
  jobDescriptionText: string;
  language: CvLanguage;
}): { targetJobTitle: string; summary: string } {
  const { cv, targetOrganization, targetSector, experienceLevel, language } = params;
  const baseTitle = !isPlaceholderOrEmpty(cv.targetJobTitle) ? cv.targetJobTitle.trim() : '';
  const topSkills = cv.skills
    .map((s) => s.name.trim())
    .filter((s) => s && !s.includes('['))
    .slice(0, 4);

  const targetJobTitle = baseTitle || (targetSector ? (language === 'ar' ? `أخصائي ${targetSector}` : `${targetSector} Specialist`) : cv.targetJobTitle);

  if (language === 'ar') {
    const parts: string[] = [];
    if (baseTitle) parts.push(baseTitle);
    if (experienceLevel) parts.push(`(${experienceLevel})`);
    if (targetSector) parts.push(`متخصص في مجال ${targetSector}`);
    if (targetOrganization) parts.push(`موجه للعمل في ${targetOrganization}`);
    if (topSkills.length > 0) parts.push(`بخبرة عملية في: ${topSkills.join('، ')}`);
    const existingBio = !isPlaceholderOrEmpty(cv.summary) ? cv.summary.trim() : '';
    const summary = parts.length > 0
      ? `${parts.join(' — ')}.${existingBio ? ` ${existingBio}` : ''}`
      : cv.summary;
    return { targetJobTitle, summary };
  }

  const parts: string[] = [];
  if (baseTitle) parts.push(baseTitle);
  if (experienceLevel) parts.push(`(${experienceLevel})`);
  if (targetSector) parts.push(`focused on ${targetSector}`);
  if (targetOrganization) parts.push(`tailored for ${targetOrganization}`);
  if (topSkills.length > 0) parts.push(`with proven skills in ${topSkills.join(', ')}`);
  const existingBio = !isPlaceholderOrEmpty(cv.summary) ? cv.summary.trim() : '';
  const summary = parts.length > 0
    ? `${parts.join(' — ')}.${existingBio ? ` ${existingBio}` : ''}`
    : cv.summary;

  return { targetJobTitle, summary };
}
