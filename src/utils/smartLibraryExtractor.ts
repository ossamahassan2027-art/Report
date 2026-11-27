import {
  ConfidenceBadge,
  ExtractionLineReview,
  LIBRARY_FOLDERS,
  LibraryCard,
  LibraryCategory,
  LibraryCondition,
  LibraryFolderId,
  SensitiveFinding,
  SmartExtractionResult,
} from '../types/library';
import {
  cleanExtractedDocumentText,
  fixPunctuationAndSpacing,
  fixSpellingInText,
  toStandardLatinDigits,
} from './smartAutoFormatter';
import { analyzeComplaintLocally } from './libraryEngine';
import { INITIAL_LIBRARY_CARDS_81 } from '../data/libraryCards81';

const LS_EXTRACTION_LEARNING_KEY = 'shamel_extraction_learning_log_v1';

export interface LearnedCorrectionEntry {
  id: string;
  wrong: string;
  correct: string;
  count: number;
  updatedAt: string;
}

export const FIXED_SCIENTIFIC_GLOSSARY: string[] = [
  'ADHD',
  'DSM-5-TR',
  'ICD-11',
  'ASD',
  'ABA',
  'ABAT',
  'IEP',
  'CARS-2',
  'M-CHAT-R',
  'GARS-3',
  'PECS',
  'AAC',
  'DRO',
  'DRA',
  'ABC',
  'ERP',
  'CBT',
  'OCD',
  'NIMH',
  'WHO',
  'CDC',
  'ASHA',
  'SMART',
  'WCPM',
  'MLU',
];

export function loadLearnedCorrections(): LearnedCorrectionEntry[] {
  try {
    const raw = localStorage.getItem(LS_EXTRACTION_LEARNING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLearnedCorrections(list: LearnedCorrectionEntry[]): void {
  localStorage.setItem(LS_EXTRACTION_LEARNING_KEY, JSON.stringify(list.slice(0, 120)));
}

export function recordLearnedCorrection(wrong: string, correct: string): LearnedCorrectionEntry[] {
  const w = wrong.trim();
  const c = correct.trim();
  if (!w || !c || w === c || w.length < 3 || c.length < 2) {
    return loadLearnedCorrections();
  }
  const existing = loadLearnedCorrections();
  const idx = existing.findIndex((item) => item.wrong === w);
  let next: LearnedCorrectionEntry[];
  if (idx >= 0) {
    next = existing.map((item, i) =>
      i === idx
        ? { ...item, correct: c, count: item.count + 1, updatedAt: new Date().toISOString().slice(0, 10) }
        : item
    );
  } else {
    next = [
      {
        id: `learn-${Date.now()}`,
        wrong: w,
        correct: c,
        count: 1,
        updatedAt: new Date().toISOString().slice(0, 10),
      },
      ...existing,
    ];
  }
  saveLearnedCorrections(next);
  return next;
}

// =========================================================================
// Stage A: Image Preprocessing Enhancement (Grayscale + High Contrast)
// =========================================================================
export async function enhanceImageFileForOcr(file: File): Promise<{
  enhancedFile: File;
  previewDataUrl: string;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const srcUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!srcUrl) {
        resolve({ enhancedFile: file, previewDataUrl: '' });
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 2000;
          const scale = Math.min(2, maxDim / Math.max(img.width, img.height, 1));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ enhancedFile: file, previewDataUrl: srcUrl });
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          // Grayscale + Contrast Boost for sharper Arabic/English OCR
          const contrast = 1.35;
          const intercept = 128 * (1 - contrast);
          for (let i = 0; i < data.length; i += 4) {
            const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const boosted = Math.max(0, Math.min(255, lum * contrast + intercept));
            data[i] = boosted;
            data[i + 1] = boosted;
            data[i + 2] = boosted;
          }
          ctx.putImageData(imgData, 0, 0);

          const enhancedPreview = canvas.toDataURL('image/png');
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({ enhancedFile: file, previewDataUrl: srcUrl });
                return;
              }
              const enhancedFile = new File([blob], `enhanced-${file.name}.png`, {
                type: 'image/png',
              });
              resolve({ enhancedFile, previewDataUrl: srcUrl });
            },
            'image/png',
            0.95
          );
          if (!enhancedPreview) {
            resolve({ enhancedFile: file, previewDataUrl: srcUrl });
          }
        } catch {
          resolve({ enhancedFile: file, previewDataUrl: srcUrl });
        }
      };
      img.onerror = () => resolve({ enhancedFile: file, previewDataUrl: srcUrl });
      img.src = srcUrl;
    };
    reader.onerror = () => resolve({ enhancedFile: file, previewDataUrl: '' });
    reader.readAsDataURL(file);
  });
}

// =========================================================================
// Stage B Helpers: UI Chrome Stripper, Confused Letters, Glossary Protection
// =========================================================================
const APP_UI_NOISE_RE =
  /^(?:Chat|Preview|Artifact|Vodafone|Orange|Etisalat|WE|VoLTE|4G|5G|Wi-?Fi|\d{1,2}:\d{2}\s*(?:AM|PM)?|\d{1,3}%|استخراج البيانات الآن|إلغاء|error:\s*\{.*)$/i;

function fixReversedOrMirroredText(line: string): { text: string; fixed: boolean } {
  let out = line.replace(/\)\s*([^()]+?)\s*\(/g, '($1)');
  // If line has isolated backwards spaced Arabic chars like "د ح و ت ل ا"
  const tokens = out.split(/\s+/);
  if (tokens.length >= 4 && tokens.filter((t) => t.length === 1 && /[\u0600-\u06FF]/.test(t)).length >= tokens.length * 0.7) {
    out = tokens.reverse().join('');
    return { text: out, fixed: true };
  }
  return { text: out, fixed: out !== line };
}

function protectScientificGlossary(text: string): {
  masked: string;
  restore: (s: string) => string;
} {
  let masked = text;
  const slots: { token: string; value: string }[] = [];
  FIXED_SCIENTIFIC_GLOSSARY.forEach((term, i) => {
    const re = new RegExp(`\\b${term.replace(/[-]/g, '\\-')}\\b`, 'gi');
    const token = `__TERM_${i}__`;
    if (re.test(masked)) {
      slots.push({ token, value: term });
      masked = masked.replace(re, token);
    }
  });
  return {
    masked,
    restore: (s: string) => {
      let res = s;
      slots.forEach(({ token, value }) => {
        res = res.split(token).join(value);
      });
      return res;
    },
  };
}

function completeKnownHeadingLine(line: string): string {
  const trimmed = line.trim();
  if (/^(الاعراض|الأعراض)$/i.test(trimmed)) return 'الأعراض والمؤشرات:';
  if (/^(الاسباب|الأسباب)$/i.test(trimmed)) return 'الأسباب والعوامل:';
  if (/^(الاهداف|الأهداف)$/i.test(trimmed)) return 'الأهداف العلاجية:';
  if (/^(التوصيات)$/i.test(trimmed)) return 'التوصيات:';
  if (/^(الانشطة|الأنشطة)$/i.test(trimmed)) return 'الأنشطة التطبيقية:';
  if (/^(المصدر|المراجع)$/i.test(trimmed)) return 'المصدر المرجعي:';
  return trimmed;
}

export function detectSensitiveData(text: string): SensitiveFinding[] {
  const findings: SensitiveFinding[] = [];
  const norm = toStandardLatinDigits(text);

  const phones = norm.match(/(?:\+?20|0020|0)?1[0125]\d{8}/g) || [];
  phones.forEach((p) =>
    findings.push({ type: 'phone', match: p, label: `رقم هاتف شخصي (${p})` })
  );

  const natIds = norm.match(/\b[23]\d{13}\b/g) || [];
  natIds.forEach((id) =>
    findings.push({ type: 'national-id', match: id, label: `رقم قومي محتمل (${id.slice(0, 4)}...)` })
  );

  const emails = text.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g) || [];
  emails.forEach((em) =>
    findings.push({ type: 'email', match: em, label: `بريد إلكتروني شخصي (${em})` })
  );

  const addrMatches = text.match(/(?:شارع|عمارة|دور|شقة)\s+[^\n،]{4,40}/g) || [];
  addrMatches.forEach((ad) =>
    findings.push({ type: 'address', match: ad, label: `عنوان تفصيلي (${ad.slice(0, 28)})` })
  );

  return findings;
}

function evaluateLineConfidence(original: string, cleaned: string): {
  confidence: ConfidenceBadge;
  issues: string[];
} {
  const issues: string[] = [];

  if (!cleaned || cleaned.length < 3) {
    return { confidence: 'unclear', issues: ['سطر قصير جداً أو غير مقروء'] };
  }

  // Strange symbols / high punctuation noise / mojibake ratio
  const strangeChars = (original.match(/[~`^|\\{}\[\]<>@#§¤■□◆◇●○▪▫]/g) || []).length;
  const wordTokens = cleaned.split(/\s+/).filter(Boolean);
  const singleGarbageTokens = wordTokens.filter((t) => t.length === 1 && /[^وابت]/.test(t)).length;

  if (strangeChars >= 4 || (wordTokens.length >= 4 && singleGarbageTokens >= wordTokens.length * 0.45)) {
    issues.push('رموز متقطعة أو تشوش واضح في القراءة');
    return { confidence: 'unclear', issues };
  }

  if (original !== cleaned) {
    issues.push('تم تصحيح الإملاء أو المسافات أو الأرقام آلياً');
    return { confidence: 'needs-review', issues };
  }

  return { confidence: 'confirmed', issues: [] };
}

// =========================================================================
// Full 5-Stage Pipeline: runSmartAttachmentExtraction
// =========================================================================
export function runSmartAttachmentExtraction(params: {
  rawText: string;
  sourceLabel?: string;
  sourceImagePreview?: string;
  existingCards?: LibraryCard[];
}): SmartExtractionResult {
  const { rawText, sourceLabel = 'مرفق مستورد', sourceImagePreview, existingCards } = params;
  const learnedRules = loadLearnedCorrections();

  const rawLines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const seenLines = new Set<string>();
  const lineReviews: ExtractionLineReview[] = [];
  const errorReport: string[] = [];
  let appliedLearnedRulesCount = 0;

  let seq = 0;
  for (const rawLine of rawLines) {
    const trimmedRaw = rawLine.trim();
    if (!trimmedRaw) continue;

    // Strip UI chrome lines (Stage B)
    if (APP_UI_NOISE_RE.test(trimmedRaw)) {
      errorReport.push(`حُذف سطر واجهة تطبيق غير مرتبط بالمحتوى: "${trimmedRaw.slice(0, 40)}"`);
      continue;
    }

    // Strip [...] and control symbols
    let work = trimmedRaw
      .replace(/\[\s*\.{2,}\s*\]/g, '')
      .replace(/[\u0000-\u001F\uFFFD■□◆◇●○▪▫]/g, ' ')
      .trim();
    if (!work) continue;

    // Apply Self-Learning Corrections Log
    learnedRules.forEach((rule) => {
      if (work.includes(rule.wrong)) {
        work = work.split(rule.wrong).join(rule.correct);
        appliedLearnedRulesCount += 1;
      }
    });

    // Fix reversed RTL or mirrored brackets
    const revRes = fixReversedOrMirroredText(work);
    work = revRes.text;

    // Protect scientific terms before Arabic/EN normalization
    const { masked, restore } = protectScientificGlossary(work);
    let normalized = cleanExtractedDocumentText(masked);
    normalized = fixSpellingInText(normalized);
    normalized = fixPunctuationAndSpacing(normalized);
    normalized = toStandardLatinDigits(normalized);
    normalized = restore(normalized);
    normalized = completeKnownHeadingLine(normalized);

    // Fix phone & email spacing
    normalized = normalized.replace(/([A-Za-z0-9._%+\-]+)\s*@\s*([A-Za-z0-9.\-]+\.[A-Za-z]{2,})/g, '$1@$2');

    // Deduplicate identical cleaned lines (Stage B)
    const sig = normalized.toLowerCase();
    if (seenLines.has(sig)) {
      errorReport.push(`حُذف سطر مكرر: "${normalized.slice(0, 45)}"`);
      continue;
    }
    seenLines.add(sig);

    seq += 1;
    const { confidence, issues } = evaluateLineConfidence(trimmedRaw, normalized);
    if (revRes.fixed) issues.push('تم تعديل اتجاه النص والأقواس');

    lineReviews.push({
      id: `ext-line-${seq}`,
      lineNumber: seq,
      originalText: trimmedRaw,
      cleanedText: normalized,
      confidence,
      issues,
      accepted: confidence !== 'unclear',
    });
  }

  const cleanedFullText = lineReviews.map((l) => l.cleanedText).join('\n');
  const sensitiveFindings = detectSensitiveData(cleanedFullText);

  if (sensitiveFindings.length > 0) {
    errorReport.push(
      `تنبيه خصوصية: تم رصد ${sensitiveFindings.length} بيانات شخصية حساسة (هاتف/بريد/رقم قومي) يُستحسن حذفها قبل الحفظ كبطاقة مكتبة عامة.`
    );
  }

  const confirmedCount = lineReviews.filter((l) => l.confidence === 'confirmed').length;
  const reviewCount = lineReviews.filter((l) => l.confidence === 'needs-review').length;
  const unclearCount = lineReviews.filter((l) => l.confidence === 'unclear').length;

  // Quality Gate (Stage E): block saving if more than 3 lines are unclear
  const qualityBlocked = unclearCount > 3;

  // Stage D: Build Suggested Unified Card + Suggest Folder / Condition / Category / Keywords
  const suggestedCard = buildSuggestedCardFromLines(
    lineReviews.map((l) => l.cleanedText),
    cleanedFullText,
    sourceLabel,
    sourceImagePreview,
    existingCards || INITIAL_LIBRARY_CARDS_81
  );

  return {
    rawOriginalText: rawText,
    cleanedFullText,
    lines: lineReviews,
    errorReport,
    sensitiveFindings,
    confirmedCount,
    reviewCount,
    unclearCount,
    qualityBlocked,
    suggestedCard,
    appliedLearnedRulesCount,
    sourceImagePreview,
  };
}

export function rebuildExtractionStatsFromLines(lines: ExtractionLineReview[]): {
  confirmedCount: number;
  reviewCount: number;
  unclearCount: number;
  qualityBlocked: boolean;
  cleanedFullText: string;
} {
  const confirmedCount = lines.filter((l) => l.confidence === 'confirmed').length;
  const reviewCount = lines.filter((l) => l.confidence === 'needs-review').length;
  const unclearCount = lines.filter((l) => l.confidence === 'unclear').length;
  return {
    confirmedCount,
    reviewCount,
    unclearCount,
    qualityBlocked: unclearCount > 3,
    cleanedFullText: lines.map((l) => l.cleanedText).join('\n'),
  };
}

export function buildSuggestedCardFromLines(
  cleanLines: string[],
  fullText: string,
  sourceLabel: string,
  sourceImagePreview: string | undefined,
  existingCards: LibraryCard[]
): LibraryCard {
  const analysis = analyzeComplaintLocally(fullText, existingCards);
  const topCard = analysis.top5[0]?.card;

  const suggestedCondition: LibraryCondition = analysis.suggestedCondition || 'كل الحالات';
  let suggestedFolder: LibraryFolderId = topCard?.folder || 'awareness';
  if (/تخاطب|نطق|لدغة|تلعثم|لغة/.test(fullText)) suggestedFolder = 'speech';
  else if (/ديسلكسيا|عسر|قراءة|كتابة|حساب|صعوبات تعلم/.test(fullText)) suggestedFolder = 'learning';
  else if (/ADHD|فرط حركة|تشتت|اندفاع/.test(fullText)) suggestedFolder = 'adhd';
  else if (/توحد|طيف|رفرفة|حسي|PECS/.test(fullText)) suggestedFolder = 'autism';
  else if (/قلق|وسواس|OCD|خوف/.test(fullText)) suggestedFolder = 'anxiety-ocd';
  else if (/مقياس|استمارة|اختبار|تقييم|CARS|M-CHAT/.test(fullText)) suggestedFolder = 'scales';
  else if (/تعزيز|سلوك|أسري|عناد|غضب/.test(fullText)) suggestedFolder = 'behavior-family';

  let suggestedCategory: LibraryCategory = 'حالة';
  if (/مقارنة|الفرق بين|مقابل/.test(fullText)) suggestedCategory = 'مقارنة';
  else if (/برنامج|خطة|جلسات|تدريب/.test(fullText)) suggestedCategory = 'برنامج تدريبي';
  else if (/حل|علاج عملي|خطوات سريعة/.test(fullText)) suggestedCategory = 'حل';
  else if (/إرشاد أسري|ولي الأمر|البيت|الأسرة/.test(fullText)) suggestedCategory = 'إرشاد أسري';
  else if (/مقياس|درجة|فحص|استمارة/.test(fullText)) suggestedCategory = 'مقياس';
  else if (/توعية|دليل|حقوق|ميثاق/.test(fullText)) suggestedCategory = 'توعية';

  const titleCandidate =
    cleanLines.find((l) => l.length >= 6 && l.length <= 75 && !l.endsWith(':')) ||
    `بطاقة مستخرجة: ${sourceLabel}`;

  const collectAfterHeading = (headingRe: RegExp): string[] => {
    const idx = cleanLines.findIndex((l) => headingRe.test(l));
    if (idx < 0) return [];
    const items: string[] = [];
    for (let i = idx + 1; i < Math.min(cleanLines.length, idx + 7); i++) {
      const l = cleanLines[i];
      if (/^(?:الأعراض|الأسباب|الأهداف|الأنشطة|التوصيات|المصدر|القياس)/.test(l) && l.endsWith(':')) break;
      items.push(l.replace(/^[•\-*\d.)]+\s*/, '').trim());
    }
    return items.filter(Boolean);
  };

  const symptoms = collectAfterHeading(/الأعراض|المؤشرات/);
  const causes = collectAfterHeading(/الأسباب|العوامل/);
  const goals = collectAfterHeading(/الأهداف/);
  const recs = collectAfterHeading(/التوصيات/);

  const fallbackBody = cleanLines.slice(1, 6).join(' · ') || fullText.slice(0, 260);
  const folderMeta = LIBRARY_FOLDERS.find((f) => f.id === suggestedFolder);

  return {
    id: `lib-ext-${Date.now()}`,
    title: titleCandidate.replace(/^[:\-•\s]+/, ''),
    category: suggestedCategory,
    condition: suggestedCondition,
    folder: suggestedFolder,
    ageRange: '3 - 14 سنة',
    definition: fallbackBody || 'بطاقة معرفية وتطبيقية مفرّغة ومراجعة من مرفق المركز.',
    symptoms: symptoms.length > 0 ? symptoms : cleanLines.slice(1, 4),
    causes: causes.length > 0 ? causes : ['مستخرج من المرفق بعد المراجعة والتحقق'],
    differential: ['تمت المراجعة الأولية والتحقق من اتساق المحتوى مع القالب الموحد للمكتبة'],
    goals: goals.length > 0 ? goals : ['تطبيق المحاور الأساسية الواردة في البطاقة المفرغة'],
    goalsSMART:
      goals.length > 0
        ? goals.map((g) => `${g} بنسبة إتقان 80% خلال 6 أسابيع.`)
        : ['تحقيق تحسن ملحوظ بنسبة 80% في المهارات المستهدفة خلال 6 أسابيع.'],
    activities: [
      {
        name: `نشاط تطبيقي: ${titleCandidate.slice(0, 35)}`,
        tools: 'بطاقات العمل والأدوات المتاحة بالجلسة والمنزل',
        steps:
          cleanLines.length >= 3
            ? cleanLines.slice(0, 3)
            : ['تهيئة البيئة الهادئة', 'تطبيق النشاط خطوة بخطوة مع تعزيز فوري'],
        duration: '20 دقيقة',
        success: 'تنفيذ الخطوات المطلوبة في 4 من كل 5 محاولات',
      },
    ],
    recommendationsFamily:
      recs.length > 0 ? recs.slice(0, 3) : ['متابعة التطبيق المنزلي الهادئ وفق إرشادات الأخصائي'],
    recommendationsSchool: ['تنسيق الترتيبات الصفية الداعمة مع معلم الفصل'],
    recommendationsSpecialist: [
      `حفظ في ملف (${folderMeta?.title || suggestedFolder}) وقياس التقدم كل 4 أسابيع`,
    ],
    measurement: 'متابعة أسبوعية لمعدل تحقق الأهداف ونسبة الاستجابة',
    keywords: Array.from(
      new Set([
        suggestedCondition,
        folderMeta?.title || '',
        ...analysis.expandedKeywords.slice(0, 5),
      ].filter(Boolean))
    ),
    relatedIds: topCard ? [topCard.id] : [],
    source: `مرفق مراجع ومفرغ: ${sourceLabel}`,
    image: sourceImagePreview,
    sourceAttachmentRef: sourceLabel,
    pinned: false,
    createdAt: new Date().toISOString().slice(0, 10),
  };
}
