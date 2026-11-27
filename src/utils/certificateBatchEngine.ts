import {
  AlignmentType,
  Document,
  Packer,
  PageBreak,
  PageOrientation,
  Paragraph,
  TextRun,
} from 'docx';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import {
  CertBatchRegistryEntry,
  CertificateKind,
  CertificateTemplateDef,
  CertRecipientRow,
} from '../types/certificates';
import { normalizeArabicTextStrict } from './cvSmartSuite';

const LS_CUSTOM_CERT_TEMPLATES_KEY = 'shamel_custom_cert_templates_v1';
const LS_CERT_BATCH_REGISTRY_KEY = 'shamel_cert_batch_registry_v1';

export function validateRecipientRow(row: CertRecipientRow): CertRecipientRow {
  const issues: string[] = [];
  if (!row.fullName.trim() || row.fullName.includes('[ غير موجود ]')) {
    issues.push('الاسم ناقص');
  }
  if (!row.dateStr.trim() || row.dateStr.includes('[ غير موجود ]')) {
    issues.push('التاريخ ناقص');
  }
  return {
    ...row,
    issues,
    status: issues.length === 0 ? 'valid' : 'incomplete',
  };
}

export function validateRecipientsBatch(rows: CertRecipientRow[]): {
  rows: CertRecipientRow[];
  readyCount: number;
  missingCount: number;
  summaryBadge: string;
} {
  const validated = rows.map(validateRecipientRow);
  const readyCount = validated.filter((r) => r.status === 'valid').length;
  const missingCount = validated.length - readyCount;
  const summaryBadge =
    missingCount === 0
      ? `جاهز ${readyCount} ✅ — جميع البيانات مكتملة`
      : `جاهز ${readyCount} ✅، ناقص ${missingCount} ⚠️`;
  return {
    rows: validated,
    readyCount,
    missingCount,
    summaryBadge,
  };
}

function pickCellValue(
  record: Record<string, unknown>,
  candidates: string[]
): string {
  const keys = Object.keys(record);
  for (const cand of candidates) {
    const exact = keys.find(
      (k) => k.trim().toLowerCase() === cand.toLowerCase()
    );
    if (exact !== undefined) {
      const val = String(record[exact] ?? '').trim();
      if (val) return val;
    }
  }
  for (const cand of candidates) {
    const partial = keys.find((k) =>
      k.trim().toLowerCase().includes(cand.toLowerCase())
    );
    if (partial !== undefined) {
      const val = String(record[partial] ?? '').trim();
      if (val) return val;
    }
  }
  return '';
}

export async function parseRecipientsFromExcelFile(
  file: File,
  fallbackRole = 'أخصائي تأهيل وتخاطب',
  fallbackDate = '2026/05/01'
): Promise<CertRecipientRow[]> {
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = workbook.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  });

  const mapped: CertRecipientRow[] = jsonRows
    .map((rec, idx) => {
      const fullName = pickCellValue(rec, [
        'الاسم الكامل',
        'الاسم',
        'اسم المتدرب',
        'اسم الموظف',
        'اسم الطالب',
        'Full Name',
        'fullName',
        'Name',
        'name',
      ]);
      const roleOrCourse =
        pickCellValue(rec, [
          'الوظيفة / الدورة',
          'الوظيفة',
          'الدورة',
          'البرنامج',
          'المسمى الوظيفي',
          'التخصص',
          'Role',
          'Course',
          'roleOrCourse',
        ]) || fallbackRole;
      const grade =
        pickCellValue(rec, ['التقدير', 'الدرجة', 'Grade', 'grade']) || 'امتياز';
      const dateStr =
        pickCellValue(rec, [
          'التاريخ',
          'تاريخ الإصدار',
          'تاريخ البداية',
          'Date',
          'dateStr',
          'date',
        ]) || fallbackDate;
      const phone = pickCellValue(rec, [
        'الهاتف',
        'واتساب',
        'رقم الجوال',
        'الجوال',
        'Phone',
        'WhatsApp',
        'phone',
      ]);
      const serial =
        pickCellValue(rec, ['الرقم التسلسلي', 'Serial', 'serial']) ||
        `CERT-2026-${String(idx + 1).padStart(3, '0')}`;

      return validateRecipientRow({
        id: `rec-xl-${Date.now()}-${idx}`,
        serial,
        fullName,
        roleOrCourse,
        grade,
        dateStr,
        phone,
        status: 'valid',
        issues: [],
      });
    })
    .filter(
      (r) =>
        Boolean(r.fullName.trim()) ||
        Boolean(r.phone.trim()) ||
        Boolean(r.roleOrCourse.trim())
    );

  return mapped;
}

export function parseRecipientsFromSmartText(
  rawText: string,
  fallbackRole = 'أخصائي تأهيل وتخاطب',
  fallbackDate = '2026/05/01'
): CertRecipientRow[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines
    .filter(
      (line) =>
        !/^(?:الاسم(?:\s+الكامل)?|م|#|name|full\s*name|serial)(?:\s*(?:\||\-|،|,|\t)|$)/i.test(
          line.replace(/^\d+[.\-)\s]+/, '')
        )
    )
    .map((line, idx) => {
      let working = line.replace(/^[\d٠-٩]+[.\-)\s]+/, '').trim();

      // Extract phone
      let phone = '';
      const phoneMatch = working.match(/(?:\+?2?0)?01[0-9]{9}|\+?\d{10,14}/);
      if (phoneMatch) {
        phone = phoneMatch[0].trim();
        working = working.replace(phoneMatch[0], ' ').trim();
      }

      // Extract date
      let dateStr = fallbackDate;
      const dateMatch = working.match(/\b\d{1,4}[\/\-]\d{1,2}[\/\-]\d{1,4}\b/);
      if (dateMatch) {
        dateStr = dateMatch[0].trim();
        working = working.replace(dateMatch[0], ' ').trim();
      }

      // Extract serial
      let serial = `CERT-2026-${String(idx + 1).padStart(3, '0')}`;
      const serialMatch = working.match(/\bCERT-[A-Z0-9\-]+\b/i);
      if (serialMatch) {
        serial = serialMatch[0].toUpperCase();
        working = working.replace(serialMatch[0], ' ').trim();
      }

      const parts = working
        .split(/\s*(?:\||—|–|-|،|,|\t)\s*/)
        .map((p) => p.trim())
        .filter(Boolean);

      const fullName = parts[0] || working.trim();
      const roleOrCourse = parts[1] || fallbackRole;
      const grade = parts[2] || 'امتياز';

      return validateRecipientRow({
        id: `rec-txt-${Date.now()}-${idx}`,
        serial,
        fullName,
        roleOrCourse,
        grade,
        dateStr,
        phone,
        status: 'valid',
        issues: [],
      });
    });
}

export function smartFixRecipientNames(
  rows: CertRecipientRow[]
): CertRecipientRow[] {
  return rows.map((row) => {
    const cleanedName = normalizeArabicTextStrict(
      row.fullName
        .replace(/[^\u0600-\u06FFa-zA-Z\s/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
    const cleanedRole = normalizeArabicTextStrict(row.roleOrCourse);
    const cleanedGrade = normalizeArabicTextStrict(row.grade || 'امتياز');
    return validateRecipientRow({
      ...row,
      fullName: cleanedName,
      roleOrCourse: cleanedRole,
      grade: cleanedGrade,
    });
  });
}

export function assignBatchSerials(
  rows: CertRecipientRow[],
  prefix = 'CERT-2026'
): CertRecipientRow[] {
  return rows.map((row, idx) =>
    validateRecipientRow({
      ...row,
      serial: `${prefix}-${String(idx + 1).padStart(3, '0')}`,
    })
  );
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function sanitizeFilenameSegment(raw: string): string {
  return (raw || 'مستلم')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function exportBatchSinglePdf(
  cardElements: HTMLElement[],
  filename: string
): Promise<void> {
  if (cardElements.length === 0) return;
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1123, 794],
    hotfixes: ['px_scaling'],
  });

  for (let i = 0; i < cardElements.length; i++) {
    const el = cardElements[i];
    const dataUrl = await toPng(el, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
    if (i > 0) {
      pdf.addPage([1123, 794], 'landscape');
    }
    pdf.addImage(dataUrl, 'PNG', 0, 0, 1123, 794);
  }

  pdf.save(filename);
}

export async function exportBatchZipPdfs(
  items: {
    el: HTMLElement;
    recipient: CertRecipientRow;
    kind: CertificateKind;
  }[],
  zipFilename: string
): Promise<void> {
  if (items.length === 0) return;
  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  for (const item of items) {
    const dataUrl = await toPng(item.el, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1123, 794],
      hotfixes: ['px_scaling'],
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, 1123, 794);
    const arrayBuf = pdf.output('arraybuffer');

    const prefix = item.kind === 'statement' ? 'إفادة' : 'شهادة';
    const baseName = `${prefix} - ${sanitizeFilenameSegment(item.recipient.fullName)}`;
    const count = (usedNames.get(baseName) || 0) + 1;
    usedNames.set(baseName, count);
    const finalPdfName = count > 1 ? `${baseName} (${count}).pdf` : `${baseName}.pdf`;
    zip.file(finalPdfName, arrayBuf);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(zipBlob, zipFilename);
}

export async function exportBatchPngsZip(
  items: {
    el: HTMLElement;
    recipient: CertRecipientRow;
    kind: CertificateKind;
  }[],
  zipFilename: string
): Promise<void> {
  if (items.length === 0) return;
  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  for (const item of items) {
    const dataUrl = await toPng(item.el, {
      pixelRatio: 2.2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
    const base64Data = dataUrl.split(',')[1] || '';
    const prefix = item.kind === 'statement' ? 'إفادة' : 'شهادة';
    const baseName = `${prefix} - ${sanitizeFilenameSegment(item.recipient.fullName)}`;
    const count = (usedNames.get(baseName) || 0) + 1;
    usedNames.set(baseName, count);
    const finalPngName = count > 1 ? `${baseName} (${count}).png` : `${baseName}.png`;
    zip.file(finalPngName, base64Data, { base64: true });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(zipBlob, zipFilename);
}

export async function exportBatchWordDocx(
  recipients: CertRecipientRow[],
  template: CertificateTemplateDef,
  filename: string
): Promise<void> {
  if (recipients.length === 0) return;
  const children: Paragraph[] = [];

  recipients.forEach((rec, idx) => {
    if (idx > 0) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }

    children.push(
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: `${template.rightEntityTitle}   —   ${template.leftEntityTitle}`,
            bold: true,
            size: 22,
            color: '1A237E',
            rightToLeft: true,
          }),
        ],
      }),
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: template.headerTitle,
            bold: true,
            size: 46,
            color: '1A237E',
            rightToLeft: true,
          }),
        ],
      }),
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: template.introLine,
            bold: true,
            size: 28,
            color: 'B71C1C',
            rightToLeft: true,
          }),
        ],
      }),
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: `الأستاذ / ${rec.fullName}`,
            bold: true,
            size: 34,
            color: '000000',
            rightToLeft: true,
          }),
        ],
      }),
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `${template.bodyParagraphBeforeName}  `,
            bold: true,
            size: 24,
            color: 'B71C1C',
            rightToLeft: true,
          }),
          new TextRun({
            text: `بوظيفة / برنامج: ${rec.roleOrCourse}  |  التقدير: ${rec.grade}  |  تاريخ: ${rec.dateStr}`,
            bold: true,
            size: 24,
            color: '000000',
            rightToLeft: true,
          }),
        ],
      }),
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: template.bodyParagraphAfterRole,
            size: 22,
            color: 'B71C1C',
            rightToLeft: true,
          }),
        ],
      }),
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: template.closingLine,
            bold: true,
            size: 24,
            color: 'B71C1C',
            rightToLeft: true,
          }),
        ],
      }),
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.LEFT,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `${template.signerTitle} ${template.signerName}`,
            bold: true,
            size: 26,
            color: '1A237E',
            rightToLeft: true,
          }),
        ],
      }),
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `الرقم التسلسلي: ${rec.serial}`,
            size: 18,
            color: '475569',
            rightToLeft: true,
          }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerBlobDownload(blob, filename);
}

export function buildWhatsAppMessageText(
  row: CertRecipientRow,
  kind: CertificateKind
): string {
  const docLabel = kind === 'statement' ? 'إفادتك' : 'شهادتك';
  return `مبروك يا ${row.fullName}، ${docLabel} جاهزة (${row.serial}) — ${row.roleOrCourse} بتاريخ ${row.dateStr}`;
}

export function buildWhatsAppUrl(
  row: CertRecipientRow,
  kind: CertificateKind
): string {
  const msg = encodeURIComponent(buildWhatsAppMessageText(row, kind));
  let digits = (row.phone || '').replace(/[^\d]/g, '');
  if (digits.startsWith('01') && digits.length === 11) {
    digits = `2${digits}`;
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  return digits ? `https://wa.me/${digits}?text=${msg}` : `https://wa.me/?text=${msg}`;
}

export function loadSavedCustomCertTemplates(): CertificateTemplateDef[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOM_CERT_TEMPLATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomCertTemplates(list: CertificateTemplateDef[]): void {
  try {
    localStorage.setItem(LS_CUSTOM_CERT_TEMPLATES_KEY, JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
}

export function loadCertBatchRegistry(): CertBatchRegistryEntry[] {
  try {
    const raw = localStorage.getItem(LS_CERT_BATCH_REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendCertBatchRegistryEntry(
  entry: CertBatchRegistryEntry
): CertBatchRegistryEntry[] {
  const existing = loadCertBatchRegistry();
  const next = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, 40);
  try {
    localStorage.setItem(LS_CERT_BATCH_REGISTRY_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
  return next;
}
