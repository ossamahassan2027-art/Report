import {
  CV_FONT_OPTIONS,
  CvData,
  CvFontId,
  CvLanguage,
  DEFAULT_OSAMA_ATS_KEYWORDS,
} from '../types/cv';

export type CvGoalMode = 'job' | 'center' | 'academic';

export interface CvFieldConfidenceBadge {
  field: string;
  label: string;
  value: string;
  status: 'confirmed' | 'review' | 'missing';
}

export function normalizeArabicTextStrict(raw: string): string {
  if (!raw) return '';
  let text = raw
    .replace(/\[\s*\.\.\.\s*\]/g, '')
    .replace(/…{2,}/g, '')
    .replace(/\u200E|\u200F|\u202A|\u202B|\u202C/g, '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Fix RTL bracket reversal & spaced punctuation
  text = text
    .replace(/\s+([،؛:.!؟])/g, '$1')
    .replace(/([،؛:])(?=[^\s\d])/g, '$1 ');

  // Normalize common Arabic hamza & final ta marbuta / ya slips safely
  const fixes: [RegExp, string][] = [
    [/(^|\s)إدارة(?=\s)/g, '$1إدارة'],
    [/(^|\s)ادارة(?=\s|$)/g, '$1إدارة'],
    [/(^|\s)اخصائي(?=\s|$)/g, '$1أخصائي'],
    [/(^|\s)اخصائيه(?=\s|$)/g, '$1أخصائية'],
    [/(^|\s)تاهيل(?=\s|$)/g, '$1تأهيل'],
    [/(^|\s)تاكيد(?=\s|$)/g, '$1تأكيد'],
    [/(^|\s)افادة(?=\s|$)/g, '$1إفادة'],
    [/(^|\s)ارشاد(?=\s|$)/g, '$1إرشاد'],
    [/(^|\s)اشراف(?=\s|$)/g, '$1إشراف'],
    [/(^|\s)انجاز(?=\s|$)/g, '$1إنجاز'],
    [/(^|\s)الان(?=\s|$)/g, '$1الآن'],
    [/(^|\s)حتي(?=\s|$)/g, '$1حتى'],
    [/(^|\s)الي(?=\s|$)/g, '$1إلى'],
    [/(^|\s)علي(?=\s|$)/g, '$1على'],
    [/التربيه/g, 'التربية'],
    [/التنميه/g, 'التنمية'],
    [/الخاصه/g, 'الخاصة'],
    [/الفرديه/g, 'الفردية'],
    [/الوظيفيه/g, 'الوظيفية'],
    [/السلوكيه/g, 'السلوكية'],
    [/المهنيه/g, 'المهنية'],
  ];

  for (const [re, rep] of fixes) {
    text = text.replace(re, rep);
  }
  return text.replace(/[ \t]{2,}/g, ' ').trim();
}

export function getFontCssFamily(fontId?: CvFontId): string {
  const found = CV_FONT_OPTIONS.find((f) => f.id === fontId);
  return found ? found.cssFamily : "'Cairo', 'Tajawal', Arial, sans-serif";
}

export function evaluateCvFieldConfidences(cv: CvData): CvFieldConfidenceBadge[] {
  const check = (val: string | undefined): 'confirmed' | 'review' | 'missing' => {
    const clean = (val || '').trim();
    if (!clean || clean === '[ ... ]' || clean === '[ غير موجود ]') return 'missing';
    if (clean.length < 4 || /\?{2,}|~|@/.test(clean.replace(cv.email, ''))) return 'review';
    return 'confirmed';
  };

  return [
    { field: 'fullName', label: 'الاسم الكامل', value: cv.fullName, status: check(cv.fullName) },
    {
      field: 'targetJobTitle',
      label: 'المسمى الوظيفي',
      value: cv.targetJobTitle,
      status: check(cv.targetJobTitle),
    },
    { field: 'phone', label: 'الهاتف', value: cv.phone, status: check(cv.phone) },
    { field: 'email', label: 'الإيميل', value: cv.email, status: check(cv.email) },
    { field: 'location', label: 'العنوان', value: cv.location, status: check(cv.location) },
    { field: 'summary', label: 'الملخص المهني', value: cv.summary, status: check(cv.summary) },
  ];
}

export function markMissingFieldsExplicitly(cv: CvData): CvData {
  const fillMissing = (v: string | undefined) => {
    const t = (v || '').trim();
    return !t || t === '[ ... ]' ? '[ غير موجود ]' : t;
  };
  return {
    ...cv,
    fullName: fillMissing(cv.fullName),
    targetJobTitle: fillMissing(cv.targetJobTitle),
    phone: fillMissing(cv.phone),
    email: fillMissing(cv.email),
    location: fillMissing(cv.location),
    summary: fillMissing(cv.summary),
  };
}

// 3 Phrasing Versions Generator for [ ✨ تحسين ذكي ] & Summary Generator
export function generateThreeSummaryVersions(
  cv: CvData,
  language: CvLanguage,
  goalMode: CvGoalMode = 'job'
): { id: string; label: string; text: string }[] {
  const title = cv.targetJobTitle && !cv.targetJobTitle.includes('[')
    ? cv.targetJobTitle
    : 'مدير ومشرف فني وأخصائي علاج وظيفي (ABAT)';
  const years = cv.yearsOfExperience || 'أكثر من 20 عام';
  const topSkills = cv.skills
    .slice(0, 5)
    .map((s) => s.name)
    .filter((s) => s && !s.includes('['));
  const kwText = (cv.atsKeywords?.length ? cv.atsKeywords : DEFAULT_OSAMA_ATS_KEYWORDS)
    .slice(0, 6)
    .join('، ');

  if (language === 'en') {
    return [
      {
        id: 'v-exec',
        label: 'Executive Leadership Version',
        text: `Results-driven ${title} with ${years} of progressive leadership in rehabilitation centers management, occupational therapy, motor rehabilitation, and Applied Behavior Analysis (ABAT). Proven track record directing multidisciplinary clinical teams, developing diagnostic assessments and Individualized Education Plans (IEP), and empowering families and staff.`,
      },
      {
        id: 'v-ats',
        label: 'ATS Keyword-Rich Version',
        text: `Certified ${title} bringing ${years} of clinical and supervisory expertise across pediatric rehabilitation, People of Determination care, sensory integration, behavior modification, family counseling, and staff capacity building (${topSkills.slice(0, 4).join(', ')}). Committed to measurable outcomes and global rehabilitation quality standards.`,
      },
      {
        id: 'v-concise',
        label: 'High-Impact Concise Version',
        text: `Senior ${title} (${years} experience) specializing in occupational therapy, motor rehabilitation, ABAT behavioral interventions, and center technical direction. Skilled in leading teams, designing individualized treatment programs, and mentoring rehabilitation specialists.`,
      },
    ];
  }

  const goalFocus =
    goalMode === 'center'
      ? 'وتطوير وإدارة مراكز التأهيل والإشراف الفني وبناء أنظمة الجودة الشاملة'
      : goalMode === 'academic'
        ? 'والتدريب المهني وإعداد الحقائب التدريبية وتطبيق المقاييس التشخيصية المعتمدة'
        : 'وتنفيذ الجلسات العلاجية الفردية وخطط تعديل السلوك وتحقيق نتائج قابلة للقياس';

  return [
    {
      id: 'v-exec',
      label: 'الصياغة القيادية الرسمية',
      text: `قيادي واستشاري تأهيل (${title}) بخبرة ميدانية تتجاوز ${years} في إدارة مراكز التأهيل والإشراف الفني، وقيادة الفرق متعددة التخصصات، ${goalFocus}. نجح في تأسيس وتطوير منظومات التشخيص والتقييم والخطط الفردية وتدريب كوادر التأهيل وفق أعلى المعايير المؤسسية وأنظمة تتبع المتقدمين (ATS).`,
    },
    {
      id: 'v-ats',
      label: 'الصياغة المكثفة بكلمات ATS',
      text: `${title} بخبرة ${years}، متخصص في ${kwText}. يمتلك سجلاً حافلاً في تأهيل أطفال ذوي الهمم، وتصميم الخطط التربوية الفردية، وتطبيق برامج التكامل الحسي وتعديل السلوك والإرشاد الأسري، مع إتقان أدوات الإدارة الرقمية والذكاء الاصطناعي.`,
    },
    {
      id: 'v-action',
      label: 'الصياغة الإنجازية المختصرة',
      text: `أخصائي ومدير فني (${years} خبرة) جمع بين العلاج الوظيفي والتأهيل الحركي وتحليل السلوك التطبيقي (ABAT). قاد مبادرات مجتمعية وتأهيلية كبرى، وأسس برامج تدريب كوادر وبناء خطط فردية متكاملة تحقق تطوراً ملموساً واستدامة في جودة الرعاية.`,
    },
  ];
}

// Strong action verbs enhancement for experience bullets
const WEAK_TO_STRONG_AR: [RegExp, string][] = [
  [/^العمل على\s+/g, 'قاد ونفّذ بنجاح '],
  [/^مسؤول عن\s+/g, 'أدار وأشرف فنياً على '],
  [/^المساعدة في\s+/g, 'ساهم بفاعلية في تطوير '],
  [/^عمل في\s+/g, 'باشر بكفاءة مهام '],
  [/^تقديم\s+/g, 'قدّم وطوّر '],
  [/^تنظيم\s+/g, 'نظّم وهيكَل '],
];

export function enhanceCvWithActionVerbs(
  cv: CvData,
  language: CvLanguage,
  goalMode: CvGoalMode = 'job'
): CvData {
  const summaries = generateThreeSummaryVersions(cv, language, goalMode);
  const existingKwSet = new Set(cv.skills.map((s) => s.name.trim().toLowerCase()));
  const missingCoreKeywords = DEFAULT_OSAMA_ATS_KEYWORDS.filter(
    (k) => !existingKwSet.has(k.toLowerCase())
  ).slice(0, 4);

  const enhancedExperiences = cv.experiences.map((exp) => ({
    ...exp,
    jobTitle: normalizeArabicTextStrict(exp.jobTitle),
    company: normalizeArabicTextStrict(exp.company),
    bullets: exp.bullets.map((b) => {
      let next = normalizeArabicTextStrict(b);
      if (language === 'ar') {
        for (const [re, rep] of WEAK_TO_STRONG_AR) {
          next = next.replace(re, rep);
        }
        if (
          next &&
          !/^(قاد|أدار|طوّر|صمّم|نفّذ|أشرف|أسّس|درّب|قدّم|نسّق|حسّن|طبّق|أعدّ|حقّق)/.test(next)
        ) {
          next = `نفّذ وطبّق بكفاءة: ${next}`;
        }
      } else if (
        next &&
        !/^(Led|Directed|Managed|Designed|Implemented|Supervised|Trained|Coordinated|Delivered|Built|Developed)/i.test(
          next
        )
      ) {
        next = `Delivered and managed: ${next}`;
      }
      return next;
    }),
  }));

  const appendedSkills = missingCoreKeywords.map((kw, idx) => ({
    id: `sk-ats-${Date.now()}-${idx}`,
    name: kw,
    level: language === 'ar' ? 'متقدم' : 'Advanced',
  }));

  return {
    ...cv,
    summary: summaries[0].text,
    experiences: enhancedExperiences,
    skills: [...cv.skills, ...appendedSkills],
    atsKeywords: Array.from(
      new Set([...(cv.atsKeywords || []), ...DEFAULT_OSAMA_ATS_KEYWORDS])
    ),
  };
}

export interface SmartSuggestionPack {
  id: string;
  goal: CvGoalMode;
  categoryLabel: string;
  text: string;
  targetSection: 'summary' | 'experience' | 'skill';
}

export function getFiveSpecialtySuggestions(
  specialtyInput: string,
  goal: CvGoalMode
): SmartSuggestionPack[] {
  const spec = specialtyInput.toLowerCase();
  const isBehaviorOrSpeech = /(سلوك|تخاطب|توحد|abat|aba|وظيفي|تأهيل|همم)/.test(spec);

  if (goal === 'center') {
    return [
      {
        id: 'sug-c1',
        goal,
        categoryLabel: 'إدارة مراكز التأهيل',
        targetSection: 'experience',
        text: 'تأسيس وتطوير منظومة الإشراف الفني وبناء مؤشرات الأداء اليومية لأقسام التخاطب والعلاج الوظيفي وتعديل السلوك.',
      },
      {
        id: 'sug-c2',
        goal,
        categoryLabel: 'جودة واعتماد',
        targetSection: 'summary',
        text: 'وضع أدلة التشغيل القياسية وبروتوكولات استقبال الحالات وتقييم الخطط التربوية والتأهيلية الفردية بدقة عالية.',
      },
      {
        id: 'sug-c3',
        goal,
        categoryLabel: 'تدريب الكوادر',
        targetSection: 'experience',
        text: 'إعداد وتنفيذ برامج تدريب عملي مستمرة للأخصائيين الجدد ورفع كفاءة التوثيق المهني والتقارير الدورية.',
      },
      {
        id: 'sug-c4',
        goal,
        categoryLabel: 'شراكة مجتمعية',
        targetSection: 'experience',
        text: 'بناء شراكات مؤسسية فعالة مع المديريات والهيئات الداعمة لأصحاب الهمم لتوسيع نطاق خدمات الدمج.',
      },
      {
        id: 'sug-c5',
        goal,
        categoryLabel: 'مهارة قيادية ATS',
        targetSection: 'skill',
        text: 'إدارة مراكز تأهيل وإشراف فني',
      },
    ];
  }

  if (goal === 'academic') {
    return [
      {
        id: 'sug-a1',
        goal,
        categoryLabel: 'محاضرات وورش عمل',
        targetSection: 'experience',
        text: 'تصميم وتقديم حقائب تدريبية معتمدة ومحاضرات علمية تطبيقية في التأهيل الحركي وتعديل السلوك التطبيقي.',
      },
      {
        id: 'sug-a2',
        goal,
        categoryLabel: 'تشخيص ومقاييس',
        targetSection: 'summary',
        text: 'تطبيق وتفسير مقاييس التقييم النمائية والحسية والوظيفية وصياغة التقارير التشخيصية الأكاديمية المحكمة.',
      },
      {
        id: 'sug-a3',
        goal,
        categoryLabel: 'أدلة تدريبية',
        targetSection: 'experience',
        text: 'إعداد مراجع تطبيقية وبروتوكولات تدريب كوادر مبنية على الأدلة العلمية العالمية المعتمدة.',
      },
      {
        id: 'sug-a4',
        goal,
        categoryLabel: 'استشارات بحثية',
        targetSection: 'experience',
        text: 'تحكيم ومراجعة البرامج التأهيلية والخطط الفردية وتقديم استشارات علمية متخصصة للأسر والباحثين.',
      },
      {
        id: 'sug-a5',
        goal,
        categoryLabel: 'مهارة علمية ATS',
        targetSection: 'skill',
        text: 'تشخيص وتقييم وإعداد حقائب تدريبية',
      },
    ];
  }

  // Default: Job / Clinical Practice
  return [
    {
      id: 'sug-j1',
      goal,
      categoryLabel: isBehaviorOrSpeech ? 'علاج وظيفي وتأهيل' : 'ممارسة سريرية',
      targetSection: 'experience',
      text: 'تصميم وتنفيذ خطط علاج وظيفي وتأهيل حركي وتكامل حسي فردية لتحسين الاستقلالية الوظيفية بنسبة ملحوظة.',
    },
    {
      id: 'sug-j2',
      goal,
      categoryLabel: 'تحليل سلوك ABAT',
      targetSection: 'experience',
      text: 'تطبيق فنيات تحليل السلوك التطبيقي (ABAT) والتعزيز التفاضلي وضبط المثيرات في الجلسات الفردية والجماعية.',
    },
    {
      id: 'sug-j3',
      goal,
      categoryLabel: 'تواصل وإرشاد أسري',
      targetSection: 'experience',
      text: 'تقديم جلسات إرشاد أسري منتظمة وتدريب أولياء الأمور على استراتيجيات التطبيق المنزلي والمتابعة اليومية.',
    },
    {
      id: 'sug-j4',
      goal,
      categoryLabel: 'هدف وظيفي مركز',
      targetSection: 'summary',
      text: 'العمل ضمن مؤسسة رائدة في رعاية وتأهيل ذوي الهمم لتطبيق خبرة +20 عاماً في العلاج الوظيفي والإشراف الفني.',
    },
    {
      id: 'sug-j5',
      goal,
      categoryLabel: 'مهارة تخصصية ATS',
      targetSection: 'skill',
      text: 'تكامل حسي وتعديل سلوك وإرشاد أسري',
    },
  ];
}

export const READY_CV_SENTENCE_LIBRARY: Record<CvGoalMode, string[]> = {
  job: [
    'تصميم وتنفيذ الخطط الفردية (IEP) وبرامج التأهيل الحركي والعلاج الوظيفي وفق معايير الجودة.',
    'تحليل السلوك التطبيقي (ABAT) وخفض السلوكيات غير المرغوبة مع تعزيز المهارات التكيفية.',
    'إجراء التقييمات المبدئية والدورية وتوثيق مؤشرات التقدم باستخدام أدوات التحليل الرقمية.',
    'التعاون مع الفريق متعدد التخصصات وتوجيه الأسرة لتطبيق الخطط المنزلية بفعالية.',
  ],
  center: [
    'قيادة وتطوير فرق العمل التأهيلية وتوزيع الحالات ومتابعة الخطط العلاجية الأسبوعية والشهرية.',
    'إدارة العمليات الفنية والإدارية وضمان تطبيق أعلى معايير السلامة والجودة لأصحاب الهمم.',
    'تأهيل وتدريب الأخصائيين الجدد وبناء نظام متكامل لتقييم الأداء وجودة التقارير.',
    'تنسيق البرامج والشراكات المجتمعية مع المؤسسات الحكومية والهيئات الإقليمية.',
  ],
  academic: [
    'تقديم المحاضرات العلمية وورش العمل التدريبية المتخصصة في مجالات التأهيل والتربية الخاصة.',
    'تطبيق وتقنين أدوات التشخيص والتقييم وبناء برامج التدخل المبكر المبنية على الأدلة.',
    'الإشراف الميداني على المتدربين والباحثين ومراجعة دراسات الحالة والتقارير العلمية.',
    'إعداد الأدلة الإرشادية والمحتوى التدريبي الموجه للكوادر المتخصصة وأولياء الأمور.',
  ],
};

export interface CvQualityReport {
  score: number;
  passedCount: number;
  totalChecks: number;
  checks: { id: string; label: string; ok: boolean; tip: string }[];
}

export function runFullCvQualityAudit100(cv: CvData): CvQualityReport {
  const hasReal = (s: string | undefined) =>
    Boolean(s && s.trim() && !s.includes('[ ... ]') && !s.includes('[ غير موجود ]'));
  const checks = [
    {
      id: 'q-contact',
      label: 'اكتمال بيانات التواصل الأساسية (الاسم، الهاتف، الإيميل، العنوان)',
      ok: hasReal(cv.fullName) && hasReal(cv.phone) && hasReal(cv.email) && hasReal(cv.location),
      tip: 'تأكد من وجود رقم هاتف دولي صحيح وبريد إلكتروني مهني وعنوان واضح.',
    },
    {
      id: 'q-title',
      label: 'المسمى الوظيفي دقيق ومحتوٍ على التخصصات المحورية',
      ok: hasReal(cv.targetJobTitle) && cv.targetJobTitle.length >= 10,
      tip: 'أضف المسمى الوظيفي الصريح والتخصص (مثل مدير فني / أخصائي علاج وظيفي / ABAT).',
    },
    {
      id: 'q-summary',
      label: 'الملخص المهني مكتوب بأسلوب إنجازي غني بالكلمات المفتاحية',
      ok: hasReal(cv.summary) && cv.summary.length >= 90,
      tip: 'اجعل الملخص بين 3 إلى 4 أسطر واضحة تبرز سنوات الخبرة وأهم النتائج.',
    },
    {
      id: 'q-exp',
      label: 'الخبرات العملية واضحة مع تواريخ متسقة ونقاط إنجاز',
      ok:
        cv.experiences.length >= 1 &&
        cv.experiences.every((e) => hasReal(e.jobTitle) && e.bullets.some((b) => hasReal(b))),
      tip: 'أضف نقطتي إنجاز بأفعال قوية لكل خبرة عمل.',
    },
    {
      id: 'q-edu-skills',
      label: 'اكتمال التعليم والمهارات والشهادات واللغات',
      ok: cv.education.length >= 1 && cv.skills.length >= 5 && cv.languages.length >= 1,
      tip: 'أدرج المؤهل الجامعي مع 5 مهارات تخصصية على الأقل متوافقة مع ATS.',
    },
    {
      id: 'q-ats-kw',
      label: 'تضمين الكلمات المفتاحية التخصصية لاجتياز فرز ATS',
      ok:
        DEFAULT_OSAMA_ATS_KEYWORDS.filter((k) =>
          JSON.stringify(cv).toLowerCase().includes(k.toLowerCase())
        ).length >= 5,
      tip: 'استخدم زر [ ✨ تحسين ذكي ] لإدراج الكلمات التخصصية غير الموجودة.',
    },
  ];
  const passedCount = checks.filter((c) => c.ok).length;
  const score = Math.round((passedCount / checks.length) * 100);
  return { score, passedCount, totalChecks: checks.length, checks };
}
