export type CvLanguage = 'ar' | 'en';

export type CvTemplateId =
  | 'ats-classic'
  | 'ats-executive'
  | 'ats-academic'
  | 'ats-skills-forward';

// Extended 8 visual templates requested for CV Studio (strictly keeping ATS-compliant headings)
export type CvVisualTemplateId =
  | 'classic'
  | 'modern'
  | 'creative'
  | 'medical'
  | 'academic'
  | 'ats'
  | 'infographic'
  | 'luxury-arabic';

export type CvFontId =
  | 'cairo'
  | 'tajawal'
  | 'almarai'
  | 'amiri'
  | 'ibm-plex'
  | 'arial'
  | 'calibri'
  | 'times'
  | 'arabic-classic'
  | 'modern-clean';

export type CvDisplayMode = 'ar' | 'en' | 'bilingual';

export type CvCustomFieldType = 'text' | 'date' | 'link' | 'list' | 'image' | 'file';

export interface CvCustomField {
  id: string;
  type: CvCustomFieldType;
  label: string;
  value: string;
  fileName?: string;
}

export interface CvCustomSection {
  id: string;
  title: string;
  items: string[];
  hidden?: boolean;
}

export interface CvDesignConfig {
  visualTemplate: CvVisualTemplateId;
  accentColor: string;
  columns: 1 | 2;
  photoPosition: 'right' | 'left' | 'top' | 'none';
  fontId: CvFontId;
  displayMode: CvDisplayMode;
  fontSizeScale?: 'compact' | 'standard' | 'large';
}

export const CV_FONT_OPTIONS: { id: CvFontId; label: string; cssFamily: string }[] = [
  { id: 'cairo', label: 'Cairo (كايرو)', cssFamily: "'Cairo', Arial, sans-serif" },
  { id: 'tajawal', label: 'Tajawal (تجوال)', cssFamily: "'Tajawal', Arial, sans-serif" },
  { id: 'almarai', label: 'Almarai (المراعي)', cssFamily: "'Almarai', Arial, sans-serif" },
  { id: 'amiri', label: 'Amiri (أميري)', cssFamily: "'Amiri', Georgia, serif" },
  {
    id: 'ibm-plex',
    label: 'IBM Plex Arabic',
    cssFamily: "'IBM Plex Sans Arabic', Arial, sans-serif",
  },
  { id: 'arial', label: 'Arial', cssFamily: 'Arial, Helvetica, sans-serif' },
  { id: 'calibri', label: 'Calibri', cssFamily: "Calibri, 'Segoe UI', Arial, sans-serif" },
  { id: 'times', label: 'Times New Roman', cssFamily: "'Times New Roman', Georgia, serif" },
  {
    id: 'arabic-classic',
    label: 'عربي كلاسيك (تراثي)',
    cssFamily: "'Amiri', 'Traditional Arabic', serif",
  },
  {
    id: 'modern-clean',
    label: 'عصري احترافي',
    cssFamily: "'Cairo', 'Tajawal', 'IBM Plex Sans Arabic', sans-serif",
  },
];

export const CV_VISUAL_TEMPLATES: {
  id: CvVisualTemplateId;
  nameAr: string;
  badge: string;
  descriptionAr: string;
  defaultColor: string;
  defaultColumns: 1 | 2;
  mappedAtsId: CvTemplateId;
}[] = [
  {
    id: 'classic',
    nameAr: 'كلاسيك رسمي',
    badge: 'كلاسيك',
    descriptionAr: 'تنسيق متوازن كلاسيكي مناسب للجهات الحكومية والإدارية.',
    defaultColor: '#1E3A8A',
    defaultColumns: 1,
    mappedAtsId: 'ats-classic',
  },
  {
    id: 'modern',
    nameAr: 'عصري حديث',
    badge: 'عصري',
    descriptionAr: 'شريط رأسي نظيف وفواصل أفقية عصرية تبرز الإنجازات.',
    defaultColor: '#2563EB',
    defaultColumns: 2,
    mappedAtsId: 'ats-executive',
  },
  {
    id: 'creative',
    nameAr: 'إبداعي مميز',
    badge: 'إبداعي',
    descriptionAr: 'توزيع بصري أنيق للمدربين والمحاضرين ومطوري البرامج.',
    defaultColor: '#7C3AED',
    defaultColumns: 2,
    mappedAtsId: 'ats-skills-forward',
  },
  {
    id: 'medical',
    nameAr: 'طبي وتأهيلي',
    badge: 'طبي',
    descriptionAr: 'مصمم لأخصائيي العلاج الوظيفي والتأهيل الحركي وتحليل السلوك.',
    defaultColor: '#0F766E',
    defaultColumns: 1,
    mappedAtsId: 'ats-academic',
  },
  {
    id: 'academic',
    nameAr: 'أكاديمي وبحثي',
    badge: 'أكاديمي',
    descriptionAr: 'يركز على المؤهلات والخبرات الإشرافية والمحاضرات العلمية.',
    defaultColor: '#1E293B',
    defaultColumns: 1,
    mappedAtsId: 'ats-academic',
  },
  {
    id: 'ats',
    nameAr: 'ATS قياسي 100%',
    badge: 'ATS 100%',
    descriptionAr: 'عمود واحد قياسي بدون جداول معقدة لمرور أنظمة الفرز الآلي بنسبة 100%.',
    defaultColor: '#111827',
    defaultColumns: 1,
    mappedAtsId: 'ats-classic',
  },
  {
    id: 'infographic',
    nameAr: 'انفوجرافيك ذكي',
    badge: 'انفوجرافيك',
    descriptionAr: 'عمودان ببطاقة تواصل جانبية ومؤشرات واضحة للخبرات والمهارات.',
    defaultColor: '#0284C7',
    defaultColumns: 2,
    mappedAtsId: 'ats-skills-forward',
  },
  {
    id: 'luxury-arabic',
    nameAr: 'عربي فاخر',
    badge: 'فاخر',
    descriptionAr: 'خطوط أميري وكايرو مع إطار علوي أنيق باللون الكحلي والذهبي.',
    defaultColor: '#0A1633',
    defaultColumns: 1,
    mappedAtsId: 'ats-executive',
  },
];

export const DEFAULT_CV_DESIGN_CONFIG: CvDesignConfig = {
  visualTemplate: 'ats',
  accentColor: '#1E3A8A',
  columns: 1,
  photoPosition: 'none',
  fontId: 'cairo',
  displayMode: 'ar',
  fontSizeScale: 'standard',
};

export interface CvExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  dateRange: string; // Consistent format: MM/YYYY - MM/YYYY or MM/YYYY - حتى الآن / Present
  bullets: string[];
}

export interface CvEducationItem {
  id: string;
  degree: string;
  institution: string;
  dateRange: string;
  details: string;
}

export interface CvSkillItem {
  id: string;
  name: string;
  level: string; // Plain text e.g. متقدم / متوسط / Advanced / Intermediate
}

export interface CvCertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string; // Consistent format e.g. 05/2023
}

export interface CvLanguageItem {
  id: string;
  name: string;
  proficiency: string; // e.g. اللغة الأم / جيد جداً / Native / Fluent
}

export interface CvTrainingItem {
  id: string;
  title: string;
  provider: string;
  dateRange: string;
}

export interface CvData {
  fullName: string;
  targetJobTitle: string;
  phone: string;
  email: string;
  location: string;
  websiteOrLink: string;
  summary: string;
  experiences: CvExperienceItem[];
  education: CvEducationItem[];
  skills: CvSkillItem[];
  certifications: CvCertificationItem[];
  languages: CvLanguageItem[];
  trainings: CvTrainingItem[];
  jobDescriptionText: string;
  targetOrganization?: string;
  targetSector?: string;
  experienceLevel?: string;
  personalPhotoDataUrl?: string;
  showPhotoInCv?: boolean;
  yearsOfExperience?: string;
  atsKeywords?: string[];
  customFields?: CvCustomField[];
  customSections?: CvCustomSection[];
  sectionOrder?: string[];
  hiddenSections?: string[];
  designConfig?: CvDesignConfig;
}

export type CvImportPresetFilter = 'all' | 'word' | 'pdf' | 'image' | 'text';

export interface ExtractedCertificateSummary {
  docType: string;
  title: string;
  issuer: string;
  year: string;
  keywordSkill: string;
}

export interface ExtractedJobAdSummary {
  jobTitle: string;
  organization: string;
  sector: string;
  cleanedText: string;
  keywords: string[];
}

export const DEFAULT_TARGET_ENTITIES: string[] = [
  'مدارس دولية ولغات',
  'مراكز الرعاية والتربية الخاصة',
  'مؤسسة زايد العليا لأصحاب الهمم / مؤسسات دولية',
  'وزارة الشباب والرياضة / وزارة التربية والتعليم',
  'مستشفيات ومراكز تأهيل متخصصة',
  'شركات كبرى ومؤسسات خاصة',
];

export const DEFAULT_CAREER_SECTORS: string[] = [
  'العلاج الوظيفي والتأهيل الحركي',
  'تحليل السلوك التطبيقي (ABAT / ABA)',
  'إدارة مراكز التأهيل والإشراف الفني',
  'التربية الخاصة وتعديل السلوك',
  'التعليم والتدريس والمناهج',
  'القطاع الطبي والصحي',
  'الإدارة والموارد البشرية',
  'التدريب وإعداد الكوادر',
];

export const DEFAULT_EXPERIENCE_LEVELS: Record<CvLanguage, string[]> = {
  ar: [
    'حديث التخرج (0 - 2 سنة)',
    'مستوى متوسط (2 - 5 سنوات)',
    'أخصائي أول / خبير (5 - 10 سنوات)',
    'قيادي / استشاري (+20 عام خبرة)',
  ],
  en: [
    'Entry Level (0 - 2 years)',
    'Mid Level (2 - 5 years)',
    'Senior / Specialist (5 - 10 years)',
    'Executive / Consultant (20+ years)',
  ],
};

export interface SavedCvRecord {
  id: string;
  name: string;
  updatedAt: string;
  language: CvLanguage;
  templateId: CvTemplateId;
  arData: CvData;
  enData: CvData;
}

// Exact mandatory standard section headings — fixed order, plain characters only
export const ATS_SECTION_ORDER = [
  'summary',
  'experience',
  'education',
  'skills',
  'certifications',
  'languages',
  'training',
] as const;

export type AtsSectionKey = (typeof ATS_SECTION_ORDER)[number];

export const ATS_EXACT_HEADINGS: Record<CvLanguage, Record<AtsSectionKey, string>> = {
  ar: {
    summary: 'الملخص المهني',
    experience: 'الخبرات العملية',
    education: 'التعليم',
    skills: 'المهارات',
    certifications: 'الشهادات',
    languages: 'اللغات',
    training: 'الدورات التدريبية',
  },
  en: {
    summary: 'Professional Summary',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    certifications: 'Certifications',
    languages: 'Languages',
    training: 'Training',
  },
};

export interface CvTemplateDefinition {
  id: CvTemplateId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  headerAlign: 'right' | 'center';
  sectionRuleStyle: 'solid' | 'double-line' | 'subtle';
  arPreset: CvData;
  enPreset: CvData;
}

export const DEFAULT_OSAMA_ATS_KEYWORDS: string[] = [
  'علاج وظيفي',
  'تأهيل حركي',
  'ABAT',
  'تأهيل أطفال',
  'ذوي الهمم',
  'إدارة مراكز تأهيل',
  'إشراف فني',
  'تشخيص وتقييم',
  'خطط فردية',
  'تكامل حسي',
  'تعديل سلوك',
  'إرشاد أسري',
  'تدريب كوادر',
];

export const DEFAULT_AR_CV_DATA: CvData = {
  fullName: 'أسامة الصماد / Osama elsamad',
  targetJobTitle:
    'مدير ومشرف فني - أخصائي علاج وظيفي وتأهيل حركي - محلل سلوكي تطبيقي ABAT',
  phone: '00201069579757',
  email: 'osamaelsamad23@gmail.com',
  location: 'مصر - البحيرة - دمنهور - شارع حسين حجازي بجوار مدرسة عمر الوكيل',
  websiteOrLink: 'خبرة: أكثر من 20 عام',
  yearsOfExperience: 'أكثر من 20 عام',
  summary:
    'مدير ومشرف فني واستشاري مراكز تأهيل بخبرة عملية تمتد لأكثر من 20 عاماً في العلاج الوظيفي والتأهيل الحركي وتحليل السلوك التطبيقي (ABAT)، وتأهيل أطفال ذوي الهمم، وإعداد خطط فردية وتقييمات تشخيصية شاملة، وتكامل حسي وتعديل سلوك وإرشاد أسري، وتدريب وتأهيل الكوادر وفق أحدث المعايير المؤسسية وأنظمة تتبع المتقدمين (ATS).',
  experiences: [
    {
      id: 'exp-1',
      jobTitle: 'استشاري ومدير فني وإداري لمراكز التأهيل',
      company: 'مؤسسة زايد العليا لأصحاب الهمم (مشروع التأهيل والتخاطب)',
      location: 'مصر / الإمارات',
      dateRange: '01/2022 - حتى الآن',
      bullets: [
        'إشراف فني وإداري متكامل على مراكز التأهيل وتطبيق معايير الجودة الدولية لذوي الهمم.',
        'تدريب كوادر التأهيل والتخاطب وتطوير منظومة التشخيص والتقييم والخطط الفردية.',
      ],
    },
    {
      id: 'exp-2',
      jobTitle: 'مدير المركز الشامل لرعاية الطفل',
      company: 'المركز الشامل لرعاية الطفل',
      location: 'دمنهور - البحيرة',
      dateRange: '01/2016 - حتى الآن',
      bullets: [
        'إدارة جميع تخصصات التأهيل وتأهيل أطفال ذوي الهمم وصعوبات التعلم والتخاطب والتكامل الحسي.',
        'إعداد خطط فردية وتعديل سلوك وإرشاد أسري وتقارير تربوية معتمدة للمدارس والجهات الرسمية.',
      ],
    },
    {
      id: 'exp-3',
      jobTitle: 'مدرب ومحاضر في مجالات التأهيل والتربية الخاصة',
      company: 'مراكز التدريب والمؤتمرات التخصصية',
      location: 'مصر والعالم العربي',
      dateRange: '01/2010 - حتى الآن',
      bullets: [
        'تقديم مئات المحاضرات وورش العمل التطبيقية في تدريب كوادر التأهيل الحركي والعلاج الوظيفي.',
        'بناء حقائب تدريبية في التكامل الحسي وتعديل السلوك وتطبيق المقاييس التربوية.',
      ],
    },
    {
      id: 'exp-4',
      jobTitle: 'منسق مبادرة حياة كريمة (ملف ذوي الهمم)',
      company: 'مبادرة حياة كريمة - فرع البحيرة',
      location: 'محافظة البحيرة',
      dateRange: '01/2021 - حتى الآن',
      bullets: [
        'تنسيق المبادرات الميدانية لرعاية وتأهيل أطفال ذوي الاحتياجات الخاصة وتقديم الدعم الأسري.',
        'تيسير إجراءات الدمج والتقييم والتوجيه التأهيلي الشامل للأسر الأولى بالرعاية.',
      ],
    },
    {
      id: 'exp-5',
      jobTitle: 'أخصائي علاج وظيفي وتأهيل حركي',
      company: 'المركز التخصصي للعلاج الوظيفي والتأهيل',
      location: 'البحيرة',
      dateRange: '01/2002 - حتى الآن',
      bullets: [
        'تطبيق جلسات العلاج الوظيفي والتأهيل الحركي والتكامل الحسي وتنمية المهارات الاستقلالية.',
        'تصميم برامج تدخل فردية ومتابعة مؤشرات التقدم الحركي والوظيفي للحالات.',
      ],
    },
    {
      id: 'exp-6',
      jobTitle: 'مشرف ومحلل سلوك وتأهيل نفسي حركي',
      company: 'مركز الترويض النفسي الرياضي',
      location: 'دمنهور - البحيرة',
      dateRange: '01/2018 - حتى الآن',
      bullets: [
        'الدمج بين التأهيل الحركي الرياضي وتعديل السلوك وتنمية الانتباه والمهارات الاجتماعية.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'بكالوريوس تربية رياضية - شعبة عامة وعلوم صحية',
      institution: 'جامعة الإسكندرية',
      dateRange: '09/1996 - 06/2000',
      details: 'شعبة عامة وعلوم صحية — دفعة 2000',
    },
  ],
  skills: [
    { id: 'sk-1', name: 'علاج وظيفي وتأهيل حركي', level: 'خبير (+20 عام)' },
    { id: 'sk-2', name: 'تحليل السلوك التطبيقي (ABAT)', level: 'متقدم' },
    { id: 'sk-3', name: 'إدارة مراكز تأهيل والإشراف الفني', level: 'متقدم' },
    { id: 'sk-4', name: 'تشخيص وتقييم وبناء خطط فردية', level: 'متقدم' },
    { id: 'sk-5', name: 'تكامل حسي وتعديل سلوك وإرشاد أسري', level: 'متقدم' },
    { id: 'sk-6', name: 'تدريب كوادر وتأهيل أطفال ذوي الهمم', level: 'متقدم' },
    { id: 'sk-7', name: 'الابتكار والإنجاز والتواصل ودعم فريق', level: 'متقدم' },
    { id: 'sk-8', name: 'Word - Excel - PowerPoint - AI', level: 'متقدم' },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'شهادة محلل سلوكي تطبيقي (ABAT)',
      issuer: 'هيئة الاعتماد المهني لتحليل السلوك التطبيقي',
      date: '05/2021',
    },
    {
      id: 'cert-2',
      name: 'شهادات تخصصية معتمدة في تأهيل ذوي الهمم والعلاج الوظيفي',
      issuer: 'مؤسسة زايد العليا والمراكز التخصصية',
      date: '01/2022',
    },
  ],
  languages: [
    { id: 'lang-1', name: 'العربية', proficiency: 'اللغة الأم' },
    { id: 'lang-2', name: 'الإنجليزية', proficiency: 'جيد جداً' },
  ],
  trainings: [
    {
      id: 'trn-1',
      title: 'تدريب كوادر مراكز التأهيل والتخاطب والخطط الفردية وتكامل حسي',
      provider: 'مؤسسة زايد العليا ومديرية الشباب والرياضة بالبحيرة',
      dateRange: '01/2022 - حتى الآن',
    },
  ],
  jobDescriptionText: '',
  atsKeywords: DEFAULT_OSAMA_ATS_KEYWORDS,
  customFields: [],
  customSections: [],
  sectionOrder: [...ATS_SECTION_ORDER],
  hiddenSections: [],
  designConfig: DEFAULT_CV_DESIGN_CONFIG,
};

export const DEFAULT_EN_CV_DATA: CvData = {
  fullName: 'Osama elsamad / أسامة الصماد',
  targetJobTitle:
    'Technical Director & Supervisor - Occupational Therapy & Motor Rehabilitation Specialist - Applied Behavior Analysis Technician (ABAT)',
  phone: '00201069579757',
  email: 'osamaelsamad23@gmail.com',
  location: 'Egypt - Beheira - Damanhour - Hussein Hegazy St., next to Omar El-Wakeel School',
  websiteOrLink: 'Experience: 20+ Years',
  yearsOfExperience: '20+ Years',
  summary:
    'Consultant, Technical Director, and Senior Occupational Therapy & Motor Rehabilitation Specialist with over 20 years of hands-on leadership across rehabilitation centers, Applied Behavior Analysis (ABAT), pediatric rehabilitation for People of Determination, Individualized Education Plans (IEP), sensory integration, behavior modification, family counseling, and staff training aligned with Applicant Tracking Systems (ATS).',
  experiences: [
    {
      id: 'exp-1',
      jobTitle: 'Consultant, Technical & Administrative Director for Rehabilitation Centers',
      company: 'Zayed Higher Organization for People of Determination',
      location: 'Egypt / UAE Collaboration',
      dateRange: '01/2022 - Present',
      bullets: [
        'Directed technical operations and staff training programs across rehabilitation and speech therapy centers.',
        'Established diagnostic assessment workflows and individualized rehabilitation planning standards.',
      ],
    },
    {
      id: 'exp-2',
      jobTitle: 'Director of Al-Shamel Child Care Center',
      company: 'Al-Shamel Comprehensive Child Care Center',
      location: 'Damanhour, Beheira',
      dateRange: '01/2016 - Present',
      bullets: [
        'Managed multidisciplinary pediatric rehabilitation services including speech, sensory integration, and behavior therapy.',
        'Authored individualized plans and formal school accommodation evaluations.',
      ],
    },
    {
      id: 'exp-3',
      jobTitle: 'Master Trainer & Lecturer in Rehabilitation Sciences',
      company: 'National & Regional Training Centers',
      location: 'Egypt',
      dateRange: '01/2010 - Present',
      bullets: [
        'Trained rehabilitation specialists and teams in occupational therapy, motor rehabilitation, and ABAT practices.',
      ],
    },
    {
      id: 'exp-4',
      jobTitle: 'Coordinator - Hayah Karima Initiative (People of Determination)',
      company: 'Hayah Karima Initiative - Beheira',
      location: 'Beheira, Egypt',
      dateRange: '01/2021 - Present',
      bullets: [
        'Coordinated community outreach, developmental screenings, and family counseling support.',
      ],
    },
    {
      id: 'exp-5',
      jobTitle: 'Occupational Therapy & Motor Rehabilitation Specialist',
      company: 'Specialized Rehabilitation Centers',
      location: 'Beheira, Egypt',
      dateRange: '01/2002 - Present',
      bullets: [
        'Delivered clinical occupational therapy, motor skill rehabilitation, and sensory integration sessions.',
      ],
    },
    {
      id: 'exp-6',
      jobTitle: 'Psychomotor & Behavior Supervisor',
      company: 'Psychomotor Rehabilitation Center',
      location: 'Damanhour, Beheira',
      dateRange: '01/2018 - Present',
      bullets: [
        'Integrated structured motor activities with applied behavioral strategies to enhance focus and independence.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Bachelor of Physical Education - General Section & Health Sciences',
      institution: 'Alexandria University',
      dateRange: '09/1996 - 06/2000',
      details: 'Class of 2000 — Health Sciences & Rehabilitation Focus',
    },
  ],
  skills: [
    { id: 'sk-1', name: 'Occupational Therapy & Motor Rehabilitation', level: 'Expert (20+ Years)' },
    { id: 'sk-2', name: 'Applied Behavior Analysis Technician (ABAT)', level: 'Advanced' },
    { id: 'sk-3', name: 'Rehabilitation Center Management & Supervision', level: 'Advanced' },
    { id: 'sk-4', name: 'Diagnostic Assessment & Individualized Plans', level: 'Advanced' },
    { id: 'sk-5', name: 'Sensory Integration & Behavior Modification', level: 'Advanced' },
    { id: 'sk-6', name: 'Family Counseling & Staff Training', level: 'Advanced' },
    { id: 'sk-7', name: 'Innovation, Achievement, Communication, Teamwork', level: 'Advanced' },
    { id: 'sk-8', name: 'Word - Excel - PowerPoint - AI Tools', level: 'Advanced' },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'Applied Behavior Analysis Technician (ABAT) Credential',
      issuer: 'QABA Board',
      date: '05/2021',
    },
    {
      id: 'cert-2',
      name: 'Certified Rehabilitation & Occupational Therapy Leadership',
      issuer: 'Zayed Higher Organization',
      date: '01/2022',
    },
  ],
  languages: [
    { id: 'lang-1', name: 'Arabic', proficiency: 'Native' },
    { id: 'lang-2', name: 'English', proficiency: 'Very Good' },
  ],
  trainings: [
    {
      id: 'trn-1',
      title: 'Staff Capacity Building in Rehabilitation, Speech & Individualized Plans',
      provider: 'Zayed Higher Organization & Directorate of Youth and Sports',
      dateRange: '01/2022 - Present',
    },
  ],
  jobDescriptionText: '',
  atsKeywords: DEFAULT_OSAMA_ATS_KEYWORDS,
  customFields: [],
  customSections: [],
  sectionOrder: [...ATS_SECTION_ORDER],
  hiddenSections: [],
  designConfig: { ...DEFAULT_CV_DESIGN_CONFIG, displayMode: 'en' },
};

export function createBlankCvData(language: CvLanguage): CvData {
  if (language === 'en') {
    return {
      fullName: '[ غير موجود ]',
      targetJobTitle: '[ غير موجود ]',
      phone: '[ غير موجود ]',
      email: '[ غير موجود ]',
      location: '[ غير موجود ]',
      websiteOrLink: '[ ... ]',
      summary: '[ غير موجود ]',
      experiences: [
        {
          id: 'exp-1',
          jobTitle: '[ غير موجود ]',
          company: '[ غير موجود ]',
          location: '[ ... ]',
          dateRange: '01/2023 - Present',
          bullets: ['[ غير موجود ]'],
        },
      ],
      education: [
        {
          id: 'edu-1',
          degree: '[ غير موجود ]',
          institution: '[ غير موجود ]',
          dateRange: '09/2018 - 06/2022',
          details: '',
        },
      ],
      skills: [{ id: 'sk-1', name: 'Microsoft Excel', level: 'Intermediate' }],
      certifications: [],
      languages: [
        { id: 'lang-1', name: 'Arabic', proficiency: 'Native' },
        { id: 'lang-2', name: 'English', proficiency: 'Good' },
      ],
      trainings: [],
      jobDescriptionText: '',
      customFields: [],
      customSections: [],
      sectionOrder: [...ATS_SECTION_ORDER],
      hiddenSections: [],
      designConfig: { ...DEFAULT_CV_DESIGN_CONFIG, displayMode: 'en' },
    };
  }
  return {
    fullName: '[ غير موجود ]',
    targetJobTitle: '[ غير موجود ]',
    phone: '[ غير موجود ]',
    email: '[ غير موجود ]',
    location: '[ غير موجود ]',
    websiteOrLink: '[ ... ]',
    summary: '[ غير موجود ]',
    experiences: [
      {
        id: 'exp-1',
        jobTitle: '[ غير موجود ]',
        company: '[ غير موجود ]',
        location: '[ ... ]',
        dateRange: '01/2023 - حتى الآن',
        bullets: ['[ غير موجود ]'],
      },
    ],
    education: [
      {
        id: 'edu-1',
        degree: '[ غير موجود ]',
        institution: '[ غير موجود ]',
        dateRange: '09/2018 - 06/2022',
        details: '',
      },
    ],
    skills: [{ id: 'sk-1', name: 'Microsoft Excel', level: 'متوسط' }],
    certifications: [],
    languages: [
      { id: 'lang-1', name: 'العربية', proficiency: 'اللغة الأم' },
      { id: 'lang-2', name: 'الإنجليزية', proficiency: 'جيد' },
    ],
    trainings: [],
    jobDescriptionText: '',
    customFields: [],
    customSections: [],
    sectionOrder: [...ATS_SECTION_ORDER],
    hiddenSections: [],
    designConfig: DEFAULT_CV_DESIGN_CONFIG,
  };
}

export const ATS_CV_TEMPLATES: CvTemplateDefinition[] = [
  {
    id: 'ats-classic',
    nameAr: 'قالب ATS الكلاسيكي القياسي',
    nameEn: 'ATS Classic Standard',
    descriptionAr:
      'عمود واحد من الأعلى للأسفل، عناوين قياسية صريحة، فواصل أفقية واضحة، بدون صور أو جداول أو أيقونات.',
    headerAlign: 'right',
    sectionRuleStyle: 'solid',
    arPreset: DEFAULT_AR_CV_DATA,
    enPreset: DEFAULT_EN_CV_DATA,
  },
  {
    id: 'ats-executive',
    nameAr: 'قالب ATS الإداري والتنفيذي',
    nameEn: 'ATS Executive Formal',
    descriptionAr:
      'رأس تعريفي متوسط السطر بمسمى وظيفي واضح، متوافق 100% مع أنظمة تتبع المتقدمين للوظائف الإدارية والإشرافية.',
    headerAlign: 'center',
    sectionRuleStyle: 'double-line',
    arPreset: {
      ...DEFAULT_AR_CV_DATA,
      targetJobTitle: 'استشاري ومدير فني وإداري لمراكز التأهيل — ABAT',
    },
    enPreset: {
      ...DEFAULT_EN_CV_DATA,
      targetJobTitle: 'Consultant & Technical Director for Rehabilitation Centers',
    },
  },
  {
    id: 'ats-academic',
    nameAr: 'قالب ATS الطبي والتأهيلي والأكاديمي',
    nameEn: 'ATS Medical & Academic',
    descriptionAr:
      'مصمم لأخصائيي العلاج الوظيفي والتأهيل الحركي وتحليل السلوك والأكاديميين بترتيب ATS القياسي.',
    headerAlign: 'right',
    sectionRuleStyle: 'subtle',
    arPreset: {
      ...DEFAULT_AR_CV_DATA,
      targetJobTitle: 'أخصائي علاج وظيفي وتأهيل حركي ومحلل سلوكي تطبيقي ABAT',
    },
    enPreset: {
      ...DEFAULT_EN_CV_DATA,
      targetJobTitle: 'Occupational Therapy & Motor Rehabilitation Specialist (ABAT)',
    },
  },
  {
    id: 'ats-skills-forward',
    nameAr: 'قالب ATS للمهارات والكلمات المفتاحية',
    nameEn: 'ATS Skills & Keywords Focus',
    descriptionAr:
      'ملائم لإبراز الكلمات المفتاحية والمهارات التخصصية بنص مفصول بفواصل متوافق تماماً مع ATS.',
    headerAlign: 'center',
    sectionRuleStyle: 'solid',
    arPreset: DEFAULT_AR_CV_DATA,
    enPreset: DEFAULT_EN_CV_DATA,
  },
];
