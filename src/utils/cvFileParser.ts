import {
  createBlankCvData,
  CvData,
  CvLanguage,
  ExtractedCertificateSummary,
  ExtractedJobAdSummary,
} from '../types/cv';
import {
  extractCertificateLocally,
  extractCvLocally,
  extractJobAdLocally,
  LocalProgressCallback,
  tailorCvLocally,
} from './cvLocalParser';

export const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type PreparedFileKind = 'pdf' | 'word' | 'excel' | 'image' | 'text';

export interface PreparedUploadedFile {
  id: string;
  fileName: string;
  sizeBytes: number;
  sizeLabel: string;
  kind: PreparedFileKind;
  mimeType: string;
  base64Data?: string;
  plainText?: string;
  previewDataUrl?: string;
  previewSnippet: string;
}

export interface ExtractedCvResult {
  cvData: CvData;
  extractedFieldCount: number;
  missingFields: string[];
  rawText?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('تعذر قراءة الملف المحدد.'));
    reader.readAsDataURL(file);
  });
}

export async function prepareFileForExtraction(
  file: File
): Promise<PreparedUploadedFile> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error(`الملف «${file.name}» يتجاوز الحد الأقصى المسموح (10 ميجابايت).`);
  }

  const lower = file.name.toLowerCase();
  const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // 1. Text files
  if (file.type === 'text/plain' || lower.endsWith('.txt') || lower.endsWith('.md')) {
    const plainText = await file.text();
    return {
      id,
      fileName: file.name,
      sizeBytes: file.size,
      sizeLabel: formatFileSize(file.size),
      kind: 'text',
      mimeType: 'text/plain',
      plainText,
      previewSnippet: plainText.trim().slice(0, 380) || '[ملف نصي فارغ]',
    };
  }

  // 2. Images
  if (file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(lower)) {
    const dataUrl = await readFileAsDataUrl(file);
    const base64Data = dataUrl.split(',')[1] || '';
    const mimeType =
      file.type && file.type.startsWith('image/')
        ? file.type
        : lower.endsWith('.png')
        ? 'image/png'
        : lower.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg';

    return {
      id,
      fileName: file.name,
      sizeBytes: file.size,
      sizeLabel: formatFileSize(file.size),
      kind: 'image',
      mimeType,
      base64Data,
      previewDataUrl: dataUrl,
      previewSnippet: `صورة جاهزة للاستخراج المحلي المباشر (${mimeType})`,
    };
  }

  // 3. PDF
  if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
    const dataUrl = await readFileAsDataUrl(file);
    const base64Data = dataUrl.split(',')[1] || '';
    return {
      id,
      fileName: file.name,
      sizeBytes: file.size,
      sizeLabel: formatFileSize(file.size),
      kind: 'pdf',
      mimeType: 'application/pdf',
      base64Data,
      previewSnippet: 'مستند PDF جاهز لقراءة النصوص محلياً (صفحة تلو الأخرى).',
    };
  }

  // 4. Word (.docx)
  if (file.type === DOCX_MIME_TYPE || lower.endsWith('.docx')) {
    const dataUrl = await readFileAsDataUrl(file);
    const base64Data = dataUrl.split(',')[1] || '';
    return {
      id,
      fileName: file.name,
      sizeBytes: file.size,
      sizeLabel: formatFileSize(file.size),
      kind: 'word',
      mimeType: DOCX_MIME_TYPE,
      base64Data,
      previewSnippet: 'ملف Microsoft Word (.docx) جاهز للاستخراج المحلي المباشر.',
    };
  }

  // 5. Excel (.xlsx / .xls / .csv)
  if (
    file.type === XLSX_MIME_TYPE ||
    file.type === 'application/vnd.ms-excel' ||
    /\.(xlsx|xls|csv)$/i.test(lower)
  ) {
    const dataUrl = await readFileAsDataUrl(file);
    const base64Data = dataUrl.split(',')[1] || '';
    return {
      id,
      fileName: file.name,
      sizeBytes: file.size,
      sizeLabel: formatFileSize(file.size),
      kind: 'excel',
      mimeType: file.type || XLSX_MIME_TYPE,
      base64Data,
      previewSnippet: 'ملف Excel جاهز للاستخراج المحلي المباشر عبر SheetJS.',
    };
  }

  if (lower.endsWith('.doc')) {
    throw new Error(
      'ملفات .doc القديمة غير مدعومة مباشرة — يرجى حفظ الملف بصيغة .docx أو PDF أو صورة ثم المحاولة مجدداً.'
    );
  }

  throw new Error(
    `صيغة الملف «${file.name}» غير مدعومة. الصيغ المدعومة: PDF، Word (.docx)، Excel (.xlsx)، صور (PNG/JPG/WEBP)، أو نص (.txt).`
  );
}

export async function requestExtractCvFromServer(
  prepared: PreparedUploadedFile,
  targetLanguage: CvLanguage,
  existingCv?: CvData,
  onProgress?: LocalProgressCallback
): Promise<ExtractedCvResult> {
  return extractCvLocally(prepared, targetLanguage, existingCv, onProgress);
}

export async function requestExtractCertificateFromServer(
  prepared: PreparedUploadedFile,
  _targetLanguage: CvLanguage,
  onProgress?: LocalProgressCallback
): Promise<ExtractedCertificateSummary> {
  return extractCertificateLocally(prepared, onProgress);
}

export async function requestExtractJobAdFromServer(
  prepared: PreparedUploadedFile,
  targetLanguage: CvLanguage,
  onProgress?: LocalProgressCallback
): Promise<ExtractedJobAdSummary> {
  return extractJobAdLocally(prepared, createBlankCvData(targetLanguage), onProgress);
}

export async function requestTailorCvFromServer(params: {
  cv: CvData;
  targetOrganization: string;
  targetSector: string;
  experienceLevel: string;
  jobDescriptionText: string;
  language: CvLanguage;
}): Promise<{ targetJobTitle: string; summary: string }> {
  return tailorCvLocally(params);
}
