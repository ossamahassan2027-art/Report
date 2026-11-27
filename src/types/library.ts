export type LibraryCategory =
  | 'تخصص'
  | 'حالة'
  | 'مقارنة'
  | 'برنامج تدريبي'
  | 'حل'
  | 'إرشاد أسري'
  | 'مقياس'
  | 'توعية';

export type LibraryCondition =
  | 'ADHD'
  | 'توحد'
  | 'صعوبات تعلم'
  | 'تخاطب'
  | 'قلق'
  | 'وسواس'
  | 'كل الحالات';

export type LibraryFolderId =
  | 'speech'
  | 'learning'
  | 'adhd'
  | 'autism'
  | 'anxiety-ocd'
  | 'behavior-family'
  | 'scales'
  | 'awareness';

export interface LibraryActivity {
  name: string;
  tools: string;
  steps: string[];
  duration: string;
  success: string;
}

export interface LibraryCard {
  id: string;
  title: string;
  category: LibraryCategory;
  condition: LibraryCondition;
  folder: LibraryFolderId;
  ageRange: string;
  definition: string;
  symptoms: string[];
  causes: string[];
  differential: string[];
  goals: string[];
  goalsSMART: string[];
  activities: LibraryActivity[];
  recommendationsFamily: string[];
  recommendationsSchool: string[];
  recommendationsSpecialist: string[];
  measurement: string;
  keywords: string[];
  relatedIds: string[];
  source: string;
  image?: string;
  pinned?: boolean;
  createdAt?: string;
  sourceAttachmentRef?: string;
}

export interface LibraryFolderMeta {
  id: LibraryFolderId;
  title: string;
  subtitle: string;
  accentColor: string;
  bgSoft: string;
  coverTagline: string;
}

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  'تخصص',
  'حالة',
  'مقارنة',
  'برنامج تدريبي',
  'حل',
  'إرشاد أسري',
  'مقياس',
  'توعية',
];

export const LIBRARY_CONDITIONS: LibraryCondition[] = [
  'ADHD',
  'توحد',
  'صعوبات تعلم',
  'تخاطب',
  'قلق',
  'وسواس',
  'كل الحالات',
];

export const LIBRARY_FOLDERS: LibraryFolderMeta[] = [
  {
    id: 'speech',
    title: 'التخاطب',
    subtitle: 'اللغة الاستقبالية والتعبيرية ومخارج الأصوات والطلاقة',
    accentColor: '#0284C7',
    bgSoft: '#E0F2FE',
    coverTagline: 'تقييم وتدريب مهارات النطق والتواصل الوظيفي',
  },
  {
    id: 'learning',
    title: 'صعوبات التعلم',
    subtitle: 'القراءة والكتابة والحساب والذاكرة العاملة والإدراك',
    accentColor: '#7C3AED',
    bgSoft: '#EDE9FE',
    coverTagline: 'خطط علاجية أكاديمية متدرجة والوعي الفونولوجي',
  },
  {
    id: 'adhd',
    title: 'ADHD',
    subtitle: 'تنظيم الانتباه والنشاط الحركي وضبط الاندفاعية',
    accentColor: '#EA580C',
    bgSoft: '#FFEDD5',
    coverTagline: 'استراتيجيات البيئة الصفية والروتين وتنفيذ المهام',
  },
  {
    id: 'autism',
    title: 'التوحد',
    subtitle: 'طيف التوحد والتواصل البديل والتكامل الحسي والاجتماعي',
    accentColor: '#059669',
    bgSoft: '#D1FAE5',
    coverTagline: 'دعم المهارات الاجتماعية والبيئة الحسية الآمنة',
  },
  {
    id: 'anxiety-ocd',
    title: 'القلق والوسواس',
    subtitle: 'قلق الانفصال والقلق المدرسي والوسواس القهري للأطفال',
    accentColor: '#BE185D',
    bgSoft: '#FCE7F3',
    coverTagline: 'فنيات التهدئة وبناء الأمان النفسي والتدرج السلوكي',
  },
  {
    id: 'behavior-family',
    title: 'تعديل السلوك والإرشاد الأسري',
    subtitle: 'الفنيات السلوكية والشراكة الأسرية وضبط المثيرات',
    accentColor: '#2563EB',
    bgSoft: '#DBEAFE',
    coverTagline: 'تطبيقات التعزيز التفاضلي والتربية الإيجابية',
  },
  {
    id: 'scales',
    title: 'المقاييس',
    subtitle: 'قوائم الملاحظة ومؤشرات الفحص الأولي وتفسير النتائج',
    accentColor: '#4F46E5',
    bgSoft: '#E0E7FF',
    coverTagline: 'أدوات الفحص التوجيهية ومؤشرات القياس الدورية',
  },
  {
    id: 'awareness',
    title: 'التوعية',
    subtitle: 'أدلة ولي الأمر والمدرسة ومؤشرات التدخل المبكر',
    accentColor: '#0F766E',
    bgSoft: '#CCFBF1',
    coverTagline: 'ثقافة الدعم والدمج الآمن والتواصل المؤسسي',
  },
];

export type TrustedSourceOrg = 'NIMH' | 'DSM-5-TR' | 'WHO' | 'CDC' | 'ASHA';

export interface TrustedSourceCitation {
  id: string;
  org: TrustedSourceOrg;
  title: string;
  url: string;
  retrievedDate: string;
  summaryAr: string;
}

export type ConfidenceBadge = 'confirmed' | 'needs-review' | 'unclear';

export interface ExtractionLineReview {
  id: string;
  lineNumber: number;
  originalText: string;
  cleanedText: string;
  confidence: ConfidenceBadge;
  issues: string[];
  accepted: boolean;
}

export interface SensitiveFinding {
  type: 'phone' | 'email' | 'national-id' | 'address';
  match: string;
  label: string;
}

export interface SmartExtractionResult {
  rawOriginalText: string;
  cleanedFullText: string;
  lines: ExtractionLineReview[];
  errorReport: string[];
  sensitiveFindings: SensitiveFinding[];
  confirmedCount: number;
  reviewCount: number;
  unclearCount: number;
  qualityBlocked: boolean;
  suggestedCard: LibraryCard;
  appliedLearnedRulesCount: number;
  sourceImagePreview?: string;
}

export interface ParentReportSectionItem {
  id: string;
  number: number;
  title: string;
  content: string;
  sourceTag: string;
  status: 'pending' | 'approved' | 'deleted';
}

export interface ParentReport15Document {
  id: string;
  createdAt: string;
  childName: string;
  age: string;
  birthDate: string;
  guardianName: string;
  guardianPhone: string;
  centerName: string;
  specialistName: string;
  specialistRole: string;
  complaintText: string;
  matchedCardIds: string[];
  citations: TrustedSourceCitation[];
  sections: ParentReportSectionItem[];
  confirmations: [boolean, boolean, boolean];
  stamped: boolean;
  stampedAt?: string;
}
