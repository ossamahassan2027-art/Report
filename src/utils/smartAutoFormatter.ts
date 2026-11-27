import { DEFAULT_SECTION_ORDER, BlockStyleOverride } from '../types/clickEdit';
import { CvData, CvLanguage, CvTemplateId } from '../types/cv';
import { ReportData, ReportLanguage } from '../types/report';
import {
  AutoFormatSettings,
  EvaluationFormEntry,
  ReportExtras,
  ThemeSettings,
  WeeklyTaskItem,
} from '../types/studio';
import { applySafeAtsFixes, normalizeDateString, runAtsComplianceAudit } from './cvAtsEngine';

export type SmartFormatScope = 'report' | 'cv' | 'tasks' | 'evaluations' | 'plan-recs';

export interface SmartFormatFixItem {
  id: string;
  category:
    | 'إملاء ونحو'
    | 'علامات الترقيم والمسافات'
    | 'الخطوط والألوان والأحجام'
    | 'التواريخ والأرقام'
    | 'العناوين والأقسام'
    | 'الجداول والقوائم'
    | 'طول المستند و ATS';
  count: number;
  beforeExample: string;
  afterExample: string;
  status: 'تم ✓' | 'يحتاج مراجعة يدوية';
  warningMessage?: string;
}

export interface SmartFormatBundlePayload {
  reportData?: ReportData;
  reportExtras?: ReportExtras;
  themeSettings?: ThemeSettings;
  cvData?: CvData;
  tasks?: WeeklyTaskItem[];
  evaluations?: EvaluationFormEntry[];
}

export interface SmartFormatAnalysisResult {
  scope: SmartFormatScope;
  fixes: SmartFormatFixItem[];
  totalFixCount: number;
  hasManualWarnings: boolean;
  atsScoreBefore?: number;
  atsScoreAfter?: number;
  cvPageRecommendation?: 'single-page' | 'two-pages';
  cvYearsDetected?: number;
  isReportLong?: boolean;
  originalSnapshot: SmartFormatBundlePayload;
  formattedPayload: SmartFormatBundlePayload;
  perCategoryPayloads: Record<string, SmartFormatBundlePayload>;
  previewOriginalLines: { label: string; text: string }[];
  previewFormattedLines: { label: string; text: string }[];
}

const AR_SPELLING_RULES: [RegExp, string][] = [
  [/(^|\s)ادارة(?=\s|$|[،.:\-])/g, '$1إدارة'],
  [/(^|\s)الادارة(?=\s|$|[،.:\-])/g, '$1الإدارة'],
  [/(^|\s)اداري(?=\s|$|[،.:\-])/g, '$1إداري'],
  [/(^|\s)اداري[ةه](?=\s|$|[،.:\-])/g, '$1إدارية'],
  [/(^|\s)اخصائي(?=\s|$|[،.:\-])/g, '$1أخصائي'],
  [/(^|\s)اخصائيه(?=\s|$|[،.:\-])/g, '$1أخصائية'],
  [/(^|\s)اكثر(?=\s|$|[،.:\-])/g, '$1أكثر'],
  [/(^|\s)اسامة(?=\s|$|[،.:\-])/g, '$1أسامة'],
  [/(^|\s)اسامه(?=\s|$|[،.:\-])/g, '$1أسامة'],
  [/(^|\s)احمد(?=\s|$|[،.:\-])/g, '$1أحمد'],
  [/(^|\s)ابراهيم(?=\s|$|[،.:\-])/g, '$1إبراهيم'],
  [/(^|\s)انجاز(?=\s|$|[،.:\-])/g, '$1إنجاز'],
  [/(^|\s)ابداع(?=\s|$|[،.:\-])/g, '$1إبداع'],
  [/(^|\s)ارشاد(?=\s|$|[،.:\-])/g, '$1إرشاد'],
  [/(^|\s)الارشاد(?=\s|$|[،.:\-])/g, '$1الإرشاد'],
  [/(^|\s)اشراف(?=\s|$|[،.:\-])/g, '$1إشراف'],
  [/(^|\s)الاشراف(?=\s|$|[،.:\-])/g, '$1الإشراف'],
  [/(^|\s)استاذ(?=\s|$|[،.:\-])/g, '$1أستاذ'],
  [/(^|\s)الي(?=\s|$|[،.:\-])/g, '$1إلى'],
  [/(^|\s)حتي(?=\s|$|[،.:\-])/g, '$1حتى'],
  [/(^|\s)متي(?=\s|$|[،.:\-])/g, '$1متى'],
  [/(^|\s)لدي(?=\s|$|[،.:\-])/g, '$1لدى'],
  [/(^|\s)تاهيل(?=\s|$|[،.:\-])/g, '$1تأهيل'],
  [/(^|\s)التاهيل(?=\s|$|[،.:\-])/g, '$1التأهيل'],
  [/(^|\s)الاسكندرية(?=\s|$|[،.:\-])/g, '$1الإسكندرية'],
  [/(^|\s)الاسكندريه(?=\s|$|[،.:\-])/g, '$1الإسكندرية'],
  [/(^|\s)الامارات(?=\s|$|[،.:\-])/g, '$1الإمارات'],
  [/(^|\s)الان(?=\s|$|[،.:\-])/g, '$1الآن'],
  [/(^|\s)مسئول(?=\s|$|[،.:\-])/g, '$1مسؤول'],
  [/(^|\s)مسئولة(?=\s|$|[،.:\-])/g, '$1مسؤولة'],
  [/(^|\s)شئون(?=\s|$|[،.:\-])/g, '$1شؤون'],
  [/(^|\s)خبره(?=\s|$|[،.:\-])/g, '$1خبرة'],
  [/(^|\s)الخبره(?=\s|$|[،.:\-])/g, '$1الخبرة'],
  [/(^|\s)حاله(?=\s|$|[،.:\-])/g, '$1حالة'],
  [/(^|\s)الحاله(?=\s|$|[،.:\-])/g, '$1الحالة'],
  [/(^|\s)خطه(?=\s|$|[،.:\-])/g, '$1خطة'],
  [/(^|\s)الخطه(?=\s|$|[،.:\-])/g, '$1الخطة'],
  [/(^|\s)شهاده(?=\s|$|[،.:\-])/g, '$1شهادة'],
  [/(^|\s)الشهاده(?=\s|$|[،.:\-])/g, '$1الشهادة'],
  [/(^|\s)جامعه(?=\s|$|[،.:\-])/g, '$1جامعة'],
  [/(^|\s)الجامعه(?=\s|$|[،.:\-])/g, '$1الجامعة'],
  [/(^|\s)مدرسه(?=\s|$|[،.:\-])/g, '$1مدرسة'],
  [/(^|\s)المدرسه(?=\s|$|[،.:\-])/g, '$1المدرسة'],
  [/(^|\s)مؤسسه(?=\s|$|[،.:\-])/g, '$1مؤسسة'],
  [/(^|\s)المؤسسه(?=\s|$|[،.:\-])/g, '$1المؤسسة'],
  [/(^|\s)توصيه(?=\s|$|[،.:\-])/g, '$1توصية'],
  [/(^|\s)التوصيه(?=\s|$|[،.:\-])/g, '$1التوصية'],
  [/(^|\s)التربويه(?=\s|$|[،.:\-])/g, '$1التربوية'],
  [/(^|\s)السلوكيه(?=\s|$|[،.:\-])/g, '$1السلوكية'],
  [/(^|\s)المهنيه(?=\s|$|[،.:\-])/g, '$1المهنية'],
  [/(^|\s)العربيه(?=\s|$|[،.:\-])/g, '$1العربية'],
  [/(^|\s)الانجليزيه(?=\s|$|[،.:\-])/g, '$1الإنجليزية'],
  [/(^|\s)الإنجليزية(?=\s|$|[،.:\-])/g, '$1الإنجليزية'],
  [/(^|\s)الانجليزية(?=\s|$|[،.:\-])/g, '$1الإنجليزية'],
  [/(^|\s)(ال)?تطبيقى(?=\s|$|[،.:\-])/g, '$1$2تطبيقي'],
  [/(^|\s)(ال)?سلوكى(?=\s|$|[،.:\-])/g, '$1$2سلوكي'],
  [/(^|\s)(ال)?وظيفى(?=\s|$|[،.:\-])/g, '$1$2وظيفي'],
  [/(^|\s)(ال)?حركى(?=\s|$|[،.:\-])/g, '$1$2حركي'],
  [/(^|\s)(ال)?تربوى(?=\s|$|[،.:\-])/g, '$1$2تربوي'],
  [/(^|\s)(ال)?مهنى(?=\s|$|[،.:\-])/g, '$1$2مهني'],
  [/(^|\s)(ال)?دولى(?=\s|$|[،.:\-])/g, '$1$2دولي'],
  [/(^|\s)(ال)?فنى(?=\s|$|[،.:\-])/g, '$1$2فني'],
  [/(^|\s)(ال)?نفسى(?=\s|$|[،.:\-])/g, '$1$2نفسي'],
  [/(^|\s)(ال)?صحى(?=\s|$|[،.:\-])/g, '$1$2صحي'],
  [/(^|\s)(ال)?تعليمى(?=\s|$|[،.:\-])/g, '$1$2تعليمي'],
  [/(^|\s)(ال)?تأهيلى(?=\s|$|[،.:\-])/g, '$1$2تأهيلي'],
  [/(^|\s)(ال)?تاهيلى(?=\s|$|[،.:\-])/g, '$1$2تأهيلي'],
  [/(^|\s)اسرى(?=\s|$|[،.:\-])/g, '$1أسري'],
  [/(^|\s)الاسرى(?=\s|$|[،.:\-])/g, '$1الأسري'],
  [/(^|\s)(ال)?علاجى(?=\s|$|[،.:\-])/g, '$1$2علاجي'],
  [/(^|\s)(ال)?عربى(?=\s|$|[،.:\-])/g, '$1$2عربي'],
  [/(^|\s)(ال)?مصرى(?=\s|$|[،.:\-])/g, '$1$2مصري'],
];

const EN_PROPER_RULES: [RegExp, string][] = [
  [/\bats\b/gi, 'ATS'],
  [/\babat\b/gi, 'ABAT'],
  [/\baba\b/gi, 'ABA'],
  [/\biep\b/gi, 'IEP'],
  [/\badhd\b/gi, 'ADHD'],
  [/\bcv\b/gi, 'CV'],
  [/\bword\b/gi, 'Word'],
  [/\bexcel\b/gi, 'Excel'],
  [/\bpower\s*point\b/gi, 'PowerPoint'],
  [/\bosama\b/gi, 'Osama'],
  [/\begypt\b/gi, 'Egypt'],
  [/\bcairo\b/gi, 'Cairo'],
  [/\bdamanhour\b/gi, 'Damanhour'],
];

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toStandardLatinDigits(val: string): string {
  let out = val;
  ARABIC_INDIC_DIGITS.forEach((d, idx) => {
    out = out.replace(new RegExp(d, 'g'), String(idx));
  });
  return out;
}

export function cleanExtractedDocumentText(raw: string): string {
  if (!raw) return '';
  let text = raw
    // Strip control / replacement / weird box characters from PDF/OCR
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD■□◆◇●○▪▫]/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Rejoin broken mid-sentence lines where previous line doesn't end with punctuation
  const rawLines = text.split('\n').map((l) => l.trim());
  const rejoined: string[] = [];
  for (const line of rawLines) {
    if (!line) {
      if (rejoined.length > 0 && rejoined[rejoined.length - 1] !== '') {
        rejoined.push('');
      }
      continue;
    }
    const prev = rejoined[rejoined.length - 1];
    const isListOrHeading = /^([•\-*\d]|[\p{L}\s]{2,32}:)/u.test(line);
    const prevIsShortLabeled = Boolean(prev && /^[\p{L}\s]{2,28}:/u.test(prev) && prev.length < 85);
    if (
      prev &&
      prev !== '' &&
      prev.length > 25 &&
      !/[.!؟:؛\])]$/.test(prev) &&
      !isListOrHeading &&
      !prevIsShortLabeled &&
      line.length > 15
    ) {
      rejoined[rejoined.length - 1] = `${prev} ${line}`;
    } else {
      rejoined.push(line);
    }
  }
  text = rejoined.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

export function fixSpellingInText(text: string): string {
  if (!text || text.trim() === '[ ... ]') return text;
  let out = text;

  for (const [pattern, replacement] of AR_SPELLING_RULES) {
    out = out.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of EN_PROPER_RULES) {
    out = out.replace(pattern, replacement);
  }

  // Capitalize first Latin letter at sentence boundaries (skip emails & URLs)
  out = out.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix: string, ch: string) => {
    return `${prefix}${ch.toUpperCase()}`;
  });

  return out;
}

export function fixPunctuationAndSpacing(text: string): string {
  if (!text || text.trim() === '[ ... ]') return text;
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const cleanedLines = lines.map((line) => {
    let l = line.replace(/[ \t]{2,}/g, ' ').trim();
    // Do not break URLs or emails or ellipsis placeholder [ ... ]
    if (l.includes('[ ... ]')) {
      l = l.replace(/\[\s*\.\.\.\s*\]/g, '[ ... ]');
    }
    // Remove spaces right before punctuation (except inside [ ... ])
    l = l.replace(/(?<!\[)\s+([،,.؛:؟!])/g, '$1');
    // Ensure a single space after comma / Arabic semicolon / colon when followed by a word (skip URLs http:)
    l = l.replace(/([،؛؟!])([^\s\d"'»)\]}])/g, '$1 $2');
    l = l.replace(/([^\d/]):([^\s/\d])/g, '$1: $2');
    // Normalize Arabic question mark if paired with Arabic text
    l = l.replace(/([\u0600-\u06FF])\?/g, '$1؟');
    // Normalize dash spacing between words (keep negative numbers / dates intact)
    l = l.replace(/\s+[–—]\s+/g, ' - ');
    return l.trim();
  });

  // Collapse repeated empty lines to max 1 blank line
  const collapsed: string[] = [];
  for (const l of cleanedLines) {
    if (l === '' && collapsed[collapsed.length - 1] === '') continue;
    collapsed.push(l);
  }
  return collapsed.join('\n').trim();
}

export function normalizeNumbersAndDatesInText(text: string): string {
  if (!text || text.trim() === '[ ... ]') return text;
  let out = toStandardLatinDigits(text);
  // Normalize percentage spacing: "85 %" -> "85%"
  out = out.replace(/(\d+)\s+%/g, '$1%');
  // Normalize YYYY-MM-DD -> YYYY/MM/DD when not in phone numbers
  out = out.replace(/\b((?:19|20)\d{2})-(\d{1,2})-(\d{1,2})\b/g, (_, y: string, m: string, d: string) => {
    return `${y}/${m.padStart(2, '0')}/${d.padStart(2, '0')}`;
  });
  return out;
}

export function normalizeListLine(line: string, preferNumbered = false, idx = 0): string {
  const trimmed = line.trim();
  if (!trimmed || trimmed === '[ ... ]') return trimmed;
  const stripped = trimmed.replace(/^([•●▪■*\-–—]+|\d+[.)-])\s*/, '').trim();
  if (!stripped) return trimmed;
  if (preferNumbered) {
    return `${idx + 1}. ${stripped}`;
  }
  return `• ${stripped}`;
}

export function detectDateRangeConflicts(dateStr: string): string | null {
  const norm = toStandardLatinDigits(dateStr).trim();
  if (!norm || norm === '[ ... ]') return null;

  // Match MM/YYYY - MM/YYYY or YYYY - YYYY
  const twoDates = norm.match(
    /(?:(\d{1,2})\/)?((?:19|20)\d{2})\s*[-–—]\s*(?:(\d{1,2})\/)?((?:19|20)\d{2})/
  );
  if (twoDates) {
    const startMonth = twoDates[1] ? Number(twoDates[1]) : 1;
    const startYear = Number(twoDates[2]);
    const endMonth = twoDates[3] ? Number(twoDates[3]) : 12;
    const endYear = Number(twoDates[4]);
    const startVal = startYear * 12 + startMonth;
    const endVal = endYear * 12 + endMonth;
    if (endVal < startVal) {
      return `يوجد تضارب في [ ${dateStr} ]: تاريخ الانتهاء (${twoDates[3] ? `${twoDates[3]}/` : ''}${endYear}) قبل تاريخ البدء (${twoDates[1] ? `${twoDates[1]}/` : ''}${startYear})`;
    }
  }
  return null;
}

export function estimateCvExperienceYears(cv: CvData): number {
  const currentYear = new Date().getFullYear();
  let minStart = currentYear;
  let maxEnd = 0;

  cv.experiences.forEach((exp) => {
    const norm = toStandardLatinDigits(exp.dateRange);
    const years = Array.from(norm.matchAll(/(19|20)\d{2}/g)).map((m) => Number(m[0]));
    if (years.length > 0) {
      minStart = Math.min(minStart, years[0]);
      if (/(حتى الآن|الآن|present|current|now)/i.test(norm)) {
        maxEnd = Math.max(maxEnd, currentYear);
      } else {
        maxEnd = Math.max(maxEnd, years[years.length - 1]);
      }
    }
  });

  if (maxEnd >= minStart && minStart < currentYear) {
    return Math.max(1, maxEnd - minStart);
  }
  return Math.max(1, cv.experiences.length * 2);
}

export function formatSingleTextBlock(
  text: string,
  options?: { spellCheck?: boolean; punctuation?: boolean; dates?: boolean }
): { formatted: string; changesCount: number; warnings: string[] } {
  const spellCheck = options?.spellCheck ?? true;
  const punctuation = options?.punctuation ?? true;
  const dates = options?.dates ?? true;

  let next = cleanExtractedDocumentText(text);
  let changes = 0;

  if (spellCheck) {
    const afterSpell = fixSpellingInText(next);
    if (afterSpell !== next) changes += 1;
    next = afterSpell;
  }
  if (punctuation) {
    const afterPunct = fixPunctuationAndSpacing(next);
    if (afterPunct !== next) changes += 1;
    next = afterPunct;
  }
  if (dates) {
    const afterDates = normalizeNumbersAndDatesInText(next);
    if (afterDates !== next) changes += 1;
    next = afterDates;
  }

  const warnings: string[] = [];
  const conflict = detectDateRangeConflicts(next);
  if (conflict) warnings.push(conflict);

  return { formatted: next, changesCount: changes, warnings };
}

function normalizeTaskDay(day: string): string {
  const d = day.trim();
  if (/سبت/i.test(d)) return 'السبت';
  if (/احد|أحد/i.test(d)) return 'الأحد';
  if (/اثنين|إثنين/i.test(d)) return 'الإثنين';
  if (/ثلاثاء/i.test(d)) return 'الثلاثاء';
  if (/اربعاء|أربعاء/i.test(d)) return 'الأربعاء';
  if (/خميس/i.test(d)) return 'الخميس';
  if (/جمعة|جمعه/i.test(d)) return 'الجمعة';
  if (/يومي/i.test(d)) return 'يومي';
  return d || 'السبت';
}

function normalizeTaskStatus(status: string): string {
  const s = status.trim();
  if (/^(تم|مكتمل|منجز|done|completed)$/i.test(s)) return 'تم';
  if (/^(جزئي|قيد|جاري|partial|in progress)$/i.test(s)) return 'جزئي';
  if (/^(لم يتم|مجدول|معلق|ملغى|pending|not done)$/i.test(s)) return 'لم يتم';
  return 'لم يتم';
}

export function analyzeAndBuildSmartFormat(params: {
  scope: SmartFormatScope;
  settings: AutoFormatSettings;
  reportData?: ReportData;
  reportLanguage?: ReportLanguage;
  reportExtras?: ReportExtras;
  themeSettings?: ThemeSettings;
  cvData?: CvData;
  cvLanguage?: CvLanguage;
  cvTemplateId?: CvTemplateId;
}): SmartFormatAnalysisResult {
  const {
    scope,
    settings,
    reportData,
    reportExtras,
    themeSettings,
    cvData,
    cvLanguage = 'ar',
    cvTemplateId = 'ats-classic',
  } = params;

  const fixes: SmartFormatFixItem[] = [];
  const perCategoryPayloads: Record<string, SmartFormatBundlePayload> = {};

  // --------------------------------------------------------------------------
  // SCOPE: CV
  // --------------------------------------------------------------------------
  if (scope === 'cv' && cvData) {
    const originalCv: CvData = JSON.parse(JSON.stringify(cvData));
    let workingCv: CvData = JSON.parse(JSON.stringify(cvData));

    const atsBefore = runAtsComplianceAudit(originalCv, cvLanguage, cvTemplateId).score;

    // 1. Spelling
    let spellCount = 0;
    let spellBeforeEx = '';
    let spellAfterEx = '';
    const applySpellToCv = (src: CvData): CvData => {
      const c: CvData = JSON.parse(JSON.stringify(src));
      const patch = (val: string) => {
        const res = fixSpellingInText(val);
        if (res !== val) {
          spellCount += 1;
          if (!spellBeforeEx) {
            spellBeforeEx = val.slice(0, 60);
            spellAfterEx = res.slice(0, 60);
          }
        }
        return res;
      };
      c.fullName = patch(c.fullName);
      c.targetJobTitle = patch(c.targetJobTitle);
      c.location = patch(c.location);
      c.summary = patch(c.summary);
      c.experiences = c.experiences.map((e) => ({
        ...e,
        jobTitle: patch(e.jobTitle),
        company: patch(e.company),
        location: patch(e.location),
        bullets: e.bullets.map(patch),
      }));
      c.education = c.education.map((e) => ({
        ...e,
        degree: patch(e.degree),
        institution: patch(e.institution),
        details: patch(e.details),
      }));
      c.skills = c.skills.map((s) => ({ ...s, name: patch(s.name), level: patch(s.level) }));
      c.certifications = c.certifications.map((cert) => ({
        ...cert,
        name: patch(cert.name),
        issuer: patch(cert.issuer),
      }));
      c.trainings = c.trainings.map((t) => ({
        ...t,
        title: patch(t.title),
        provider: patch(t.provider),
      }));
      return c;
    };

    if (settings.spellCheck) {
      const spellOnly = applySpellToCv(originalCv);
      workingCv = applySpellToCv(workingCv);
      if (spellCount > 0) {
        const fixId = 'fix-cv-spell';
        fixes.push({
          id: fixId,
          category: 'إملاء ونحو',
          count: spellCount,
          beforeExample: spellBeforeEx,
          afterExample: spellAfterEx,
          status: 'تم ✓',
        });
        perCategoryPayloads[fixId] = { cvData: spellOnly };
      }
    }

    // 2. Punctuation & Spacing
    let punctCount = 0;
    let punctBeforeEx = '';
    let punctAfterEx = '';
    const applyPunctToCv = (src: CvData): CvData => {
      const c: CvData = JSON.parse(JSON.stringify(src));
      const patch = (val: string) => {
        const res = fixPunctuationAndSpacing(cleanExtractedDocumentText(val));
        if (res !== val) {
          punctCount += 1;
          if (!punctBeforeEx) {
            punctBeforeEx = val.slice(0, 60);
            punctAfterEx = res.slice(0, 60);
          }
        }
        return res;
      };
      c.fullName = patch(c.fullName);
      c.targetJobTitle = patch(c.targetJobTitle);
      c.location = patch(c.location);
      c.summary = patch(c.summary);
      c.experiences = c.experiences.map((e) => ({
        ...e,
        jobTitle: patch(e.jobTitle),
        company: patch(e.company),
        bullets: e.bullets.map((b) => patch(b.replace(/^[•\-*\s]+/, ''))),
      }));
      c.education = c.education.map((e) => ({
        ...e,
        degree: patch(e.degree),
        institution: patch(e.institution),
        details: patch(e.details),
      }));
      return c;
    };

    const punctOnly = applyPunctToCv(originalCv);
    const prevPunct = punctCount;
    punctCount = 0;
    workingCv = applyPunctToCv(workingCv);
    if (prevPunct > 0 || punctCount > 0) {
      const fixId = 'fix-cv-punct';
      fixes.push({
        id: fixId,
        category: 'علامات الترقيم والمسافات',
        count: Math.max(prevPunct, punctCount),
        beforeExample: punctBeforeEx || 'نصوص بمسافات مزدوجة / علامات غير موحدة',
        afterExample: punctAfterEx || 'مسافة واحدة وعلامات ترقيم قياسية',
        status: 'تم ✓',
      });
      perCategoryPayloads[fixId] = { cvData: punctOnly };
    }

    // 3. Dates & Numbers (+ Conflict warnings without auto-fixing conflicts)
    let dateCount = 0;
    let dateBeforeEx = '';
    let dateAfterEx = '';
    const dateWarnings: string[] = [];

    const applyDatesToCv = (src: CvData): CvData => {
      const c: CvData = JSON.parse(JSON.stringify(src));
      const cleanPhone = toStandardLatinDigits(c.phone).replace(/\s+/g, '');
      if (cleanPhone !== c.phone) {
        dateCount += 1;
        dateBeforeEx = c.phone;
        dateAfterEx = cleanPhone;
        c.phone = cleanPhone;
      }
      c.experiences = c.experiences.map((e) => {
        const conflict = detectDateRangeConflicts(e.dateRange);
        if (conflict) {
          dateWarnings.push(conflict);
          return e;
        }
        const normD = normalizeDateString(toStandardLatinDigits(e.dateRange), cvLanguage);
        if (normD !== e.dateRange) {
          dateCount += 1;
          if (!dateBeforeEx) {
            dateBeforeEx = e.dateRange;
            dateAfterEx = normD;
          }
        }
        return { ...e, dateRange: normD };
      });
      c.education = c.education.map((e) => {
        const conflict = detectDateRangeConflicts(e.dateRange);
        if (conflict) {
          dateWarnings.push(conflict);
          return e;
        }
        const normD = normalizeDateString(toStandardLatinDigits(e.dateRange), cvLanguage);
        if (normD !== e.dateRange) {
          dateCount += 1;
        }
        return { ...e, dateRange: normD };
      });
      c.certifications = c.certifications.map((cert) => ({
        ...cert,
        date: normalizeDateString(toStandardLatinDigits(cert.date), cvLanguage),
      }));
      return c;
    };

    if (settings.unifyDates) {
      const datesOnly = applyDatesToCv(originalCv);
      dateCount = 0;
      dateWarnings.length = 0;
      workingCv = applyDatesToCv(workingCv);
      if (dateCount > 0) {
        const fixId = 'fix-cv-dates';
        fixes.push({
          id: fixId,
          category: 'التواريخ والأرقام',
          count: dateCount,
          beforeExample: dateBeforeEx || 'أرقام وتواريخ بصيغ متفرقة',
          afterExample: dateAfterEx || '01/2020 - حتى الآن',
          status: 'تم ✓',
        });
        perCategoryPayloads[fixId] = { cvData: datesOnly };
      }
      if (dateWarnings.length > 0) {
        fixes.push({
          id: 'warn-cv-dates',
          category: 'التواريخ والأرقام',
          count: dateWarnings.length,
          beforeExample: dateWarnings[0],
          afterExample: 'مراجعة تاريخ الانتهاء مقابل البدء يدوياً',
          status: 'يحتاج مراجعة يدوية',
          warningMessage: dateWarnings.join(' · '),
        });
      }
    }

    // 4. Tables & Complex Lists to ATS Simple Text
    if (settings.fixTables) {
      let tableCount = 0;
      let tblBefore = '';
      let tblAfter = '';
      const applyTablesToCv = (src: CvData): CvData => {
        const c: CvData = JSON.parse(JSON.stringify(src));
        c.experiences = c.experiences.map((exp) => ({
          ...exp,
          bullets: exp.bullets.map((b) => {
            if (/[|\t]{1,}/.test(b)) {
              tableCount += 1;
              const flat = b
                .split(/[|\t]+/)
                .map((x) => x.trim())
                .filter(Boolean)
                .join(' — ');
              if (!tblBefore) {
                tblBefore = b.slice(0, 60);
                tblAfter = flat.slice(0, 60);
              }
              return flat;
            }
            return b;
          }),
        }));
        return c;
      };
      const tablesOnly = applyTablesToCv(originalCv);
      tableCount = 0;
      workingCv = applyTablesToCv(workingCv);
      if (tableCount > 0) {
        const fixId = 'fix-cv-tables';
        fixes.push({
          id: fixId,
          category: 'الجداول والقوائم',
          count: tableCount,
          beforeExample: tblBefore,
          afterExample: tblAfter,
          status: 'تم ✓',
        });
        perCategoryPayloads[fixId] = { cvData: tablesOnly };
      }
    }

    // 5. ATS Rules & Document Length
    const yearsDetected = estimateCvExperienceYears(workingCv);
    const cvPageRecommendation: 'single-page' | 'two-pages' =
      yearsDetected < 10 ? 'single-page' : 'two-pages';

    if (settings.atsCvCheck) {
      const beforePhoto = workingCv.showPhotoInCv;
      workingCv = applySafeAtsFixes(workingCv, cvLanguage);
      workingCv.showPhotoInCv = false;
      const atsOnly = applySafeAtsFixes({ ...originalCv, showPhotoInCv: false }, cvLanguage);
      const fixId = 'fix-cv-ats';
      fixes.push({
        id: fixId,
        category: 'طول المستند و ATS',
        count: (beforePhoto ? 1 : 0) + 1,
        beforeExample: beforePhoto
          ? 'صورة/أيقونات داخل CV + اختصارات غير مشروحة'
          : 'اختصارات وعناوين قياسية تحتاج ضبط ATS',
        afterExample:
          cvPageRecommendation === 'single-page'
            ? `متوافق ATS بدون صور (${yearsDetected} سنوات خبرة ← صفحة واحدة مضغوطة)`
            : `متوافق ATS بدون صور (${yearsDetected} سنوات خبرة ← صفحتان كحد أقصى)`,
        status: 'تم ✓',
      });
      perCategoryPayloads[fixId] = { cvData: atsOnly };
    }

    const atsAfter = runAtsComplianceAudit(workingCv, cvLanguage, cvTemplateId).score;

    const previewOriginalLines = [
      { label: 'الاسم الكامل', text: originalCv.fullName },
      { label: 'المسمى الوظيفي', text: originalCv.targetJobTitle },
      { label: 'الملخص المهني', text: originalCv.summary },
      {
        label: 'الخبرات العملية',
        text: originalCv.experiences
          .map((e) => `${e.jobTitle} (${e.dateRange})\n${e.bullets.join('\n')}`)
          .join('\n---\n'),
      },
      {
        label: 'التعليم',
        text: originalCv.education.map((e) => `${e.degree} — ${e.institution} (${e.dateRange})`).join('\n'),
      },
    ];
    const previewFormattedLines = [
      { label: 'الاسم الكامل', text: workingCv.fullName },
      { label: 'المسمى الوظيفي', text: workingCv.targetJobTitle },
      { label: 'الملخص المهني', text: workingCv.summary },
      {
        label: 'الخبرات العملية',
        text: workingCv.experiences
          .map((e) => `${e.jobTitle} (${e.dateRange})\n${e.bullets.map((b) => `• ${b.replace(/^•\s*/, '')}`).join('\n')}`)
          .join('\n---\n'),
      },
      {
        label: 'التعليم',
        text: workingCv.education.map((e) => `${e.degree} — ${e.institution} (${e.dateRange})`).join('\n'),
      },
    ];

    return {
      scope,
      fixes,
      totalFixCount: fixes.reduce((sum, f) => sum + (f.status === 'تم ✓' ? f.count : 0), 0),
      hasManualWarnings: fixes.some((f) => f.status === 'يحتاج مراجعة يدوية'),
      atsScoreBefore: atsBefore,
      atsScoreAfter: atsAfter,
      cvPageRecommendation,
      cvYearsDetected: yearsDetected,
      originalSnapshot: { cvData: originalCv },
      formattedPayload: { cvData: workingCv },
      perCategoryPayloads,
      previewOriginalLines,
      previewFormattedLines,
    };
  }

  // --------------------------------------------------------------------------
  // SCOPE: REPORT / TASKS / EVALUATIONS / PLAN-RECS
  // --------------------------------------------------------------------------
  const originalData: ReportData | undefined = reportData
    ? JSON.parse(JSON.stringify(reportData))
    : undefined;
  const originalExtras: ReportExtras | undefined = reportExtras
    ? JSON.parse(JSON.stringify(reportExtras))
    : undefined;
  const originalTheme: ThemeSettings | undefined = themeSettings
    ? JSON.parse(JSON.stringify(themeSettings))
    : undefined;

  let workingData: ReportData | undefined = originalData
    ? JSON.parse(JSON.stringify(originalData))
    : undefined;
  let workingExtras: ReportExtras | undefined = originalExtras
    ? JSON.parse(JSON.stringify(originalExtras))
    : undefined;
  let workingTheme: ThemeSettings | undefined = originalTheme
    ? JSON.parse(JSON.stringify(originalTheme))
    : undefined;

  const shouldRunFullReport = scope === 'report';
  const shouldRunTasks = scope === 'tasks' || scope === 'report';
  const shouldRunEval = scope === 'evaluations' || scope === 'report';
  const shouldRunPlanRecs = scope === 'plan-recs' || scope === 'report';

  // Helper to apply string transform across report text fields
  const transformReportFields = (
    dSrc: ReportData | undefined,
    eSrc: ReportExtras | undefined,
    fn: (s: string, fieldLabel?: string) => string
  ): { d?: ReportData; e?: ReportExtras } => {
    const d: ReportData | undefined = dSrc ? JSON.parse(JSON.stringify(dSrc)) : undefined;
    const e: ReportExtras | undefined = eSrc ? JSON.parse(JSON.stringify(eSrc)) : undefined;

    if (d && shouldRunFullReport) {
      d.centerName = fn(d.centerName, 'اسم المركز');
      d.centerCity = fn(d.centerCity, 'المدينة');
      d.directorName = fn(d.directorName, 'المدير');
      d.directorRole = fn(d.directorRole, 'الصفة');
      d.schoolAddressee = fn(d.schoolAddressee, 'الجهة الموجهة');
      d.reportTitle = fn(d.reportTitle, 'عنوان التقرير');
      d.reportSubtitle = fn(d.reportSubtitle, 'العنوان الفرعي');
      d.childName = fn(d.childName, 'اسم الحالة');
      d.diagnosis = fn(d.diagnosis, 'التشخيص');
      d.backgroundParagraph1 = fn(d.backgroundParagraph1, 'الخلفية 1');
      d.backgroundParagraph2 = fn(d.backgroundParagraph2, 'الخلفية 2');
      d.envIntro = fn(d.envIntro, 'البيئة');
      d.envPositive = fn(d.envPositive, 'البيئة الإيجابية');
      d.envNegativeIntro = fn(d.envNegativeIntro, 'مؤثرات البيئة');
      d.envNegativePoints = d.envNegativePoints.map((x) => fn(x, 'نقطة بيئة'));
      d.homeSchoolIntro = fn(d.homeSchoolIntro, 'التعليم المنزلي');
      d.opinionParagraph1 = fn(d.opinionParagraph1, 'الرأي المهني 1');
      d.opinionParagraph2 = fn(d.opinionParagraph2, 'الرأي المهني 2');
      d.opinionParagraph3 = fn(d.opinionParagraph3, 'الرأي المهني 3');
      d.coreGoalQuote = fn(d.coreGoalQuote, 'الهدف الجوهري');
      d.closingSalutation = fn(d.closingSalutation, 'الخاتمة');
    }

    if (d && shouldRunPlanRecs) {
      d.homeSchoolBenefits = d.homeSchoolBenefits.map((x) => fn(x, 'دعم منزلي'));
      d.recommendationsIntro = fn(d.recommendationsIntro, 'مقدمة التوصيات');
      d.recommendations = d.recommendations.map((x) => fn(x, 'توصية'));
    }

    if (e) {
      if (shouldRunFullReport) {
        e.summaryText = fn(e.summaryText, 'ملخص التقرير');
        e.quickSummaryLines = e.quickSummaryLines.map((x) => fn(x, 'ملخص سريع'));
        e.customCards = (e.customCards || []).map((c) => ({
          ...c,
          title: fn(c.title, 'عنوان بطاقة'),
          body: fn(c.body, 'نص بطاقة'),
        }));
      }
      if (shouldRunPlanRecs) {
        e.planGoals = e.planGoals.map((g) => ({
          ...g,
          goal: fn(g.goal, 'الهدف'),
          owner: fn(g.owner, 'المسؤول'),
          progress: fn(g.progress, 'المتابعة'),
        }));
        e.progressNotes = fn(e.progressNotes, 'ملاحظات التقدم');
      }
      if (shouldRunTasks) {
        e.weeklyTasks = (e.weeklyTasks || []).map((t) => ({
          ...t,
          task: fn(t.task, 'مهمة'),
          owner: fn(t.owner, 'مسؤول المهمة'),
        }));
      }
      if (shouldRunEval) {
        e.selectedEvaluationForms = e.selectedEvaluationForms.map((f) => ({
          ...f,
          title: fn(f.title, 'عنوان التقييم'),
          fields: f.fields.map((fld) => ({
            label: fn(fld.label, 'حقل التقييم'),
            value: fn(fld.value, 'قيمة التقييم'),
          })),
        }));
      }
    }

    return { d, e };
  };

  // A. Spell check
  if (settings.spellCheck) {
    let count = 0;
    let exBefore = '';
    let exAfter = '';
    const resOnly = transformReportFields(originalData, originalExtras, (s) => {
      const out = fixSpellingInText(s);
      if (out !== s) {
        count += 1;
        if (!exBefore) {
          exBefore = s.slice(0, 60);
          exAfter = out.slice(0, 60);
        }
      }
      return out;
    });
    const resWork = transformReportFields(workingData, workingExtras, (s) => fixSpellingInText(s));
    workingData = resWork.d;
    workingExtras = resWork.e;
    if (count > 0) {
      const fixId = 'fix-rep-spell';
      fixes.push({
        id: fixId,
        category: 'إملاء ونحو',
        count,
        beforeExample: exBefore,
        afterExample: exAfter,
        status: 'تم ✓',
      });
      perCategoryPayloads[fixId] = { reportData: resOnly.d, reportExtras: resOnly.e };
    }
  }

  // B. Punctuation & spacing
  {
    let count = 0;
    let exBefore = '';
    let exAfter = '';
    const resOnly = transformReportFields(originalData, originalExtras, (s) => {
      const out = fixPunctuationAndSpacing(cleanExtractedDocumentText(s));
      if (out !== s) {
        count += 1;
        if (!exBefore) {
          exBefore = s.slice(0, 60);
          exAfter = out.slice(0, 60);
        }
      }
      return out;
    });
    const resWork = transformReportFields(workingData, workingExtras, (s) =>
      fixPunctuationAndSpacing(cleanExtractedDocumentText(s))
    );
    workingData = resWork.d;
    workingExtras = resWork.e;
    if (count > 0) {
      const fixId = 'fix-rep-punct';
      fixes.push({
        id: fixId,
        category: 'علامات الترقيم والمسافات',
        count,
        beforeExample: exBefore,
        afterExample: exAfter,
        status: 'تم ✓',
      });
      perCategoryPayloads[fixId] = { reportData: resOnly.d, reportExtras: resOnly.e };
    }
  }

  // C. Fonts, Colors & Typography Unification
  if (settings.unifyFonts && workingExtras) {
    const prevStyles = originalExtras?.blockStyles || {};
    const nextStyles: Record<string, BlockStyleOverride> = {};
    let styleCleanCount = 0;

    Object.entries(prevStyles).forEach(([blockId, st]) => {
      if (!st) return;
      const isHeading = /title|heading|intro|quote/i.test(blockId);
      const unified: BlockStyleOverride = {
        ...st,
        fontFamily: 'sans',
        textColor: isHeading ? '#1E3A8A' : '#0F172A',
        fontSizePx: isHeading ? 16 : 12,
        bold: isHeading ? true : st.bold,
      };
      if (
        st.textColor !== unified.textColor ||
        st.fontFamily !== unified.fontFamily ||
        st.fontSizePx !== unified.fontSizePx
      ) {
        styleCleanCount += 1;
      }
      nextStyles[blockId] = unified;
    });

    const themeChanged =
      workingTheme &&
      (workingTheme.screenTheme !== 'calm-blue' || workingTheme.fontSize !== 'medium');
    if (workingTheme) {
      workingTheme = {
        ...workingTheme,
        fontSize: 'medium',
      };
    }

    if (styleCleanCount > 0 || themeChanged || scope === 'report') {
      const fixId = 'fix-rep-fonts';
      workingExtras = { ...workingExtras, blockStyles: nextStyles };
      fixes.push({
        id: fixId,
        category: 'الخطوط والألوان والأحجام',
        count: Math.max(1, styleCleanCount),
        beforeExample: 'ألوان وأحجام متفرقة بين الفقرات والعناوين',
        afterExample: 'Cairo / Tajawal · عناوين 16 عريض · نصوص 12 أسود غامق RTL',
        status: 'تم ✓',
      });
      perCategoryPayloads[fixId] = {
        reportExtras: originalExtras ? { ...originalExtras, blockStyles: nextStyles } : undefined,
        themeSettings: workingTheme,
      };
    }
  }

  // D. Dates & Numbers (+ Tasks day/status normalization)
  if (settings.unifyDates) {
    let dateCount = 0;
    let exBefore = '';
    let exAfter = '';
    const dateWarnings: string[] = [];

    const applyDates = (
      dSrc: ReportData | undefined,
      eSrc: ReportExtras | undefined
    ): { d?: ReportData; e?: ReportExtras } => {
      const d: ReportData | undefined = dSrc ? JSON.parse(JSON.stringify(dSrc)) : undefined;
      const e: ReportExtras | undefined = eSrc ? JSON.parse(JSON.stringify(eSrc)) : undefined;

      if (d && shouldRunFullReport) {
        const fields: (keyof Pick<ReportData, 'reportDate' | 'signDate' | 'birthDate' | 'phone' | 'age'>)[] = [
          'reportDate',
          'signDate',
          'birthDate',
          'phone',
          'age',
        ];
        fields.forEach((f) => {
          const prev = d[f];
          const conflict = detectDateRangeConflicts(prev);
          if (conflict) {
            dateWarnings.push(conflict);
          }
          const next = normalizeNumbersAndDatesInText(prev);
          if (next !== prev) {
            dateCount += 1;
            if (!exBefore) {
              exBefore = prev;
              exAfter = next;
            }
            d[f] = next;
          }
        });
      }

      // Normalize numbers/dates & check date-range conflicts across narrative fields
      const narrativePatched = transformReportFields(d, e, (val) => {
        const conflict = detectDateRangeConflicts(val);
        if (conflict && !dateWarnings.includes(conflict)) {
          dateWarnings.push(conflict);
        }
        const next = normalizeNumbersAndDatesInText(val);
        if (next !== val) {
          dateCount += 1;
          if (!exBefore) {
            exBefore = val.slice(0, 60);
            exAfter = next.slice(0, 60);
          }
        }
        return next;
      });
      const dFinal = narrativePatched.d;
      const eFinal = narrativePatched.e;

      if (eFinal && shouldRunTasks && eFinal.weeklyTasks) {
        eFinal.weeklyTasks = eFinal.weeklyTasks.map((t) => {
          const nd = normalizeTaskDay(t.day);
          const ns = normalizeTaskStatus(t.status);
          const nt = normalizeNumbersAndDatesInText(t.task);
          if (nd !== t.day || ns !== t.status || nt !== t.task) {
            dateCount += 1;
            if (!exBefore) {
              exBefore = `${t.day} / ${t.status}`;
              exAfter = `${nd} / ${ns}`;
            }
          }
          return { ...t, day: nd, status: ns, task: nt };
        });
      }

      if (eFinal && shouldRunPlanRecs) {
        eFinal.planGoals = eFinal.planGoals.map((g) => {
          const conflict = detectDateRangeConflicts(g.targetDuration);
          if (conflict && !dateWarnings.includes(conflict)) {
            dateWarnings.push(conflict);
            return g;
          }
          const nd = normalizeNumbersAndDatesInText(g.targetDuration);
          if (nd !== g.targetDuration) dateCount += 1;
          return { ...g, targetDuration: nd };
        });
      }

      return { d: dFinal, e: eFinal };
    };

    const datesOnly = applyDates(originalData, originalExtras);
    dateCount = 0;
    dateWarnings.length = 0;
    const datesWork = applyDates(workingData, workingExtras);
    workingData = datesWork.d;
    workingExtras = datesWork.e;

    if (dateCount > 0) {
      const fixId = 'fix-rep-dates';
      fixes.push({
        id: fixId,
        category: 'التواريخ والأرقام',
        count: dateCount,
        beforeExample: exBefore || 'أرقام عربية متفرقة / حالات مهام غير موحدة',
        afterExample: exAfter || 'صيغة موحدة (تم / لم يتم / جزئي · أرقام قياسية)',
        status: 'تم ✓',
      });
      perCategoryPayloads[fixId] = { reportData: datesOnly.d, reportExtras: datesOnly.e };
    }
    if (dateWarnings.length > 0) {
      fixes.push({
        id: 'warn-rep-dates',
        category: 'التواريخ والأرقام',
        count: dateWarnings.length,
        beforeExample: dateWarnings[0],
        afterExample: 'يرجى مراجعة التواريخ يدوياً',
        status: 'يحتاج مراجعة يدوية',
        warningMessage: dateWarnings.join(' · '),
      });
    }
  }

  // E. Standard Section Order & Deduplicated Lists/Headings
  if (shouldRunFullReport && workingExtras && workingData) {
    let orderFixed = 0;
    const curOrder = workingExtras.sectionOrder || [];
    if (JSON.stringify(curOrder) !== JSON.stringify(DEFAULT_SECTION_ORDER)) {
      orderFixed += 1;
      workingExtras = { ...workingExtras, sectionOrder: [...DEFAULT_SECTION_ORDER] };
    }
    // Deduplicate recommendations
    const dedupRecs = Array.from(new Set(workingData.recommendations.map((r) => r.trim()))).filter(
      Boolean
    );
    if (dedupRecs.length !== workingData.recommendations.length) {
      orderFixed += workingData.recommendations.length - dedupRecs.length;
      workingData = { ...workingData, recommendations: dedupRecs };
    }
    if (orderFixed > 0) {
      const fixId = 'fix-rep-sections';
      fixes.push({
        id: fixId,
        category: 'العناوين والأقسام',
        count: orderFixed,
        beforeExample: 'أقسام غير مرتبة أو توصيات مكررة',
        afterExample: 'ترتيب قياسي: بيانات الحالة ← التقييم ← الخطة ← التوصيات',
        status: 'تم ✓',
      });
      perCategoryPayloads[fixId] = {
        reportData: originalData ? { ...originalData, recommendations: dedupRecs } : undefined,
        reportExtras: originalExtras ? { ...originalExtras, sectionOrder: [...DEFAULT_SECTION_ORDER] } : undefined,
      };
    }
  }

  // F. Fix Lists & Tables
  if (settings.fixTables && workingData) {
    let listFixes = 0;
    let listBefore = '';
    let listAfter = '';

    const cleanBullets = (arr: string[], numbered: boolean) =>
      arr.map((item, idx) => {
        const res = normalizeListLine(item, numbered, idx);
        if (res !== item && item !== '[ ... ]') {
          listFixes += 1;
          if (!listBefore) {
            listBefore = item.slice(0, 55);
            listAfter = res.slice(0, 55);
          }
        }
        return res;
      });

    const cleanNegative = cleanBullets(workingData.envNegativePoints, false);
    const cleanHome = cleanBullets(workingData.homeSchoolBenefits, false);
    const cleanRecs = cleanBullets(workingData.recommendations, false);

    if (listFixes > 0) {
      workingData = {
        ...workingData,
        envNegativePoints: cleanNegative,
        homeSchoolBenefits: cleanHome,
        recommendations: cleanRecs,
      };
      const fixId = 'fix-rep-lists';
      fixes.push({
        id: fixId,
        category: 'الجداول والقوائم',
        count: listFixes,
        beforeExample: listBefore || 'قوائم بعلامات متفرقة',
        afterExample: listAfter || '• قائمة نقطية موحدة ومنظمة',
        status: 'تم ✓',
      });
      perCategoryPayloads[fixId] = {
        reportData: originalData
          ? {
              ...originalData,
              envNegativePoints: cleanNegative,
              homeSchoolBenefits: cleanHome,
              recommendations: cleanRecs,
            }
          : undefined,
      };
    }
  }

  // G. Check Report Length
  let isReportLong = false;
  if (shouldRunFullReport && workingData) {
    const wordCount = [
      workingData.backgroundParagraph1,
      workingData.backgroundParagraph2,
      workingData.envPositive,
      workingData.opinionParagraph1,
      workingData.opinionParagraph2,
      workingData.opinionParagraph3,
      ...workingData.recommendations,
      ...(workingExtras?.planGoals.map((g) => g.goal) || []),
    ]
      .join(' ')
      .trim()
      .split(/\s+/).length;

    if (wordCount > 240 || (workingExtras?.planGoals.length || 0) + workingData.recommendations.length > 10) {
      isReportLong = true;
    }
  }

  const previewOriginalLines: { label: string; text: string }[] = [];
  const previewFormattedLines: { label: string; text: string }[] = [];

  if (scope === 'tasks' && originalExtras && workingExtras) {
    previewOriginalLines.push({
      label: 'الجدول الأسبوعي قبل التنسيق',
      text:
        (originalExtras.weeklyTasks || [])
          .map((t) => `${t.day} | ${t.task} | ${t.status}`)
          .join('\n') || 'لا توجد مهام بعد',
    });
    previewFormattedLines.push({
      label: 'الجدول الأسبوعي بعد التنسيق',
      text:
        (workingExtras.weeklyTasks || [])
          .map((t) => `${t.day} | ${t.task} | ${t.status}`)
          .join('\n') || 'لا توجد مهام بعد',
    });
  } else if (scope === 'evaluations' && originalExtras && workingExtras) {
    previewOriginalLines.push({
      label: 'استمارات التقييم قبل التنسيق',
      text:
        originalExtras.selectedEvaluationForms
          .map((f) => `${f.title}\n${f.fields.map((fld) => `${fld.label}: ${fld.value}`).join('\n')}`)
          .join('\n---\n') || 'لا توجد استمارات محددة',
    });
    previewFormattedLines.push({
      label: 'استمارات التقييم بعد التنسيق',
      text:
        workingExtras.selectedEvaluationForms
          .map((f) => `${f.title}\n${f.fields.map((fld) => `${fld.label}: ${fld.value}`).join('\n')}`)
          .join('\n---\n') || 'لا توجد استمارات محددة',
    });
  } else if (originalData && workingData) {
    previewOriginalLines.push(
      { label: 'عنوان التقرير', text: originalData.reportTitle },
      { label: 'الخلفية والسياق', text: originalData.backgroundParagraph1 },
      { label: 'التوصيات', text: originalData.recommendations.join('\n') }
    );
    previewFormattedLines.push(
      { label: 'عنوان التقرير', text: workingData.reportTitle },
      { label: 'الخلفية والسياق', text: workingData.backgroundParagraph1 },
      { label: 'التوصيات', text: workingData.recommendations.join('\n') }
    );
  }

  return {
    scope,
    fixes,
    totalFixCount: fixes.reduce((sum, f) => sum + (f.status === 'تم ✓' ? f.count : 0), 0),
    hasManualWarnings: fixes.some((f) => f.status === 'يحتاج مراجعة يدوية'),
    isReportLong,
    originalSnapshot: {
      reportData: originalData,
      reportExtras: originalExtras,
      themeSettings: originalTheme,
    },
    formattedPayload: {
      reportData: workingData,
      reportExtras: workingExtras,
      themeSettings: workingTheme,
    },
    perCategoryPayloads,
    previewOriginalLines,
    previewFormattedLines,
  };
}
