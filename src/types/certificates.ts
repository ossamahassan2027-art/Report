import { CvFontId } from './cv';

export type CertificateKind = 'certificate' | 'statement';

export type CertCanvasElementKind =
  | 'free-text'
  | 'name'
  | 'date'
  | 'signature'
  | 'stamp'
  | 'logo'
  | 'photo'
  | 'divider'
  | 'serial'
  | 'qr';

export interface CertCanvasElement {
  id: string;
  kind: CertCanvasElementKind;
  label: string;
  text: string;
  xPercent: number; // 0..100 (from left)
  yPercent: number; // 0..100 (from top)
  widthPercent: number; // 8..90
  fontSizePx: number;
  fontId: CvFontId;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'right' | 'center' | 'left';
  rotationDeg: number;
  locked: boolean;
  zIndex: number;
  imageDataUrl?: string;
}

export interface CertTemplateVisualStyle {
  variant:
    | 'official-beheira-statement'
    | 'classic-gold'
    | 'modern-blue'
    | 'course-emerald'
    | 'workshop-violet'
    | 'child-star'
    | 'experience-navy'
    | 'honor-royal'
    | 'rehab-teal'
    | 'statement-general';
  outerBorderColor: string;
  innerBorderColor: string;
  accentColor: string;
  secondaryAccent: string;
  titleColor: string;
  bodyTextColor: string;
  showCornerTriangles: boolean;
  roundedInnerPx: number;
  showStarsRow: boolean;
  starsCount: number;
}

export interface CertificateTemplateDef {
  id: string;
  name: string;
  kind: CertificateKind;
  isDefaultOfficial?: boolean;
  isCustomSaved?: boolean;
  headerTitle: string;
  subtitle?: string;
  introLine: string;
  bodyParagraphBeforeName: string;
  bodyParagraphAfterRole: string;
  closingLine: string;
  signerTitle: string;
  signerName: string;
  rightEntityTitle: string;
  rightEntitySub: string;
  leftEntityTitle: string;
  leftEntitySub: string;
  rightLogoDataUrl?: string;
  leftLogoDataUrl?: string;
  style: CertTemplateVisualStyle;
  defaultElements: CertCanvasElement[];
}

export interface CertRecipientRow {
  id: string;
  serial: string;
  fullName: string;
  roleOrCourse: string;
  grade: string;
  dateStr: string;
  phone: string;
  status: 'valid' | 'incomplete';
  issues: string[];
  perCardElementsOverride?: CertCanvasElement[];
  perCardTitleOverride?: string;
  perCardIntroOverride?: string;
}

export interface CertBatchRegistryEntry {
  id: string;
  createdAt: string;
  templateId: string;
  templateName: string;
  kind: CertificateKind;
  count: number;
  names: string[];
  recipients: CertRecipientRow[];
}

export const READY_STATEMENT_TEXT_LIBRARY: {
  id: string;
  label: string;
  templateText: string;
}[] = [
  {
    id: 'stmt-course',
    label: 'إفادة حضور دورة',
    templateText:
      'تشهد إدارة المركز بأن السيد / [الاسم الكامل] قد حضر واجتاز الدورة التدريبية بعنوان: [الوظيفة / الدورة] بتاريخ [التاريخ] بنجاح والتزام.',
  },
  {
    id: 'stmt-child',
    label: 'إفادة التحاق طفل',
    templateText:
      'تفيد إدارة المركز بأن الطفل / [الاسم الكامل] قد التحق ببرنامج: [الوظيفة / الدورة] اعتباراً من تاريخ [التاريخ] وينتظم في الجلسات المقررة.',
  },
  {
    id: 'stmt-work',
    label: 'إفادة خبرة عمل',
    templateText:
      'تشهد إدارة المركز بأن السيد / [الاسم الكامل] قد عمل لدينا بوظيفة: [الوظيفة / الدورة] في الفترة من [التاريخ] حتى تاريخه، وقد أظهر كفاءة مهنية عالية.',
  },
  {
    id: 'stmt-official-beheira',
    label: 'النص الرسمي — مديرية الشباب والرياضة بالبحيرة',
    templateText:
      'تتشرف مديرية الشباب والرياضة بمحافظة البحيرة بأن تفيد بأن السيد / [الاسم الكامل] يعمل بمركز التأهيل والتخاطب لذوي القدرات والهمم التابع لمركز شباب الإعدادية بوظيفة: [الوظيفة / الدورة] تاريخ بداية العمل: [التاريخ] حتى تاريخه.',
  },
];
