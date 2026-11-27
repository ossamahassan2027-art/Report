import { CvData, CvLanguage } from '../types/cv';
import { SmartAddKind } from '../types/studio';
import { parseRawTextToCv, toLatinDigits } from './cvLocalParser';
import {
  cleanExtractedDocumentText,
  detectDateRangeConflicts,
  fixPunctuationAndSpacing,
  fixSpellingInText,
} from './smartAutoFormatter';

export interface SmartAddErrorIssue {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  problem: string;
  suggestion: string;
  fixValue?: string;
}

export interface SmartAddOptionalSuggestion {
  id: string;
  kind: 'skill' | 'certificate' | 'experience-detail' | 'recommendation';
  label: string;
  value: string;
}

export interface SmartAddStructuredFields {
  // Report / Case
  childName: string;
  age: string;
  mainComplaint: string;
  diagnosis: string;
  evaluation: string;
  planGoal: string;
  recommendations: string;
  reportDate: string;
  phone: string;
  guardianName: string;

  // CV (partial / full)
  fullName: string;
  email: string;
  targetJobTitle: string;
  location: string;
  summary: string;
  cvFull?: CvData;

  // Certificate
  certTitle: string;
  certIssuer: string;
  certDate: string;
  certNumber: string;
  certHolder: string;
  certSummary3Lines: string;
  certKeywords: string;

  // Evaluation
  evalTitle: string;
  evalSymptoms: string;
  evalScores: string;
  evalNotes: string;
  evalSessionTypes: string;

  // Task
  taskDay: string;
  taskText: string;
  taskOwner: string;
  taskStatus: string;

  // Single Experience
  expJobTitle: string;
  expCompany: string;
  expDateRange: string;
  expBullets: string;

  // Single Skill
  skillName: string;
  skillLevel: string;

  // Single Education
  eduDegree: string;
  eduInstitution: string;
  eduDateRange: string;
}

export interface SmartAddExtractionOutcome {
  fields: SmartAddStructuredFields;
  extractedCount: number;
  issues: SmartAddErrorIssue[];
  suggestions: SmartAddOptionalSuggestion[];
}

export function createInitialSmartAddFields(): SmartAddStructuredFields {
  return {
    childName: '[ ... ]',
    age: '[ ... ]',
    mainComplaint: '[ ... ]',
    diagnosis: '[ ... ]',
    evaluation: '[ ... ]',
    planGoal: '[ ... ]',
    recommendations: '[ ... ]',
    reportDate: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
    phone: '[ ... ]',
    guardianName: '[ ... ]',

    fullName: '[ ... ]',
    email: '[ ... ]',
    targetJobTitle: '[ ... ]',
    location: '[ ... ]',
    summary: '[ ... ]',

    certTitle: '[ ... ]',
    certIssuer: '[ ... ]',
    certDate: '[ ... ]',
    certNumber: '[ ... ]',
    certHolder: '[ ... ]',
    certSummary3Lines: '[ ... ]',
    certKeywords: '[ ... ]',

    evalTitle: 'استمارة تقييم ومتابعة',
    evalSymptoms: '[ ... ]',
    evalScores: '[ ... ]',
    evalNotes: '[ ... ]',
    evalSessionTypes: '[ ... ]',

    taskDay: 'السبت',
    taskText: '[ ... ]',
    taskOwner: '[ ... ]',
    taskStatus: 'لم يتم',

    expJobTitle: '[ ... ]',
    expCompany: '[ ... ]',
    expDateRange: '01/2023 - حتى الآن',
    expBullets: '[ ... ]',

    skillName: '[ ... ]',
    skillLevel: 'متقدم',

    eduDegree: '[ ... ]',
    eduInstitution: '[ ... ]',
    eduDateRange: '09/2018 - 06/2022',
  };
}

function isFilled(v: string | undefined): boolean {
  if (!v) return false;
  const t = v.trim();
  return Boolean(t) && t !== '[ ... ]' && t !== '...';
}

function pickLineValue(lines: string[], regex: RegExp): string {
  for (const line of lines) {
    const m = line.match(regex);
    if (m) {
      const rest = line.replace(m[0], '').replace(/^[:\-\s—]+/, '').trim();
      if (rest) return rest;
    }
  }
  return '';
}

export function extractStructuredByKindLocally(
  rawInput: string,
  kind: SmartAddKind,
  cvLanguage: CvLanguage = 'ar'
): SmartAddExtractionOutcome {
  const cleaned = cleanExtractedDocumentText(rawInput);
  const lines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const norm = toLatinDigits(cleaned);
  const fields = createInitialSmartAddFields();
  let extractedCount = 0;

  // Common regex captures
  const phoneMatch = norm.match(/(?:\+?20|0020|0)?(1[0125]\d{8}|\d{8,13})/);
  const emailMatch = cleaned.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/);
  const dateMatch = norm.match(/(?:(?:19|20)\d{2}[/-]\d{1,2}(?:[/-]\d{1,2})?|\d{1,2}[/-]\d{1,2}[/-](?:19|20)\d{2}|(?:0?[1-9]|1[0-2])\/(?:19|20)\d{2}|(?:19|20)\d{2})/);

  if (phoneMatch) fields.phone = phoneMatch[0];
  if (emailMatch) fields.email = emailMatch[0];

  if (kind === 'report' || kind === 'case') {
    const nameVal = pickLineValue(lines, /^(?:اسم\s*(?:الطفل|الحالة|الطالب|المستفيد)|الحالة|الاسم)\s*[:\-]?/i);
    if (nameVal) {
      fields.childName = nameVal;
      extractedCount += 1;
    } else if (lines[0] && lines[0].length < 55 && !/(تقرير|شكوى|التاريخ|مرجع)/i.test(lines[0])) {
      fields.childName = lines[0];
      extractedCount += 1;
    }

    const ageMatch = norm.match(/(?:العمر|السن|عمره)\s*[:\-]?\s*(\d{1,2}\s*(?:سنوات|سنة|عاماً|عام|أشهر|شهور)?)/i);
    if (ageMatch) {
      fields.age = ageMatch[1].trim();
      extractedCount += 1;
    }

    const guardianVal = pickLineValue(lines, /^(?:ولي\s*الأمر|الأب|الأم|الوصي|الوالد)\s*[:\-]?/i);
    if (guardianVal) {
      fields.guardianName = guardianVal;
      extractedCount += 1;
    }

    const complaintVal =
      pickLineValue(lines, /^(?:الشكوى(?:\s*الرئيسية)?|السبب|سبب\s*الإحالة|الملاحظة)\s*[:\-]?/i) ||
      lines.filter((l) => l.length > 20).slice(0, 2).join(' ');
    if (complaintVal) {
      fields.mainComplaint = complaintVal;
      extractedCount += 1;
    }

    const diagVal = pickLineValue(lines, /^(?:التشخيص(?:\s*المذكور)?|الحالة\s*المذكورة)\s*[:\-]?/i);
    if (diagVal) {
      fields.diagnosis = diagVal;
      extractedCount += 1;
    }

    const evalVal =
      pickLineValue(lines, /^(?:التقييم|الملاحظات\s*التقييمية|نتائج\s*التقييم)\s*[:\-]?/i) ||
      lines.filter((l) => /(انتباه|تشتت|سلوك|تواصل|تخاطب|قراءة|حسي)/i.test(l)).join(' · ');
    if (evalVal) {
      fields.evaluation = evalVal;
      extractedCount += 1;
    }

    const planVal =
      pickLineValue(lines, /^(?:الخطة|الهدف|خطة\s*العلاج|خطة\s*التدخل)\s*[:\-]?/i) ||
      lines.filter((l) => /(جلسات|تنمية|تدريب|خطة)/i.test(l)).slice(0, 2).join(' · ');
    if (planVal) {
      fields.planGoal = planVal;
      extractedCount += 1;
    }

    const recLines = lines.filter((l) =>
      /(يوصى|توصيات|المقعد|البيئة|الروتين|التعزيز|تقسيم|الدمج|توصية)/i.test(l)
    );
    if (recLines.length > 0) {
      fields.recommendations = recLines.join('\n');
      extractedCount += 1;
    }

    if (dateMatch) {
      fields.reportDate = dateMatch[0].replace(/-/g, '/');
      extractedCount += 1;
    }
    if (phoneMatch) extractedCount += 1;
  } else if (kind === 'cv') {
    const parsed = parseRawTextToCv(cleaned, cvLanguage);
    fields.fullName = parsed.cvData.fullName;
    fields.phone = parsed.cvData.phone;
    fields.email = parsed.cvData.email;
    fields.targetJobTitle = parsed.cvData.targetJobTitle;
    fields.location = parsed.cvData.location;
    fields.summary = parsed.cvData.summary;
    fields.cvFull = parsed.cvData;
    extractedCount = parsed.extractedFieldCount;
  } else if (kind === 'certificate') {
    const titleLine =
      pickLineValue(lines, /^(?:اسم\s*الشهادة|الشهادة|الدورة|البرنامج)\s*[:\-]?/i) ||
      lines.find((l) => /(شهادة|دبلوم|دورة|رخصة|ترخيص|aba|abat|certificate|diploma)/i.test(l)) ||
      lines[0] ||
      '[ ... ]';
    const issuerLine =
      pickLineValue(lines, /^(?:الجهة\s*المانحة|الجهة|المؤسسة|الجامعة|المركز)\s*[:\-]?/i) ||
      lines.find((l) => l !== titleLine && /(جامعة|مركز|مؤسسة|جمعية|أكاديمية|معهد|هيئة|university|institute)/i.test(l)) ||
      '[ ... ]';
    const numMatch = norm.match(/(?:رقم\s*(?:الشهادة|القيد|المرجع|الترخيص)|No\.?|ID)\s*[:#\-]?\s*([A-Z0-9\-\/]{4,24})/i);
    const holderVal =
      pickLineValue(lines, /^(?:تمنح\s*لـ?|اسم\s*الحاصل\s*عليها|الاسم|المتدرب|إلى)\s*[:\-]?/i) ||
      '[ ... ]';

    fields.certTitle = titleLine;
    fields.certIssuer = issuerLine;
    fields.certDate = dateMatch ? dateMatch[0].replace(/-/g, '/') : '[ ... ]';
    fields.certNumber = numMatch ? numMatch[1] : '[ ... ]';
    fields.certHolder = holderVal;

    const kws = Array.from(
      new Set(
        lines
          .join(' ')
          .match(/(?:تأهيل|تعديل\s*سلوك|تحليل\s*سلوك|علاج\s*وظيفي|تربية\s*خاصة|صعوبات\s*تعلم|تخاطب|إرشاد\s*أسري|ABAT|ABA|IEP|ATS)/gi) || []
      )
    );
    fields.certKeywords = kws.length > 0 ? kws.join('، ') : titleLine.split(/\s+/).slice(0, 4).join('، ');
    fields.certSummary3Lines = [
      `1. المسمى: ${fields.certTitle}`,
      `2. الجهة والتاريخ: ${fields.certIssuer} (${fields.certDate})`,
      `3. المجال والكلمات المفتاحية: ${fields.certKeywords}`,
    ].join('\n');

    [fields.certTitle, fields.certIssuer, fields.certDate, fields.certNumber, fields.certHolder].forEach((v) => {
      if (isFilled(v)) extractedCount += 1;
    });
  } else if (kind === 'evaluation') {
    const symptomMatches = Array.from(
      new Set(
        cleaned.match(/(?:تشتت\s*الانتباه|فرط\s*حركة|اندفاعية|تأخر\s*لغوي|صعوبة\s*نطق|حساسية\s*سمعية|قلق|تجنب\s*اجتماعي|صعوبات\s*قراءة|صعوبات\s*كتابة|عناد)/gi) || []
      )
    );
    const scoresMatch = norm.match(/(?:درجة|نسبة|تقييم|score)\s*[:\-]?\s*(\d{1,3}%?(?:\s*\/\s*\d{1,3})?)/gi);
    const sessionTypes: string[] = [];
    if (/(تخاطب|نطق|لغ)/i.test(cleaned)) sessionTypes.push('تخاطب وتنمية لغة');
    if (/(سلوك|انتباه|فرط|اندفاع|عناد)/i.test(cleaned)) sessionTypes.push('تعديل سلوك');
    if (/(حسي|سمعية|حركي|توازن)/i.test(cleaned)) sessionTypes.push('تكامل حسي');
    if (/(قراءة|كتابة|تعلم|حساب)/i.test(cleaned)) sessionTypes.push('صعوبات تعلم');
    if (/(أسرة|منزل|أم|أب)/i.test(cleaned)) sessionTypes.push('إرشاد أسري');

    fields.evalTitle = lines[0]?.slice(0, 60) || 'استمارة تقييم متخصصة';
    fields.evalSymptoms = symptomMatches.length > 0 ? symptomMatches.join('، ') : '[ ... ]';
    fields.evalScores = scoresMatch && scoresMatch.length > 0 ? scoresMatch.join(' · ') : '[ ... ]';
    fields.evalNotes = cleaned.slice(0, 360) || '[ ... ]';
    fields.evalSessionTypes = sessionTypes.length > 0 ? sessionTypes.join('، ') : '[ ... ]';

    [fields.evalSymptoms, fields.evalScores, fields.evalNotes, fields.evalSessionTypes].forEach((v) => {
      if (isFilled(v)) extractedCount += 1;
    });
  } else if (kind === 'task') {
    const dayMatch = cleaned.match(/(السبت|الأحد|الاحد|الإثنين|الاثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|يومي)/);
    if (dayMatch) {
      fields.taskDay = dayMatch[1];
      extractedCount += 1;
    }
    const ownerVal = pickLineValue(lines, /^(?:المسؤول|الأخصائي|بواسطة)\s*[:\-]?/i);
    if (ownerVal) {
      fields.taskOwner = ownerVal;
      extractedCount += 1;
    }
    const statusMatch = cleaned.match(/(لم\s*يتم|جزئي|مكتمل|منجز|(?:^|[:\s])تم(?:\s|$))/);
    if (statusMatch) {
      const rawSt = statusMatch[1].replace(/[:\s]/g, '');
      fields.taskStatus =
        rawSt === 'مكتمل' || rawSt === 'منجز' || rawSt === 'تم'
          ? 'تم'
          : rawSt === 'جزئي'
          ? 'جزئي'
          : 'لم يتم';
      extractedCount += 1;
    }
    if (lines.length > 0) {
      fields.taskText = lines.join(' — ').slice(0, 180);
      extractedCount += 1;
    }
  } else if (kind === 'experience') {
    fields.expJobTitle =
      pickLineValue(lines, /^(?:المسمى|الوظيفة|الدور)\s*[:\-]?/i) || lines[0] || '[ ... ]';
    fields.expCompany =
      pickLineValue(lines, /^(?:الجهة|الشركة|المركز|المؤسسة)\s*[:\-]?/i) ||
      lines.find((l) => /(مركز|مؤسسة|شركة|مستشفى|جامعة|academy|center)/i.test(l)) ||
      '[ ... ]';
    const expDateMatch = norm.match(/((?:0?[1-9]|1[0-2])\/)?(?:19|20)\d{2}\s*[-–—]\s*(?:(?:(?:0?[1-9]|1[0-2])\/)?(?:19|20)\d{2}|حتى الآن|الآن|Present)/i);
    if (expDateMatch) fields.expDateRange = expDateMatch[0];
    if (lines.length > 1) fields.expBullets = lines.slice(1).join('\n');
    [fields.expJobTitle, fields.expCompany, fields.expDateRange].forEach((v) => {
      if (isFilled(v)) extractedCount += 1;
    });
  } else if (kind === 'skill') {
    fields.skillName = lines[0]?.split(/[،,]/)[0]?.trim() || '[ ... ]';
    if (/(ممتاز|خبير|متقدم|advanced|expert)/i.test(cleaned)) fields.skillLevel = 'متقدم';
    else if (/(متوسط|intermediate)/i.test(cleaned)) fields.skillLevel = 'متوسط';
    if (isFilled(fields.skillName)) extractedCount += 1;
  } else if (kind === 'education') {
    fields.eduDegree =
      lines.find((l) => /(بكالوريوس|دبلوم|ماجستير|دكتوراه|ليسانس|bachelor|diploma|master)/i.test(l)) ||
      lines[0] ||
      '[ ... ]';
    fields.eduInstitution =
      lines.find((l) => /(جامعة|كلية|معهد|أكاديمية|university|college|institute)/i.test(l)) ||
      '[ ... ]';
    if (dateMatch) fields.eduDateRange = dateMatch[0];
    [fields.eduDegree, fields.eduInstitution].forEach((v) => {
      if (isFilled(v)) extractedCount += 1;
    });
  }

  const { issues, suggestions } = analyzeSmartAddErrorsAndSuggestions(fields, kind, cleaned);
  return { fields, extractedCount, issues, suggestions };
}

export function analyzeSmartAddErrorsAndSuggestions(
  fields: SmartAddStructuredFields,
  kind: SmartAddKind,
  rawText = ''
): { issues: SmartAddErrorIssue[]; suggestions: SmartAddOptionalSuggestion[] } {
  const issues: SmartAddErrorIssue[] = [];
  const suggestions: SmartAddOptionalSuggestion[] = [];

  // 1. Check phone number length
  if ((kind === 'cv' || kind === 'report' || kind === 'case') && isFilled(fields.phone)) {
    const digits = toLatinDigits(fields.phone).replace(/\D/g, '');
    if (digits.length < 8) {
      issues.push({
        id: 'err-phone-short',
        fieldKey: 'phone',
        fieldLabel: 'رقم الهاتف',
        problem: `رقم الهاتف يبدو ناقصاً (${digits.length} أرقام فقط)`,
        suggestion: 'تأكد من إدخال رقم هاتف كامل (10-11 رقماً)',
      });
    }
  }

  // 2. Check email format
  if (kind === 'cv' && isFilled(fields.email)) {
    if (!/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(fields.email.trim())) {
      issues.push({
        id: 'err-email-invalid',
        fieldKey: 'email',
        fieldLabel: 'البريد الإلكتروني',
        problem: 'صيغة البريد الإلكتروني غير مكتملة',
        suggestion: 'تحقق من وجود @ ونطاق صحيح مثل name@domain.com',
      });
    }
  }

  // 3. Important missing [ ... ] fields
  const requiredMap: Partial<Record<SmartAddKind, [keyof SmartAddStructuredFields, string][]>> = {
    report: [
      ['childName', 'اسم الحالة'],
      ['mainComplaint', 'الشكوى الرئيسية'],
    ],
    case: [
      ['childName', 'اسم الحالة'],
      ['age', 'العمر'],
    ],
    cv: [
      ['fullName', 'الاسم الكامل'],
      ['targetJobTitle', 'المسمى الوظيفي'],
      ['phone', 'الهاتف'],
    ],
    certificate: [
      ['certTitle', 'اسم الشهادة'],
      ['certIssuer', 'الجهة المانحة'],
    ],
    evaluation: [['evalSymptoms', 'الأعراض والملاحظات']],
    task: [['taskText', 'وصف المهمة']],
    experience: [['expJobTitle', 'المسمى الوظيفي للخبرة']],
    skill: [['skillName', 'اسم المهارة']],
    education: [['eduDegree', 'الدرجة العلمية']],
  };

  (requiredMap[kind] || []).forEach(([key, label]) => {
    const val = fields[key];
    if (typeof val === 'string' && !isFilled(val)) {
      issues.push({
        id: `err-missing-${String(key)}`,
        fieldKey: String(key),
        fieldLabel: label,
        problem: 'حقل مهم فارغ ([ ... ])',
        suggestion: `يرجى إدخال ${label} يدوياً دون اختراع`,
      });
    }
  });

  // 4. Date conflict checks
  const dateChecks: [string, string, string][] = [
    ['expDateRange', 'فترة الخبرة', fields.expDateRange],
    ['eduDateRange', 'فترة التعليم', fields.eduDateRange],
  ];
  dateChecks.forEach(([key, lbl, val]) => {
    const conflict = detectDateRangeConflicts(val);
    if (conflict) {
      issues.push({
        id: `err-date-${key}`,
        fieldKey: key,
        fieldLabel: lbl,
        problem: conflict,
        suggestion: 'راجع تاريخ البدء والانتهاء ليصبح البدء قبل الانتهاء',
      });
    }
  });

  if (kind === 'cv' && fields.cvFull) {
    fields.cvFull.experiences.forEach((exp, idx) => {
      const conflict = detectDateRangeConflicts(exp.dateRange);
      if (conflict) {
        issues.push({
          id: `err-cv-exp-date-${idx}`,
          fieldKey: `cvExpDate_${idx}`,
          fieldLabel: `تاريخ الخبرة #${idx + 1}`,
          problem: conflict,
          suggestion: 'تأكد من ترتيب سنة البدء وسنة الانتهاء',
        });
      }
    });

    // Detect duplicate experiences
    const seen = new Set<string>();
    fields.cvFull.experiences.forEach((exp, idx) => {
      const sig = `${exp.jobTitle.trim().toLowerCase()}|${exp.company.trim().toLowerCase()}`;
      if (sig && !sig.startsWith('[') && seen.has(sig)) {
        issues.push({
          id: `err-cv-dup-exp-${idx}`,
          fieldKey: `cvExpDup_${idx}`,
          fieldLabel: `الخبرة #${idx + 1}`,
          problem: `تكرار نفس الخبرة مرتين: ${exp.jobTitle}`,
          suggestion: 'حذف التكرار أو دمجه مع الخبرة الأصلية',
        });
      }
      seen.add(sig);
    });
  }

  // 5. Spelling fix suggestions on key text fields (applied only on click!)
  const spellKeys: [keyof SmartAddStructuredFields, string][] = [
    ['childName', 'اسم الحالة'],
    ['mainComplaint', 'الشكوى الرئيسية'],
    ['evaluation', 'التقييم'],
    ['planGoal', 'الخطة'],
    ['recommendations', 'التوصيات'],
    ['fullName', 'الاسم الكامل'],
    ['targetJobTitle', 'المسمى الوظيفي'],
    ['summary', 'الملخص المهني'],
    ['certTitle', 'اسم الشهادة'],
    ['certIssuer', 'الجهة المانحة'],
    ['expJobTitle', 'المسمى الوظيفي'],
    ['eduDegree', 'الدرجة العلمية'],
  ];

  spellKeys.forEach(([key, label]) => {
    const val = fields[key];
    if (typeof val !== 'string' || !isFilled(val)) return;
    const corrected = fixPunctuationAndSpacing(fixSpellingInText(val));
    if (corrected !== val) {
      issues.push({
        id: `err-spell-${String(key)}`,
        fieldKey: String(key),
        fieldLabel: label,
        problem: 'كلمة أو مسافة أو همزة تحتاج توحيد إملائي',
        suggestion: corrected,
        fixValue: corrected,
      });
    }
  });

  // 6. Optional non-intrusive additions
  if (kind === 'cv' || kind === 'skill') {
    const detectedSkills = ['تعديل السلوك', 'الإرشاد الأسري', 'التكامل الحسي', 'إعداد الخطط الفردية (IEP)'];
    detectedSkills.forEach((sk, idx) => {
      if (rawText && rawText.includes(sk.split(' ')[0])) {
        suggestions.push({
          id: `sug-sk-${idx}`,
          kind: 'skill',
          label: `إضافة مهارة مقترحة: ${sk}`,
          value: sk,
        });
      }
    });
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'sug-exp-detail',
        kind: 'experience-detail',
        label: 'إضافة تفصيل قياسي للإنجاز: "تحقيق تحسن بنسبة [ ... ]% في مؤشرات الأداء"',
        value: 'تحقيق تحسن بنسبة [ ... ]% في مؤشرات الأداء والمتابعة الدورية',
      });
    }
  }

  if (kind === 'report' || kind === 'case' || kind === 'evaluation') {
    suggestions.push(
      {
        id: 'sug-rec-1',
        kind: 'recommendation',
        label: 'إضافة توصية مقترحة: اعتماد جدول روتيني يومي واضح وتقسيم المهام',
        value: 'اعتماد جدول روتيني يومي واضح وتقسيم المهام التعليمية إلى وحدات قصيرة.',
      },
      {
        id: 'sug-rec-2',
        kind: 'recommendation',
        label: 'إضافة توصية مقترحة: المتابعة الدورية بين الأخصائي وولي الأمر والمدرسة',
        value: 'المتابعة الدورية المشتركة بين الأخصائي وولي الأمر والمدرسة لتوحيد أساليب الدعم.',
      }
    );
  }

  if (kind === 'certificate') {
    suggestions.push({
      id: 'sug-cert-skill',
      kind: 'skill',
      label: `إضافة مهارة مستخلصة من الشهادة: ${fields.certKeywords || fields.certTitle}`,
      value: fields.certKeywords !== '[ ... ]' ? fields.certKeywords : fields.certTitle,
    });
  }

  return { issues, suggestions };
}

export function getThreeFieldSuggestions(fieldLabel: string, currentValue: string): {
  title: string;
  preview: string;
}[] {
  const clean = fixPunctuationAndSpacing(fixSpellingInText(currentValue || '[ ... ]'));
  return [
    {
      title: 'صياغة مهنية أقوى وأكثر وضوحاً',
      preview:
        clean && clean !== '[ ... ]'
          ? `${clean} — وفق معايير المتابعة والتقييم المهني المعتمدة`
          : `صياغة قياسية واضحة لقسم (${fieldLabel}): [ ... ]`,
    },
    {
      title: 'إضافة قالب نتيجة رقمية قابل للاستكمال',
      preview:
        clean && clean !== '[ ... ]'
          ? `${clean} (بنسبة إنجاز [ ... ]% خلال [ ... ] أسابيع)`
          : `${fieldLabel}: تحقيق تقدم بنسبة [ ... ]% خلال مدة [ ... ]`,
    },
    {
      title: 'تقصير واختصار الجملة بصيغة مركزة',
      preview:
        clean && clean !== '[ ... ]'
          ? clean.split(/\s+/).slice(0, 12).join(' ') +
            (clean.split(/\s+/).length > 12 ? '.' : '')
          : '[ ... ]',
    },
  ];
}
