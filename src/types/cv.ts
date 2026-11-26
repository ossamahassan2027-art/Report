export type CvLanguage = 'ar' | 'en';

export type CvTemplateId =
  | 'ats-classic'
  | 'ats-executive'
  | 'ats-academic'
  | 'ats-skills-forward';

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
  'وزارة التربية والتعليم / مؤسسات حكومية',
  'شركات تقنية المعلومات والبرمجيات',
  'مستشفيات ومراكز طبية متخصصة',
  'شركات كبرى ومؤسسات خاصة',
];

export const DEFAULT_CAREER_SECTORS: string[] = [
  'التربية الخاصة وتعديل السلوك',
  'التعليم والتدريس والمناهج',
  'الإدارة والموارد البشرية',
  'تقنية المعلومات والبيانات',
  'القطاع الطبي والصحي',
  'المالية والمحاسبة',
  'التسويق والمبيعات وخدمة العملاء',
  'الهندسة وإدارة المشاريع',
];

export const DEFAULT_EXPERIENCE_LEVELS: Record<CvLanguage, string[]> = {
  ar: [
    'حديث التخرج (0 - 2 سنة)',
    'مستوى متوسط (2 - 5 سنوات)',
    'أخصائي أول / خبير (5 - 10 سنوات)',
    'قيادي / إداري (+10 سنوات)',
  ],
  en: [
    'Entry Level (0 - 2 years)',
    'Mid Level (2 - 5 years)',
    'Senior / Specialist (5 - 10 years)',
    'Leadership / Management (10+ years)',
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

export const DEFAULT_AR_CV_DATA: CvData = {
  fullName: 'أسامة الصماد',
  targetJobTitle: 'أخصائي تربية خاصة ومدير فني',
  phone: '01069579757',
  email: 'info@alshamel-center.example',
  location: 'دمنهور، البحيرة، مصر',
  websiteOrLink: '[ ... ]',
  summary:
    'أخصائي تربية خاصة ومدير فني بخبرة عملية في التقييم التربوي والسلوكي للأطفال ذوي اضطراب فرط الحركة وتشتت الانتباه (ADHD)، وإعداد الخطط التربوية الفردية (IEP)، وتنسيق برامج تعديل السلوك والدعم الأسري والتقارير المدرسية وفق معايير الجودة التربوية وأنظمة تتبع المتقدمين (ATS).',
  experiences: [
    {
      id: 'exp-1',
      jobTitle: 'أخصائي تربية خاصة ومدير فني',
      company: 'المركز الشامل لرعاية الطفل',
      location: 'دمنهور',
      dateRange: '01/2020 - حتى الآن',
      bullets: [
        'إدارة التقييمات التربوية والسلوكية الشاملة وإعداد الخطط التربوية الفردية (IEP) للطلاب.',
        'إعداد التقارير التربوية الرسمية وتقارير التسهيلات البيئية والتعليم المنزلي الموجهة للمدارس.',
        'الإشراف الفني على برامج التخاطب وتعديل السلوك والتكامل الحسي وصعوبات التعلم.',
      ],
    },
    {
      id: 'exp-2',
      jobTitle: 'أخصائي تعديل سلوك وتنمية مهارات',
      company: 'مركز الرعاية التربوية المتخصصة',
      location: 'البحيرة',
      dateRange: '06/2016 - 12/2019',
      bullets: [
        'تصميم وتنفيذ خطط تعديل السلوك باستخدام التعزيز الإيجابي والاقتصاد الرمزي.',
        'تدريب أولياء الأمور والمعلمين على استراتيجيات تنظيم الانتباه والروتين اليومي المنظم.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'دبلوم مهني في التربية الخاصة وتعديل السلوك',
      institution: 'كلية التربية - جامعة دمنهور',
      dateRange: '09/2014 - 06/2016',
      details: 'تخصص اضطرابات الانتباه وصعوبات التعلم',
    },
  ],
  skills: [
    { id: 'sk-1', name: 'إعداد الخطط التربوية الفردية (IEP)', level: 'متقدم' },
    { id: 'sk-2', name: 'تعديل السلوك', level: 'متقدم' },
    { id: 'sk-3', name: 'التقييم التربوي والسلوكي', level: 'متقدم' },
    { id: 'sk-4', name: 'كتابة التقارير المهنية', level: 'متقدم' },
    { id: 'sk-5', name: 'Microsoft Excel', level: 'متقدم' },
    { id: 'sk-6', name: 'Microsoft Word', level: 'متقدم' },
    { id: 'sk-7', name: 'الإرشاد الأسري', level: 'متقدم' },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'شهادة أخصائي تحليل سلوك تطبيقي (ABA)',
      issuer: 'الأكاديمية التربوية للتدريب',
      date: '05/2021',
    },
  ],
  languages: [
    { id: 'lang-1', name: 'العربية', proficiency: 'اللغة الأم' },
    { id: 'lang-2', name: 'الإنجليزية', proficiency: 'جيد جداً' },
  ],
  trainings: [
    {
      id: 'trn-1',
      title: 'برنامج تطبيق مقاييس الذكاء والقدرات المعرفية',
      provider: 'المركز القومي للتدريب التربوي',
      dateRange: '03/2022 - 05/2022',
    },
  ],
  jobDescriptionText: '',
};

export const DEFAULT_EN_CV_DATA: CvData = {
  fullName: 'Osama El-Sammad',
  targetJobTitle: 'Special Education Specialist and Technical Director',
  phone: '01069579757',
  email: 'info@alshamel-center.example',
  location: 'Damanhour, Beheira, Egypt',
  websiteOrLink: '[ ... ]',
  summary:
    'Special Education Specialist and Technical Director experienced in comprehensive educational and behavioral assessment for children with Attention-Deficit/Hyperactivity Disorder (ADHD), Individualized Education Program (IEP) planning, behavior modification, and formal school accommodation reporting aligned with Applicant Tracking Systems (ATS) standards.',
  experiences: [
    {
      id: 'exp-1',
      jobTitle: 'Special Education Specialist and Technical Director',
      company: 'Al-Shamel Child Care Center',
      location: 'Damanhour',
      dateRange: '01/2020 - Present',
      bullets: [
        'Conducted comprehensive educational and behavioral assessments and built Individualized Education Program (IEP) plans.',
        'Authored formal educational accommodation and structured home-schooling reports for schools.',
        'Supervised speech therapy, behavior modification, sensory integration, and learning support specialists.',
      ],
    },
    {
      id: 'exp-2',
      jobTitle: 'Behavior Modification and Skills Specialist',
      company: 'Specialized Educational Care Center',
      location: 'Beheira',
      dateRange: '06/2016 - 12/2019',
      bullets: [
        'Implemented structured behavior intervention programs using positive reinforcement and token economy.',
        'Trained parents and teachers on attention regulation and daily structured routine strategies.',
      ],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Professional Diploma in Special Education and Behavior Modification',
      institution: 'Faculty of Education - Damanhour University',
      dateRange: '09/2014 - 06/2016',
      details: 'Focus on Attention Disorders and Learning Difficulties',
    },
  ],
  skills: [
    { id: 'sk-1', name: 'Individualized Education Program (IEP)', level: 'Advanced' },
    { id: 'sk-2', name: 'Behavior Modification', level: 'Advanced' },
    { id: 'sk-3', name: 'Educational Assessment', level: 'Advanced' },
    { id: 'sk-4', name: 'Professional Report Writing', level: 'Advanced' },
    { id: 'sk-5', name: 'Microsoft Excel', level: 'Advanced' },
    { id: 'sk-6', name: 'Microsoft Word', level: 'Advanced' },
    { id: 'sk-7', name: 'Family Counseling', level: 'Advanced' },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'Applied Behavior Analysis (ABA) Practitioner Certificate',
      issuer: 'Educational Training Academy',
      date: '05/2021',
    },
  ],
  languages: [
    { id: 'lang-1', name: 'Arabic', proficiency: 'Native' },
    { id: 'lang-2', name: 'English', proficiency: 'Very Good' },
  ],
  trainings: [
    {
      id: 'trn-1',
      title: 'Cognitive and Intelligence Scales Administration Program',
      provider: 'National Center for Educational Training',
      dateRange: '03/2022 - 05/2022',
    },
  ],
  jobDescriptionText: '',
};

export function createBlankCvData(language: CvLanguage): CvData {
  if (language === 'en') {
    return {
      fullName: '[ ... ]',
      targetJobTitle: '[ ... ]',
      phone: '[ ... ]',
      email: '[ ... ]',
      location: '[ ... ]',
      websiteOrLink: '[ ... ]',
      summary: '[ ... ]',
      experiences: [
        {
          id: 'exp-1',
          jobTitle: '[ ... ]',
          company: '[ ... ]',
          location: '[ ... ]',
          dateRange: '01/2023 - Present',
          bullets: ['[ ... ]'],
        },
      ],
      education: [
        {
          id: 'edu-1',
          degree: '[ ... ]',
          institution: '[ ... ]',
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
    };
  }
  return {
    fullName: '[ ... ]',
    targetJobTitle: '[ ... ]',
    phone: '[ ... ]',
    email: '[ ... ]',
    location: '[ ... ]',
    websiteOrLink: '[ ... ]',
    summary: '[ ... ]',
    experiences: [
      {
        id: 'exp-1',
        jobTitle: '[ ... ]',
        company: '[ ... ]',
        location: '[ ... ]',
        dateRange: '01/2023 - حتى الآن',
        bullets: ['[ ... ]'],
      },
    ],
    education: [
      {
        id: 'edu-1',
        degree: '[ ... ]',
        institution: '[ ... ]',
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
      targetJobTitle: 'مدير مركز رعاية وتأهيل تربوي',
    },
    enPreset: {
      ...DEFAULT_EN_CV_DATA,
      targetJobTitle: 'Educational Care Center Director',
    },
  },
  {
    id: 'ats-academic',
    nameAr: 'قالب ATS التربوي والأكاديمي',
    nameEn: 'ATS Academic & Clinical',
    descriptionAr:
      'مصمم للأخصائيين والمعلمين والباحثين مع إبراز المؤهلات والشهادات والتدريب بترتيب ATS القياسي.',
    headerAlign: 'right',
    sectionRuleStyle: 'subtle',
    arPreset: {
      ...DEFAULT_AR_CV_DATA,
      targetJobTitle: 'أخصائي تقييم تربوي وتعديل سلوك',
    },
    enPreset: {
      ...DEFAULT_EN_CV_DATA,
      targetJobTitle: 'Educational Assessment and Behavior Specialist',
    },
  },
  {
    id: 'ats-skills-forward',
    nameAr: 'قالب ATS للمهارات والكلمات المفتاحية',
    nameEn: 'ATS Skills & Keywords Focus',
    descriptionAr:
      'ملائم لإبراز الكلمات المفتاحية والمهارات التقنية والتخصصية بنص مفصول بفواصل متوافق تماماً مع ATS.',
    headerAlign: 'center',
    sectionRuleStyle: 'solid',
    arPreset: DEFAULT_AR_CV_DATA,
    enPreset: DEFAULT_EN_CV_DATA,
  },
];
