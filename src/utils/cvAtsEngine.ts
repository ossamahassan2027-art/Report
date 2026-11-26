import { AlignmentType, BorderStyle, Document, Packer, Paragraph, TextRun } from 'docx';
import {
  ATS_EXACT_HEADINGS,
  ATS_SECTION_ORDER,
  CvData,
  CvLanguage,
  CvTemplateId,
} from '../types/cv';

export interface AtsCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface AtsAuditReport {
  score: number;
  checks: AtsCheckItem[];
  hasUnexpandedAbbreviations: boolean;
  hasInconsistentDates: boolean;
  missingJobTitleInSummaryOrExp: boolean;
}

export interface KeywordAnalysisResult {
  extractedCount: number;
  matchedInCv: string[];
  unmatchedFromJd: string[];
}

const KNOWN_ACRONYM_MAP: Record<string, { ar: string; en: string }> = {
  ATS: { ar: 'أنظمة تتبع المتقدمين (ATS)', en: 'Applicant Tracking Systems (ATS)' },
  ADHD: {
    ar: 'اضطراب فرط الحركة وتشتت الانتباه (ADHD)',
    en: 'Attention-Deficit/Hyperactivity Disorder (ADHD)',
  },
  IEP: { ar: 'الخطط التربوية الفردية (IEP)', en: 'Individualized Education Program (IEP)' },
  ABA: { ar: 'تحليل السلوك التطبيقي (ABA)', en: 'Applied Behavior Analysis (ABA)' },
  KPI: { ar: 'مؤشرات الأداء الرئيسية (KPI)', en: 'Key Performance Indicators (KPI)' },
  CRM: { ar: 'إدارة علاقات العملاء (CRM)', en: 'Customer Relationship Management (CRM)' },
  HR: { ar: 'الموارد البشرية (HR)', en: 'Human Resources (HR)' },
  ERP: { ar: 'تخطيط موارد المؤسسات (ERP)', en: 'Enterprise Resource Planning (ERP)' },
  LMS: { ar: 'نظام إدارة التعلم (LMS)', en: 'Learning Management System (LMS)' },
};

const DATE_RANGE_REGEX =
  /^(0[1-9]|1[0-2])\/\d{4}\s*-\s*((0[1-9]|1[0-2])\/\d{4}|حتى الآن|Present)$/i;
const SINGLE_DATE_REGEX = /^(0[1-9]|1[0-2])\/\d{4}$/;

export function isAtsDateConsistent(dateStr: string, allowSingle = false): boolean {
  const clean = dateStr.trim();
  if (!clean) return false;
  if (DATE_RANGE_REGEX.test(clean)) return true;
  if (allowSingle && SINGLE_DATE_REGEX.test(clean)) return true;
  return false;
}

export function normalizeDateString(raw: string, language: CvLanguage): string {
  const clean = raw.trim();
  if (!clean) return clean;
  if (isAtsDateConsistent(clean, true)) {
    return clean
      .replace(/present|حتى الان|حتي الان|حتى الآن/i, language === 'ar' ? 'حتى الآن' : 'Present')
      .replace(/\s*-\s*/, ' - ');
  }

  const normalizePart = (part: string, isEnd: boolean): string => {
    const p = part.trim();
    if (/^(present|now|current|حتى الآن|حتى الان|حتي الان|الآن|الحالي)$/i.test(p)) {
      return language === 'ar' ? 'حتى الآن' : 'Present';
    }
    const mmYyyy = p.match(/^(\d{1,2})[/-](\d{4})$/);
    if (mmYyyy) {
      const m = mmYyyy[1].padStart(2, '0');
      const mNum = Math.min(12, Math.max(1, Number(m)));
      return `${String(mNum).padStart(2, '0')}/${mmYyyy[2]}`;
    }
    const yyyyOnly = p.match(/^(\d{4})$/);
    if (yyyyOnly) {
      return `${isEnd ? '12' : '01'}/${yyyyOnly[1]}`;
    }
    return p;
  };

  if (clean.includes('-')) {
    const [startRaw, endRaw] = clean.split('-');
    return `${normalizePart(startRaw, false)} - ${normalizePart(endRaw || '', true)}`;
  }

  return normalizePart(clean, false);
}

export function findStandaloneAbbreviations(cv: CvData): string[] {
  const fullCorpus = [
    cv.targetJobTitle,
    cv.summary,
    ...cv.experiences.flatMap((e) => [e.jobTitle, ...e.bullets]),
    ...cv.education.map((e) => `${e.degree} ${e.details}`),
    ...cv.skills.map((s) => s.name),
    ...cv.certifications.map((c) => c.name),
    ...cv.trainings.map((t) => t.title),
  ].join('\n');

  const unexpanded: string[] = [];
  Object.keys(KNOWN_ACRONYM_MAP).forEach((code) => {
    // Detect code appearing outside parentheses like " ATS " or start/end
    const regex = new RegExp(`(?<!\\()\\b${code}\\b(?!\\))`, 'g');
    if (regex.test(fullCorpus)) {
      unexpanded.push(code);
    }
  });
  return unexpanded;
}

export function expandAbbreviationsInString(text: string, language: CvLanguage): string {
  let out = text;
  Object.entries(KNOWN_ACRONYM_MAP).forEach(([code, labels]) => {
    const fullForm = language === 'ar' ? labels.ar : labels.en;
    const regex = new RegExp(`(?<!\\()\\b${code}\\b(?!\\))`, 'g');
    if (regex.test(out)) {
      // Only expand first standalone occurrence if not already accompanied by parentheses
      out = out.replace(regex, fullForm);
    }
  });
  return out;
}

export function applySafeAtsFixes(cv: CvData, language: CvLanguage): CvData {
  return {
    ...cv,
    showPhotoInCv: false,
    summary: expandAbbreviationsInString(cv.summary, language),
    experiences: cv.experiences.map((exp) => ({
      ...exp,
      dateRange: normalizeDateString(exp.dateRange, language),
      bullets: exp.bullets.map((b) => expandAbbreviationsInString(b, language)),
    })),
    education: cv.education.map((edu) => ({
      ...edu,
      dateRange: normalizeDateString(edu.dateRange, language),
    })),
    skills: cv.skills.map((sk) => ({
      ...sk,
      name: expandAbbreviationsInString(sk.name, language),
    })),
    certifications: cv.certifications.map((c) => ({
      ...c,
      name: expandAbbreviationsInString(c.name, language),
      date: normalizeDateString(c.date, language),
    })),
    trainings: cv.trainings.map((t) => ({
      ...t,
      title: expandAbbreviationsInString(t.title, language),
      dateRange: normalizeDateString(t.dateRange, language),
    })),
  };
}

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'will',
  'are',
  'our',
  'you',
  'your',
  'have',
  'has',
  'able',
  'work',
  'role',
  'team',
  'job',
  'requirements',
  'responsibilities',
  'qualifications',
  'experience',
  'years',
  'من',
  'في',
  'على',
  'إلى',
  'الى',
  'عن',
  'مع',
  'أو',
  'او',
  'و',
  'التي',
  'الذي',
  'هذا',
  'هذه',
  'أن',
  'ان',
  'لا',
  'ما',
  'على',
  'خبرة',
  'العمل',
  'مهارات',
  'المطلوبة',
  'مطلوب',
  'القدرة',
  'شروط',
  'المهام',
  'سنوات',
]);

export function extractJobDescriptionKeywords(
  jdText: string,
  cv: CvData
): KeywordAnalysisResult {
  const cleanJd = jdText.trim();
  if (!cleanJd) {
    return { extractedCount: 0, matchedInCv: [], unmatchedFromJd: [] };
  }

  // Extract comma/line/bullet separated phrases & distinct English/Arabic terms
  const rawSegments = cleanJd
    .split(/[\n•·،,;؛|/()]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);

  const candidates = new Set<string>();
  rawSegments.forEach((seg) => {
    const words = seg.split(/\s+/).filter(Boolean);
    if (words.length >= 1 && words.length <= 4 && seg.length <= 42) {
      const lower = seg.toLowerCase();
      if (!STOPWORDS.has(lower)) {
        candidates.add(seg);
      }
    } else {
      words.forEach((w) => {
        const trimmed = w.replace(/^[:"'.]+|[:"'.]+$/g, '');
        if (trimmed.length >= 3 && !STOPWORDS.has(trimmed.toLowerCase())) {
          candidates.add(trimmed);
        }
      });
    }
  });

  const cvFullText = [
    cv.targetJobTitle,
    cv.summary,
    ...cv.experiences.flatMap((e) => [e.jobTitle, ...e.bullets]),
    ...cv.education.map((e) => `${e.degree} ${e.details}`),
    ...cv.skills.map((s) => `${s.name} ${s.level}`),
    ...cv.certifications.map((c) => c.name),
    ...cv.trainings.map((t) => t.title),
  ]
    .join(' ')
    .toLowerCase();

  const matchedInCv: string[] = [];
  const unmatchedFromJd: string[] = [];

  Array.from(candidates)
    .slice(0, 32)
    .forEach((kw) => {
      if (cvFullText.includes(kw.toLowerCase())) {
        matchedInCv.push(kw);
      } else {
        unmatchedFromJd.push(kw);
      }
    });

  return {
    extractedCount: matchedInCv.length + unmatchedFromJd.length,
    matchedInCv,
    unmatchedFromJd,
  };
}

export function runAtsComplianceAudit(
  cv: CvData,
  language: CvLanguage,
  _templateId: CvTemplateId
): AtsAuditReport {
  const headings = ATS_EXACT_HEADINGS[language];
  const headingValues = ATS_SECTION_ORDER.map((k) => headings[k]);
  const headingsClean = headingValues.every(
    (h) => h.trim().length > 0 && /^[\u0600-\u06FFa-zA-Z\s]+$/.test(h)
  );

  // Check date consistency across all dated sections
  const allDateRanges: { label: string; value: string; allowSingle: boolean }[] = [
    ...cv.experiences.map((e) => ({
      label: e.jobTitle || 'خبرة',
      value: e.dateRange,
      allowSingle: false,
    })),
    ...cv.education.map((e) => ({
      label: e.degree || 'تعليم',
      value: e.dateRange,
      allowSingle: false,
    })),
    ...cv.certifications.map((c) => ({
      label: c.name || 'شهادة',
      value: c.date,
      allowSingle: true,
    })),
    ...cv.trainings.map((t) => ({
      label: t.title || 'دورة',
      value: t.dateRange,
      allowSingle: true,
    })),
  ];

  const badDates = allDateRanges.filter(
    (d) => !d.value.includes('[') && !isAtsDateConsistent(d.value, d.allowSingle)
  );
  const hasInconsistentDates = badDates.length > 0;

  const hasValidSkills =
    cv.skills.length > 0 &&
    cv.skills.every((s) => s.name.trim().length > 0 && !s.name.includes('%'));

  const unexpandedAbbrs = findStandaloneAbbreviations(cv);
  const hasUnexpandedAbbreviations = unexpandedAbbrs.length > 0;

  const titleLower = cv.targetJobTitle.trim().toLowerCase();
  const hasTitleInSummary =
    !!titleLower &&
    !titleLower.includes('[') &&
    cv.summary.toLowerCase().includes(titleLower);
  const hasTitleInExperience =
    !!titleLower &&
    !titleLower.includes('[') &&
    cv.experiences.some(
      (e) =>
        e.jobTitle.toLowerCase().includes(titleLower) ||
        e.bullets.some((b) => b.toLowerCase().includes(titleLower))
    );
  const missingJobTitleInSummaryOrExp =
    !!titleLower && !titleLower.includes('[') && (!hasTitleInSummary || !hasTitleInExperience);

  const jdAnalysis = extractJobDescriptionKeywords(cv.jobDescriptionText, cv);
  const keywordOk =
    jdAnalysis.extractedCount === 0
      ? !missingJobTitleInSummaryOrExp
      : jdAnalysis.matchedInCv.length > 0 && !missingJobTitleInSummaryOrExp;

  const hasBasicContactText =
    cv.fullName.trim().length > 1 &&
    !cv.fullName.includes('[') &&
    cv.phone.trim().length > 3 &&
    cv.email.trim().length > 3;

  const checks: AtsCheckItem[] = [
    {
      id: 'standard-headings',
      label: 'عناوين قياسية وترتيب ثابت',
      passed: headingsClean,
      detail: 'جميع العناوين بصيغتها القياسية الصريحة بدون رموز أو دمج (ملخص - خبرات - تعليم - مهارات - شهادات - لغات - دورات).',
    },
    {
      id: 'no-complex-tables',
      label: 'بدون جداول معقدة',
      passed: true,
      detail: 'السيرة الذاتية مبنية في عمود واحد متسلسل من الأعلى للأسفل بدون خلايا مدمجة أو أعمدة مزدوجة.',
    },
    {
      id: 'no-charts',
      label: 'بدون رسوم',
      passed: hasValidSkills,
      detail: hasValidSkills
        ? 'جميع المهارات مكتوبة بنص صريح (مثال: Excel - متقدم) بدون أشرطة أو دوائر نسب.'
        : 'أضف مهارة واحدة على الأقل بصيغة نصية واضحة بدون علامات نسب مئوية.',
    },
    {
      id: 'no-icons',
      label: 'بدون أيقونات',
      passed: true,
      detail: 'بيانات التواصل مكتوبة بنص صريح (الهاتف: / البريد: / الموقع:) دون أي رموز أو أيقونات.',
    },
    {
      id: 'no-images',
      label: 'بدون صور',
      passed: !(cv.showPhotoInCv && cv.personalPhotoDataUrl),
      detail:
        cv.showPhotoInCv && cv.personalPhotoDataUrl
          ? 'تم تفعيل عرض صورة شخصية في الرأس. أنظمة ATS تفضل إخفاء الصور عند التقديم الإلكتروني (يمكنك إخفاؤها بالإصلاح التلقائي).'
          : 'القالب خالٍ تماماً من الصور الشخصية والشعارات والخلفيات الملونة وتواقيع الصور.',
    },
    {
      id: 'copyable-text',
      label: 'نص قابل للنسخ',
      passed: hasBasicContactText,
      detail: hasBasicContactText
        ? `كامل النص في جسم الصفحة الرئيسي بخط قياسي (${language === 'ar' ? 'Cairo / Tajawal' : 'Arial / Calibri'}) وقابل للنسخ بالكامل.`
        : 'أكمل الاسم الكامل ورقم الهاتف والبريد الإلكتروني بنص حقيقي واضح.',
    },
    {
      id: 'consistent-dates',
      label: 'تنسيق تواريخ موحد',
      passed: !hasInconsistentDates,
      detail: !hasInconsistentDates
        ? 'جميع التواريخ بصيغة موحدة ثابتة (MM/YYYY - MM/YYYY).'
        : `توجد تواريخ غير موحدة (${badDates.map((b) => b.value).join('، ')}). الصيغة القياسية المطلوبة: 01/2022 - 05/2024.`,
    },
    {
      id: 'skills-list',
      label: 'مهارات نصية مفصولة بفواصل',
      passed: hasValidSkills,
      detail: 'قسم المهارات منسق كقائمة نصية متصلة مفصولة بفواصل ومتوافقة مع قارئات ATS.',
    },
    {
      id: 'abbreviations',
      label: 'توضيح الاختصارات',
      passed: !hasUnexpandedAbbreviations,
      detail: !hasUnexpandedAbbreviations
        ? 'جميع الاختصارات مصحوبة بالاسم الكامل أولاً ثم الاختصار بين قوسين.'
        : `اختصارات تحتاج توضيحاً بالاسم الكامل قبل الاختصار: ${unexpandedAbbrs.join(', ')}.`,
    },
    {
      id: 'keywords-title',
      label: 'تطابق المسمى الوظيفي والكلمات المفتاحية',
      passed: keywordOk,
      detail: keywordOk
        ? 'المسمى الوظيفي المطلوب مذكور بصيغته الرسمية في الملخص والخبرات، والكلمات المفتاحية متطابقة.'
        : missingJobTitleInSummaryOrExp
        ? 'يُنصح بتكرار المسمى الوظيفي المطلوب بصيغته الرسمية داخل الملخص المهني والخبرات العملية إذا كان حقيقياً.'
        : 'ألصق الوصف الوظيفي في تبويب «الكلمات المفتاحية» لمطابقة مهاراتك الحقيقية.',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    score,
    checks,
    hasUnexpandedAbbreviations,
    hasInconsistentDates,
    missingJobTitleInSummaryOrExp,
  };
}

export function buildAtsPlainText(cv: CvData, language: CvLanguage): string {
  const h = ATS_EXACT_HEADINGS[language];
  const isAr = language === 'ar';

  const contactLine = [
    `${isAr ? 'الهاتف' : 'Phone'}: ${cv.phone}`,
    `${isAr ? 'البريد' : 'Email'}: ${cv.email}`,
    `${isAr ? 'الموقع' : 'Location'}: ${cv.location}`,
    cv.websiteOrLink && cv.websiteOrLink !== '[ ... ]'
      ? `${isAr ? 'الرابط' : 'Link'}: ${cv.websiteOrLink}`
      : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const lines: string[] = [
    cv.fullName,
    cv.targetJobTitle,
    contactLine,
    '',
    h.summary,
    cv.summary,
    '',
    h.experience,
  ];

  cv.experiences.forEach((exp) => {
    lines.push(`${exp.jobTitle} | ${exp.company} (${exp.location}) | ${exp.dateRange}`);
    exp.bullets.forEach((b) => {
      if (b.trim()) lines.push(`- ${b.trim()}`);
    });
    lines.push('');
  });

  lines.push(h.education);
  cv.education.forEach((edu) => {
    lines.push(`${edu.degree} - ${edu.institution} (${edu.dateRange})`);
    if (edu.details.trim()) lines.push(edu.details.trim());
  });
  lines.push('');

  lines.push(h.skills);
  lines.push(
    cv.skills
      .map((s) => (s.level.trim() ? `${s.name} - ${s.level}` : s.name))
      .join(isAr ? '، ' : ', ')
  );
  lines.push('');

  if (cv.certifications.length > 0) {
    lines.push(h.certifications);
    cv.certifications.forEach((c) => {
      lines.push(`${c.name} - ${c.issuer} (${c.date})`);
    });
    lines.push('');
  }

  lines.push(h.languages);
  lines.push(
    cv.languages
      .map((l) => `${l.name} - ${l.proficiency}`)
      .join(isAr ? '، ' : ', ')
  );

  if (cv.trainings.length > 0) {
    lines.push('');
    lines.push(h.training);
    cv.trainings.forEach((t) => {
      lines.push(`${t.title} - ${t.provider} (${t.dateRange})`);
    });
  }

  return lines.join('\n');
}

export async function exportCvToAtsWord(cv: CvData, language: CvLanguage): Promise<void> {
  const isRtl = language === 'ar';
  const align = isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT;
  const fontName = isRtl ? 'Cairo' : 'Arial';
  const h = ATS_EXACT_HEADINGS[language];

  const makeHeading = (text: string) =>
    new Paragraph({
      bidirectional: isRtl,
      alignment: align,
      spacing: { before: 200, after: 80 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: '111827',
        },
      },
      children: [
        new TextRun({
          text,
          bold: true,
          size: 24,
          color: '111827',
          font: fontName,
          rightToLeft: isRtl,
        }),
      ],
    });

  const makeParagraph = (text: string, bold = false) =>
    new Paragraph({
      bidirectional: isRtl,
      alignment: align,
      spacing: { after: 80, line: 280 },
      children: [
        new TextRun({
          text,
          bold,
          size: 21,
          color: '111827',
          font: fontName,
          rightToLeft: isRtl,
        }),
      ],
    });

  const contactText = [
    `${isRtl ? 'الهاتف' : 'Phone'}: ${cv.phone}`,
    `${isRtl ? 'البريد' : 'Email'}: ${cv.email}`,
    `${isRtl ? 'الموقع' : 'Location'}: ${cv.location}`,
    cv.websiteOrLink && cv.websiteOrLink !== '[ ... ]'
      ? `${isRtl ? 'الرابط' : 'Link'}: ${cv.websiteOrLink}`
      : '',
  ]
    .filter(Boolean)
    .join(' | ');

  // Strictly single-column Paragraphs ONLY (zero tables, zero images, zero headers/footers)
  const children: Paragraph[] = [
    new Paragraph({
      bidirectional: isRtl,
      alignment: align,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: cv.fullName,
          bold: true,
          size: 32,
          color: '111827',
          font: fontName,
          rightToLeft: isRtl,
        }),
      ],
    }),
    new Paragraph({
      bidirectional: isRtl,
      alignment: align,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: cv.targetJobTitle,
          bold: true,
          size: 23,
          color: '111827',
          font: fontName,
          rightToLeft: isRtl,
        }),
      ],
    }),
    makeParagraph(contactText),
    makeHeading(h.summary),
    makeParagraph(cv.summary),
    makeHeading(h.experience),
  ];

  cv.experiences.forEach((exp) => {
    children.push(
      makeParagraph(`${exp.jobTitle} — ${exp.company} (${exp.location}) | ${exp.dateRange}`, true)
    );
    exp.bullets.forEach((b) => {
      if (b.trim()) children.push(makeParagraph(`- ${b.trim()}`));
    });
  });

  children.push(makeHeading(h.education));
  cv.education.forEach((edu) => {
    children.push(makeParagraph(`${edu.degree} — ${edu.institution} (${edu.dateRange})`, true));
    if (edu.details.trim()) children.push(makeParagraph(edu.details.trim()));
  });

  children.push(makeHeading(h.skills));
  children.push(
    makeParagraph(
      cv.skills
        .map((s) => (s.level.trim() ? `${s.name} - ${s.level}` : s.name))
        .join(isRtl ? '، ' : ', ')
    )
  );

  if (cv.certifications.length > 0) {
    children.push(makeHeading(h.certifications));
    cv.certifications.forEach((c) => {
      children.push(makeParagraph(`${c.name} — ${c.issuer} (${c.date})`));
    });
  }

  children.push(makeHeading(h.languages));
  children.push(
    makeParagraph(
      cv.languages
        .map((l) => `${l.name} - ${l.proficiency}`)
        .join(isRtl ? '، ' : ', ')
    )
  );

  if (cv.trainings.length > 0) {
    children.push(makeHeading(h.training));
    cv.trainings.forEach((t) => {
      children.push(makeParagraph(`${t.title} — ${t.provider} (${t.dateRange})`));
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 820, right: 820 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = cv.fullName.trim().replace(/\s+/g, '-') || 'cv';
  link.href = url;
  link.download = `CV-ATS-${safeName}-${language}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
