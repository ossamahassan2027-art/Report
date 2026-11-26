import { ReportData, ReportLanguage, SectionVisibility, ItemSelections } from './report';
import {
  BlockStyleOverride,
  DEFAULT_SECTION_ORDER,
  ReportSectionKey,
} from './clickEdit';

export type SidebarSectionId =
  | 'dashboard'
  | 'summary'
  | 'plan'
  | 'charts'
  | 'templates'
  | 'recommendations'
  | 'evaluations'
  | 'recipients'
  | 'settings'
  | 'cv';

export type LightThemeId =
  | 'classic-white'
  | 'calm-blue'
  | 'mint-green'
  | 'sleek-gray'
  | 'warm-beige'
  | 'soft-rose';

export type FontSizeOption = 'small' | 'medium' | 'large';
export type ButtonShapeOption = 'square' | 'rounded';
export type DensityOption = 'compact' | 'comfortable';

export interface ThemeSettings {
  screenTheme: LightThemeId;
  printTheme: LightThemeId;
  fontSize: FontSizeOption;
  buttonShape: ButtonShapeOption;
  density: DensityOption;
}

export interface LightThemeDefinition {
  id: LightThemeId;
  name: string;
  description: string;
  pageBg: string;
  surfaceBg: string;
  cardBg: string;
  textPrimary: string;
  textMuted: string;
  headingColor: string;
  accentColor: string;
  accentSoft: string;
  borderColor: string;
}

export const LIGHT_THEMES: Record<LightThemeId, LightThemeDefinition> = {
  'classic-white': {
    id: 'classic-white',
    name: 'أبيض كلاسيك',
    description: 'خلفية بيضاء، نص أسود، حدود رمادي فاتح',
    pageBg: '#FFFFFF',
    surfaceBg: '#FAFAFA',
    cardBg: '#FFFFFF',
    textPrimary: '#0A0A0A',
    textMuted: '#52525B',
    headingColor: '#18181B',
    accentColor: '#18181B',
    accentSoft: '#F4F4F5',
    borderColor: '#E4E4E7',
  },
  'calm-blue': {
    id: 'calm-blue',
    name: 'أبيض أزرق هادئ',
    description: 'خلفية بيضاء، عناوين أزرق هادئ، أزرار أزرق فاتح',
    pageBg: '#FFFFFF',
    surfaceBg: '#F8FAFC',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textMuted: '#475569',
    headingColor: '#1E40AF',
    accentColor: '#2563EB',
    accentSoft: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  'mint-green': {
    id: 'mint-green',
    name: 'أبيض أخضر نعناعي',
    description: 'خلفية بيضاء، عناوين أخضر هادئ، لمسات نعناعي',
    pageBg: '#FFFFFF',
    surfaceBg: '#F6FEF9',
    cardBg: '#FFFFFF',
    textPrimary: '#14291E',
    textMuted: '#4B6356',
    headingColor: '#166534',
    accentColor: '#15803D',
    accentSoft: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  'sleek-gray': {
    id: 'sleek-gray',
    name: 'أبيض رمادي أنيق',
    description: 'خلفية أبيض مائل للرمادي الفاتح جداً، نص رمادي غامق',
    pageBg: '#F8FAFC',
    surfaceBg: '#F1F5F9',
    cardBg: '#FFFFFF',
    textPrimary: '#1E293B',
    textMuted: '#475569',
    headingColor: '#334155',
    accentColor: '#334155',
    accentSoft: '#E2E8F0',
    borderColor: '#CBD5E1',
  },
  'warm-beige': {
    id: 'warm-beige',
    name: 'أبيض بيج دافئ',
    description: 'خلفية بيج فاتح جداً، عناوين بني فاتح، مريح للعين',
    pageBg: '#FAF8F5',
    surfaceBg: '#F4EFE8',
    cardBg: '#FFFFFF',
    textPrimary: '#292524',
    textMuted: '#57534E',
    headingColor: '#7C4A2D',
    accentColor: '#8B5A3C',
    accentSoft: '#F5EDE4',
    borderColor: '#E7DDD0',
  },
  'soft-rose': {
    id: 'soft-rose',
    name: 'أبيض وردي فاتح',
    description: 'خلفية بيضاء، عناوين وردي هادئ، مناسب لتقارير الأهالي',
    pageBg: '#FFFFFF',
    surfaceBg: '#FFF9FB',
    cardBg: '#FFFFFF',
    textPrimary: '#271720',
    textMuted: '#6B4C5B',
    headingColor: '#9D174D',
    accentColor: '#BE185D',
    accentSoft: '#FDF2F8',
    borderColor: '#FCE7F3',
  },
};

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  screenTheme: 'calm-blue',
  printTheme: 'classic-white',
  fontSize: 'medium',
  buttonShape: 'rounded',
  density: 'comfortable',
};

export interface PlanGoalItem {
  id: string;
  goal: string;
  targetDuration: string;
  owner: string;
  progress: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface CustomChartItem {
  id: string;
  title: string;
  chartType: 'bar' | 'horizontal';
  unit: string;
  points: ChartDataPoint[];
}

export interface CustomTableItem {
  id: string;
  title: string;
  kind: 'table' | 'before-after';
  headers: string[];
  rows: string[][];
}

export interface EvaluationFormEntry {
  id: string;
  category:
    | 'speech'
    | 'behavior'
    | 'sensory'
    | 'learning'
    | 'iq'
    | 'family';
  title: string;
  fields: { label: string; value: string }[];
}

export interface ExtrasVisibility {
  summary: boolean;
  plan: boolean;
  charts: boolean;
  tables: boolean;
  evaluations: boolean;
  behaviorTechniques: boolean;
}

export const DEFAULT_EXTRAS_VISIBILITY: ExtrasVisibility = {
  summary: true,
  plan: true,
  charts: true,
  tables: true,
  evaluations: true,
  behaviorTechniques: true,
};

export interface WeeklyTaskItem {
  id: string;
  day: string;
  task: string;
  owner: string;
  status: string;
}

export interface CustomCardItem {
  id: string;
  title: string;
  body: string;
}

export interface ContactSettings {
  phone: string;
  website: string;
  whatsapp: string;
  youtube: string;
  facebook: string;
  instagram: string;
}

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  phone: '01069579757',
  website: '[ ... ]',
  whatsapp: '01069579757',
  youtube: '[ ... ]',
  facebook: '[ ... ]',
  instagram: '[ ... ]',
};

export type AddonCategoryId = 'quick' | 'generate' | 'forms' | 'send' | 'customize';

export interface AddonCatalogItem {
  id: string;
  category: AddonCategoryId;
  label: string;
  description: string;
}

export const ADDON_CATEGORIES: { id: AddonCategoryId; label: string }[] = [
  { id: 'quick', label: 'سريع' },
  { id: 'generate', label: 'توليد' },
  { id: 'forms', label: 'استمارات' },
  { id: 'send', label: 'إرسال' },
  { id: 'customize', label: 'تخصيص' },
];

export const ADDON_CATALOG: AddonCatalogItem[] = [
  { id: 'new-report', category: 'quick', label: 'تقرير جديد', description: 'بدء تقرير من قالب أو نموذج فارغ' },
  { id: 'cv-builder', category: 'quick', label: 'سيرة ذاتية ATS', description: 'توليد وفحص CV متوافق 100% مع ATS' },
  { id: 'weekly-tasks', category: 'quick', label: 'جدول مهام أسبوعي', description: 'إدارة مهام الأسبوع وإدراجها' },
  { id: 'comprehensive-eval', category: 'quick', label: 'استمارة تقييم شامل', description: 'فتح وتحديد استمارات التقييم' },

  { id: 'gen-plan', category: 'generate', label: 'توليد خطة', description: 'إضافة وتوليد أهداف الخطة الفردية' },
  { id: 'gen-recommendations', category: 'generate', label: 'توليد توصيات', description: 'اختيار وإدراج توصيات متخصصة' },
  { id: 'gen-report', category: 'generate', label: 'توليد تقرير', description: 'توليد تقرير كامل من شكوى نصية' },
  { id: 'gen-infographic', category: 'generate', label: 'توليد انفو جراف', description: 'التحويل للملخص البصري (A4)' },

  { id: 'form-speech', category: 'forms', label: 'تخاطب', description: 'استمارة تقييم التخاطب واللغة' },
  { id: 'form-behavior', category: 'forms', label: 'تعديل سلوك', description: 'استمارة تعديل السلوك وتنمية المهارات' },
  { id: 'form-sensory', category: 'forms', label: 'تكامل حسي', description: 'استمارة التكامل الحسي' },
  { id: 'form-learning', category: 'forms', label: 'صعوبات تعلم', description: 'استمارة صعوبات التعلم' },
  { id: 'form-iq', category: 'forms', label: 'اختبارات ذكاء', description: 'استمارة القدرات المعرفية والذكاء' },
  { id: 'form-family', category: 'forms', label: 'إرشاد أسري', description: 'استمارة الإرشاد الأسري' },

  { id: 'send-schedule', category: 'send', label: 'إرسال جدول للحالة', description: 'نسخ/تجهيز رسالة الجدول الأسبوعي' },
  { id: 'send-reminder', category: 'send', label: 'إرسال تذكير', description: 'تجهيز تذكير متابعة لولي الأمر أو المدرسة' },
  { id: 'export-pdf', category: 'send', label: 'تصدير PDF', description: 'تجهيز وطباعة التقرير بصيغة PDF' },
  { id: 'copy-link', category: 'send', label: 'نسخ رابط', description: 'نسخ رابط البرنامج وبيانات التواصل' },

  { id: 'custom-card', category: 'customize', label: 'إضافة بطاقة مخصصة', description: 'إدراج بطاقة ملاحظات جديدة بالتقرير' },
  { id: 'add-task', category: 'customize', label: 'إضافة مهمة', description: 'إضافة مهمة جديدة إلى الجدول الأسبوعي' },
  { id: 'add-section', category: 'customize', label: 'إضافة قسم جديد', description: 'إدراج قسم إضافي مخصص في التقرير' },
];

export interface AddonsSettings {
  enabled: boolean;
  visibleIds: string[];
}

export const DEFAULT_ADDONS_SETTINGS: AddonsSettings = {
  enabled: true,
  visibleIds: ADDON_CATALOG.map((a) => a.id),
};

export interface StudioNavigationPrefs {
  activeSection: SidebarSectionId;
  sectionTabs: Partial<Record<SidebarSectionId, string>>;
}

export const DEFAULT_STUDIO_PREFS: StudioNavigationPrefs = {
  activeSection: 'dashboard',
  sectionTabs: {},
};

export interface CaseProfileMeta {
  status: 'نشط' | 'مؤرشف' | 'قيد المتابعة';
  gender: string;
  specialty: string;
  guardianName: string;
  guardianPhone: string;
  mainComplaint: string;
  nextFollowUpDate: string;
  nextFollowUpNote: string;
  improvementPercent: string;
  photoDataUrl?: string;
}

export const DEFAULT_CASE_PROFILE_META: CaseProfileMeta = {
  status: 'نشط',
  gender: '[ ... ]',
  specialty: 'تعديل سلوك وتنمية مهارات',
  guardianName: '[ ... ]',
  guardianPhone: '[ ... ]',
  mainComplaint: '[ ... ]',
  nextFollowUpDate: '[ ... ]',
  nextFollowUpNote: '',
  improvementPercent: '',
};

export interface AssignedSessionItem {
  id: string;
  sessionType: string;
  code: string;
  goal: string;
  sessionsCount: number;
  status: 'نشط' | 'مكتمل' | 'قيد المتابعة' | 'مؤجل';
  priority: 'عالية' | 'متوسطة' | 'عادية';
}

export interface SessionLogItem {
  id: string;
  sessionNumber: string;
  sessionType: string;
  date: string;
  attendance: 'تم' | 'لم يتم' | 'مؤجل';
  notes: string;
}

export interface ChangeLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface ReportExtras {
  summaryText: string;
  quickSummaryLines: string[];
  planGoals: PlanGoalItem[];
  progressNotes: string;
  charts: CustomChartItem[];
  tables: CustomTableItem[];
  selectedBehaviorTechniques: string[];
  selectedEvaluationForms: EvaluationFormEntry[];
  selectedRecipients: string[];
  activeRecipientCopy: string;
  extrasVisibility: ExtrasVisibility;
  blockStyles?: Record<string, BlockStyleOverride>;
  sectionOrder?: ReportSectionKey[];
  weeklyTasks?: WeeklyTaskItem[];
  customCards?: CustomCardItem[];
  caseProfile?: CaseProfileMeta;
  assignedSessions?: AssignedSessionItem[];
  sessionLogs?: SessionLogItem[];
}

export const DEFAULT_REPORT_EXTRAS: ReportExtras = {
  summaryText: '',
  quickSummaryLines: [],
  planGoals: [],
  progressNotes: '',
  charts: [],
  tables: [],
  selectedBehaviorTechniques: [],
  selectedEvaluationForms: [],
  selectedRecipients: ['مدرسة'],
  activeRecipientCopy: '',
  extrasVisibility: DEFAULT_EXTRAS_VISIBILITY,
  blockStyles: {},
  sectionOrder: DEFAULT_SECTION_ORDER,
  weeklyTasks: [],
  customCards: [],
  caseProfile: DEFAULT_CASE_PROFILE_META,
  assignedSessions: [],
  sessionLogs: [],
};

export interface SavedReportRecord {
  id: string;
  name: string;
  isDraft: boolean;
  updatedAt: string;
  language: ReportLanguage;
  arData: ReportData;
  enData: ReportData | null;
  visibility: SectionVisibility;
  selections: ItemSelections;
  extras: ReportExtras;
}

export const RECOMMENDATION_BANK: Record<
  'school' | 'home' | 'specialist',
  string[]
> = {
  school: [
    'اعتماد جدول يومي واضح وثابت قدر الإمكان داخل البيئة التعليمية.',
    'تخصيص مقعد في الصف الأمامي بعيداً عن الضوضاء والممرات المزدحمة.',
    'استخدام الوسائل البصرية والجداول المصورة لتوضيح التعليمات.',
    'تقسيم المحتوى التعليمي والاختبارات إلى وحدات قصيرة ومتدرجة.',
    'دمج فترات حركة وراحة قصيرة بين الأنشطة الصفية.',
    'منح وقت إضافي مرن خلال الاختبارات التحريرية وتجنب المقارنة.',
  ],
  home: [
    'توفير مكان هادئ ومنظم ومخصص للاستذكار بعيداً عن المشتتات.',
    'وضع جدول مصور للروتين اليومي المنزلي وتوقيتات الراحة واللعب.',
    'استخدام التعزيز الإيجابي الفوري والتشجيع المستمر عند إنجاز المهام.',
    'تقسيم الواجبات المنزلية إلى فقرات قصيرة (10-15 دقيقة) مع استراحة.',
    'مراعاة الحالة النفسية والانفعالية للطفل قبل بدء النشاط التعليمي.',
    'دمج أنشطة حركية وحسية هادفة ضمن الروتين اليومي بالمنزل.',
  ],
  specialist: [
    'تطبيق جلسات منظمة لتنمية الانتباه والتركيز المتواصل تدريجياً.',
    'بناء خطة تعديل سلوك قائمة على ضبط المثيرات والتعزيز التفاضلي.',
    'تدريب الأسرة والمعلمين على استراتيجيات التهدئة وتنظيم الانفعال.',
    'متابعة مؤشرات التقدم بصورة دورية كل أربعة أسابيع وتحديث الأهداف.',
    'تصميم برامج تدرج اجتماعي آمنة لتنمية التفاعل مع الأقران.',
    'التنسيق المستمر بين الأخصائي والمدرسة وولي الأمر لتوحيد الاستجابة.',
  ],
};

export const BEHAVIOR_TECHNIQUES: string[] = [
  'تعزيز إيجابي',
  'تشكيل',
  'نمذجة',
  'تلقين',
  'اقتصاد رمزي',
  'ضبط مثيرات',
  'مراقبة ذاتية',
];

export const RECIPIENT_OPTIONS: {
  id: string;
  label: string;
  salutation: string;
}[] = [
  {
    id: 'طبيب',
    label: 'طبيب',
    salutation: 'السيد الدكتور الفاضل / [ ... ] المحترم',
  },
  {
    id: 'مدرسة',
    label: 'مدرسة',
    salutation: 'السيد الأستاذ الفاضل / مدير المدرسة الموقر',
  },
  {
    id: 'جهة داعمة',
    label: 'جهة داعمة',
    salutation: 'السادة المسؤولون / [ ... ] الموقرون',
  },
  {
    id: 'ولي أمر',
    label: 'ولي أمر',
    salutation: 'السيد الفاضل / ولي أمر الطفل المحترم',
  },
  {
    id: 'جهة حكومية',
    label: 'جهة حكومية',
    salutation: 'السادة مسؤولو الجهة المختصة / [ ... ] المحترمين',
  },
  {
    id: 'أخرى',
    label: 'أخرى',
    salutation: 'إلى من يهمه الأمر / [ ... ]',
  },
];

export const EVALUATION_FORM_TEMPLATES: EvaluationFormEntry[] = [
  {
    id: 'eval-speech',
    category: 'speech',
    title: 'استمارة تقييم التخاطب واللغة',
    fields: [
      { label: 'اللغة الاستقبالية', value: '[ ... ]' },
      { label: 'اللغة التعبيرية', value: '[ ... ]' },
      { label: 'مخارج الحروف والطلاقة', value: '[ ... ]' },
      { label: 'التواصل البراجماتي', value: '[ ... ]' },
    ],
  },
  {
    id: 'eval-behavior',
    category: 'behavior',
    title: 'استمارة تعديل السلوك وتنمية المهارات',
    fields: [
      { label: 'مستوى الانتباه والنشاط', value: '[ ... ]' },
      { label: 'المثيرات السلوكية الملاحظة', value: '[ ... ]' },
      { label: 'الاستجابة للتعزيز والتوجيه', value: '[ ... ]' },
      { label: 'المهارات الاستقلالية', value: '[ ... ]' },
    ],
  },
  {
    id: 'eval-sensory',
    category: 'sensory',
    title: 'استمارة التكامل الحسي',
    fields: [
      { label: 'الحساسية السمعية والبصرية', value: '[ ... ]' },
      { label: 'التوازن والحركة واللمس', value: '[ ... ]' },
      { label: 'التأقلم مع البيئات المزدحمة', value: '[ ... ]' },
      { label: 'التوصيات الحسية الوقائية', value: '[ ... ]' },
    ],
  },
  {
    id: 'eval-learning',
    category: 'learning',
    title: 'استمارة صعوبات التعلم',
    fields: [
      { label: 'المهارات القرائية والهجائية', value: '[ ... ]' },
      { label: 'المهارات الكتابية والإدراك البصري', value: '[ ... ]' },
      { label: 'المفاهيم الحسابية', value: '[ ... ]' },
      { label: 'الذاكرة العاملة والمعالجة', value: '[ ... ]' },
    ],
  },
  {
    id: 'eval-iq',
    category: 'iq',
    title: 'استمارة اختبارات الذكاء والقدرات المعرفية',
    fields: [
      { label: 'اسم المقياس المطبق', value: '[ ... ]' },
      { label: 'تاريخ التطبيق', value: '[ ... ]' },
      { label: 'المؤشر العام / الملاحظات المعرفية', value: '[ ... ]' },
      { label: 'نقاط القوة والاحتياج', value: '[ ... ]' },
    ],
  },
  {
    id: 'eval-family',
    category: 'family',
    title: 'استمارة الإرشاد الأسري',
    fields: [
      { label: 'أسلوب التعامل الأسري اليومي', value: '[ ... ]' },
      { label: 'الالتزام بالروتين المنزلي', value: '[ ... ]' },
      { label: 'أولويات الدعم الأسري', value: '[ ... ]' },
      { label: 'خطة المتابعة الأسرية', value: '[ ... ]' },
    ],
  },
];

export function createBlankReportData(addressee = 'إلى من يهمه الأمر / [ ... ]'): ReportData {
  return {
    centerName: 'المركز الشامل لرعاية الطفل',
    centerCity: 'دمنهور',
    directorName: 'أسامة الصماد',
    directorRole: 'مدير فني المركز',
    phone: '01069579757',
    referenceNumber: '[ ... ]',
    reportDate: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
    schoolAddressee: addressee,
    reportTitle: 'تقرير تربوي وتقييمي حول احتياجات الحالة',
    reportSubtitle: '[ ... ]',
    childName: '[ ... ]',
    birthDate: '[ ... ]',
    age: '[ ... ]',
    diagnosis: '[ ... ]',
    backgroundParagraph1: '[ ... ]',
    backgroundParagraph2: '[ ... ]',
    envIntro: 'تؤثر طبيعة البيئة المحيطة في مستوى استقرار الحالة واستعدادها للتعلم:',
    envPositive: '[ ... ]',
    envNegativeIntro: 'المؤثرات أو التحديات الملاحظة في البيئات المزدحمة:',
    envNegativePoints: ['[ ... ]'],
    homeSchoolIntro: 'نقاط الدعم والترتيبات التعليمية المناسبة للحالة:',
    homeSchoolBenefits: ['[ ... ]'],
    recommendationsIntro: 'التوصيات التربوية المقترحة:',
    recommendations: ['[ ... ]'],
    opinionParagraph1: '[ ... ]',
    opinionParagraph2: '[ ... ]',
    opinionParagraph3: '[ ... ]',
    coreGoalQuote: '[ ... ]',
    closingSalutation: 'وتفضلوا بقبول فائق الاحترام والتقدير.',
    preparedBy: 'أ/ أسامة الصماد',
    professionalTitle: 'مدير فني المركز',
    signCenterName: 'المركز الشامل لرعاية الطفل بدمنهور',
    signDate: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
  };
}
