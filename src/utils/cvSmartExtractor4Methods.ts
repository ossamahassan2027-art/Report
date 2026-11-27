import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { CvData, CvLanguage } from '../types/cv';
import {
  extractRawTextLocally,
  extractTextWithTesseract,
  LocalExtractedCvResult,
  LocalProgressCallback,
  parseRawTextToCv,
} from './cvLocalParser';
import { PreparedUploadedFile } from './cvFileParser';
import { markMissingFieldsExplicitly, normalizeArabicTextStrict } from './cvSmartSuite';

if (typeof pdfWorkerUrl === 'string' && pdfWorkerUrl.length > 0) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export type CvExtractionMethodId =
  | 'method-1-pdfjs-text'
  | 'method-2-pdf-300dpi-ocr'
  | 'method-3-image-3settings'
  | 'method-4-manual-voice';

function base64ToUint8(base64: string): Uint8Array {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function renderImageVariantDataUrl(
  srcUrl: string,
  mode: 'normal' | 'high-contrast' | 'upscaled-sharp'
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const scale =
          mode === 'upscaled-sharp'
            ? Math.min(2.8, 2200 / Math.max(img.width, 1))
            : Math.min(2.0, 1600 / Math.max(img.width, 1));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(srcUrl);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (mode === 'high-contrast' || mode === 'upscaled-sharp') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            const contrastFactor = mode === 'high-contrast' ? 1.85 : 1.45;
            const val = Math.min(255, Math.max(0, Math.round((lum - 128) * contrastFactor + 128)));
            d[i] = val;
            d[i + 1] = val;
            d[i + 2] = val;
          }
          ctx.putImageData(imgData, 0, 0);
        }
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(srcUrl);
      }
    };
    img.onerror = () => resolve(srcUrl);
    img.src = srcUrl;
  });
}

function scoreExtractedReadableQuality(text: string): number {
  const arMatches = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const enMatches = (text.match(/[A-Za-z0-9]/g) || []).length;
  const garbage = (text.match(/[~`^|\\{}<>@#■□◆●]/g) || []).length;
  return arMatches * 2 + enMatches - garbage * 4;
}

export async function extractPdfAt300DpiOcr(
  base64Data: string,
  onProgress?: LocalProgressCallback
): Promise<string> {
  onProgress?.(10, 'تحويل صفحات PDF إلى صور 300 DPI...');
  const uint8 = base64ToUint8(base64Data);
  const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
  const maxPages = Math.min(3, pdf.numPages);
  const pageChunks: string[] = [];

  for (let p = 1; p <= maxPages; p++) {
    const page = await pdf.getPage(p);
    // 300 DPI relative to 72pt standard PDF = ~3.125 scale (capped safely for memory)
    const viewport = page.getViewport({ scale: 2.8 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/png');
      onProgress?.(Math.round(15 + (p / maxPages) * 75), `قراءة OCR 300 DPI صفحة ${p} من ${maxPages}`);
      const txt = await extractTextWithTesseract(dataUrl);
      if (txt) pageChunks.push(txt);
    }
  }
  onProgress?.(100, 'اكتمل استخراج 300 DPI OCR');
  return pageChunks.join('\n').trim();
}

export async function extractImageWith3Settings(
  imageSrc: string,
  onProgress?: LocalProgressCallback
): Promise<{ bestText: string; usedSettingLabel: string }> {
  const settings: { mode: 'normal' | 'high-contrast' | 'upscaled-sharp'; label: string }[] = [
    { mode: 'high-contrast', label: 'تباين عالٍ أبيض/أسود' },
    { mode: 'upscaled-sharp', label: 'تكبير حاد 2.8x' },
    { mode: 'normal', label: 'الصورة القياسية' },
  ];

  let bestText = '';
  let bestScore = -1;
  let usedSettingLabel = settings[0].label;

  for (let i = 0; i < settings.length; i++) {
    const s = settings[i];
    onProgress?.(
      Math.round(15 + (i / settings.length) * 75),
      `قراءة الصورة (${i + 1}/3: ${s.label})...`
    );
    try {
      const processedUrl = await renderImageVariantDataUrl(imageSrc, s.mode);
      const txt = await extractTextWithTesseract(processedUrl);
      const sc = scoreExtractedReadableQuality(txt);
      if (sc > bestScore) {
        bestScore = sc;
        bestText = txt;
        usedSettingLabel = s.label;
      }
      // Fast short-circuit if already strong rich text detected (> 350 readable chars)
      if (sc > 500) break;
    } catch {
      // try next setting
    }
  }

  onProgress?.(100, `تم الاستخراج بأفضل إعداد (${usedSettingLabel})`);
  return { bestText, usedSettingLabel };
}

export async function runCv4MethodExtraction(params: {
  method: CvExtractionMethodId;
  preparedFile: PreparedUploadedFile | null;
  manualText: string;
  language: CvLanguage;
  currentCv: CvData;
  onProgress?: LocalProgressCallback;
}): Promise<LocalExtractedCvResult & { methodUsedLabel: string }> {
  const { method, preparedFile, manualText, language, currentCv, onProgress } = params;
  let rawText = '';
  let methodUsedLabel = '';

  if (method === 'method-4-manual-voice' || (!preparedFile && manualText.trim())) {
    methodUsedLabel = 'الطريقة 4: إدخال يدوي / لصق / صوتي';
    rawText = manualText.trim();
    if (!rawText && preparedFile?.previewDataUrl) {
      rawText = await extractTextWithTesseract(preparedFile.previewDataUrl, onProgress);
    }
  } else if (method === 'method-2-pdf-300dpi-ocr' && preparedFile?.kind === 'pdf' && preparedFile.base64Data) {
    methodUsedLabel = 'الطريقة 2: PDF لصور 300 DPI + OCR (ara+eng)';
    rawText = await extractPdfAt300DpiOcr(preparedFile.base64Data, onProgress);
  } else if (
    method === 'method-3-image-3settings' &&
    preparedFile?.kind === 'image' &&
    preparedFile.previewDataUrl
  ) {
    const res3 = await extractImageWith3Settings(preparedFile.previewDataUrl, onProgress);
    methodUsedLabel = `الطريقة 3: صورة بـ 3 إعدادات (${res3.usedSettingLabel})`;
    rawText = res3.bestText;
  } else if (preparedFile) {
    methodUsedLabel = `الطريقة 1: استخراج محلي مباشر (${preparedFile.kind.toUpperCase()})`;
    if (preparedFile.kind === 'image' && preparedFile.previewDataUrl) {
      const res3 = await extractImageWith3Settings(preparedFile.previewDataUrl, onProgress);
      methodUsedLabel = `الطريقة 3 تلقائياً: صورة بـ 3 إعدادات (${res3.usedSettingLabel})`;
      rawText = res3.bestText;
    } else {
      rawText = await extractRawTextLocally(preparedFile, onProgress);
    }
  }

  const normalizedRaw = normalizeArabicTextStrict(rawText || manualText);
  const parsed = parseRawTextToCv(normalizedRaw, language, currentCv);
  const withMissingMarkers = markMissingFieldsExplicitly(parsed.cvData);

  return {
    ...parsed,
    cvData: {
      ...withMissingMarkers,
      fullName: normalizeArabicTextStrict(withMissingMarkers.fullName),
      targetJobTitle: normalizeArabicTextStrict(withMissingMarkers.targetJobTitle),
      summary: normalizeArabicTextStrict(withMissingMarkers.summary),
    },
    rawText: normalizedRaw,
    methodUsedLabel,
  };
}
