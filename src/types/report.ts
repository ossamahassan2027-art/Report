export type LayoutMode = 'single' | 'two-page';
export type ViewFormat = 'a4' | 'infographic';
export type PaperTone = 'white' | 'archival';
export type AccentTheme = 'lapis' | 'forest' | 'bronze';
export type ReportLanguage = 'ar' | 'en';

export interface SectionVisibility {
  personal: boolean;
  background: boolean;
  environment: boolean;
  homeSchool: boolean;
  recommendations: boolean;
  opinion: boolean;
}

export interface ItemSelections {
  envNegative: boolean[];
  homeSchoolBenefits: boolean[];
  recommendations: boolean[];
}

export interface ReportData {
  centerName: string;
  centerCity: string;
  directorName: string;
  directorRole: string;
  phone: string;
  referenceNumber: string;
  reportDate: string;
  schoolAddressee: string;
  reportTitle: string;
  reportSubtitle: string;

  childName: string;
  birthDate: string;
  age: string;
  diagnosis: string;

  backgroundParagraph1: string;
  backgroundParagraph2: string;

  envIntro: string;
  envPositive: string;
  envNegativeIntro: string;
  envNegativePoints: string[];

  homeSchoolIntro: string;
  homeSchoolBenefits: string[];

  recommendationsIntro: string;
  recommendations: string[];

  opinionParagraph1: string;
  opinionParagraph2: string;
  opinionParagraph3: string;
  coreGoalQuote: string;
  closingSalutation: string;

  preparedBy: string;
  professionalTitle: string;
  signCenterName: string;
  signDate: string;
}

export const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  personal: true,
  background: true,
  environment: true,
  homeSchool: true,
  recommendations: true,
  opinion: true,
};

export function createFullSelections(data: ReportData): ItemSelections {
  return {
    envNegative: data.envNegativePoints.map(() => true),
    homeSchoolBenefits: data.homeSchoolBenefits.map(() => true),
    recommendations: data.recommendations.map(() => true),
  };
}

export function getFilteredReportData(
  data: ReportData,
  selections: ItemSelections
): ReportData {
  return {
    ...data,
    envNegativePoints: data.envNegativePoints.filter(
      (_, idx) => selections.envNegative[idx] !== false
    ),
    homeSchoolBenefits: data.homeSchoolBenefits.filter(
      (_, idx) => selections.homeSchoolBenefits[idx] !== false
    ),
    recommendations: data.recommendations.filter(
      (_, idx) => selections.recommendations[idx] !== false
    ),
  };
}

export const DEFAULT_REPORT_DATA: ReportData = {
  centerName: 'المركز الشامل لرعاية الطفل',
  centerCity: 'دمنهور',
  directorName: 'أسامة الصماد',
  directorRole: 'مدير فني المركز',
  phone: '01069579757',
  referenceNumber: 'ت/2026-114',
  reportDate: '2026/11/25',
  schoolAddressee: 'السيد الأستاذ الفاضل / مدير المدرسة الموقر',
  reportTitle: 'تقرير تربوي حول الاحتياجات التعليمية والبيئية للطفل',
  reportSubtitle: 'لدعم طلب التعليم من المنزل (Home Schooling)',

  childName: 'Adnan A HEMIDA',
  birthDate: '04/04/2017',
  age: '9 سنوات و7 أشهر',
  diagnosis: 'اضطراب فرط الحركة وتشتت الانتباه (ADHD)',

  backgroundParagraph1:
    'يعاني الطفل من بعض الصعوبات المرتبطة بتنظيم الانتباه والتحكم في النشاط والانفعالات، بالإضافة إلى حساسية ملحوظة تجاه بعض المؤثرات البيئية، خاصة الضوضاء والأصوات المرتفعة والتغيرات المفاجئة.',
  backgroundParagraph2:
    'وقد تؤدي البيئات الجديدة أو المزدحمة أو التي تتضمن مستويات مرتفعة من المثيرات الحسية والاجتماعية إلى زيادة التوتر والانفعال، مما قد يؤثر على قدرته على التركيز والاستجابة للتعليمات والاستمرار في أداء الأنشطة التعليمية.',

  envIntro: 'تؤثر طبيعة البيئة المحيطة بشكل واضح في مستوى استقرار الطفل وقدرته على التعلم.',
  envPositive:
    'ففي البيئات التي تتسم بالهدوء والتنظيم والوضوح، ومع وجود روتين يومي ثابت وتوقعات واضحة، قد يتمكن الطفل من إظهار قدرات أفضل في التركيز والمشاركة وإنجاز المهام.',
  envNegativeIntro:
    'وعلى الجانب الآخر، قد تؤدي البيئات المزدحمة أو كثرة الأصوات والمثيرات أو التغيرات غير المتوقعة إلى:',
  envNegativePoints: [
    'زيادة التشتت وصعوبة المحافظة على الانتباه.',
    'ارتفاع مستوى التوتر والانفعال.',
    'صعوبة تنظيم الاستجابات السلوكية والعاطفية.',
    'انخفاض القدرة على الاستمرار في الأنشطة التعليمية.',
    'الحاجة إلى فترات راحة أطول لاستعادة الهدوء والتركيز.',
  ],

  homeSchoolIntro:
    'يمكن أن يوفر التعليم من المنزل، إذا تم تنظيمه بصورة مناسبة، بعض المميزات التي تتوافق مع احتياجات الطفل، ومنها:',
  homeSchoolBenefits: [
    'توفير بيئة تعليمية أكثر هدوءاً وأقل ازدحاماً بالمثيرات الحسية.',
    'إمكانية تنظيم الجدول اليومي وفقاً لقدرة الطفل على الانتباه والاستيعاب.',
    'تقسيم الأنشطة التعليمية إلى فترات قصيرة تتخللها فترات راحة.',
    'توفير روتين ثابت يساعد على الشعور بالأمان والتوقع والاستقرار.',
    'تقليل الضغوط الناتجة عن الانتقال المستمر بين البيئات والمواقف المختلفة.',
    'إتاحة الفرصة لتقديم التعليم بأساليب فردية تتناسب مع سرعة تعلم الطفل واحتياجاته.',
    'إمكانية دمج الأنشطة الحركية والحسية في البرنامج اليومي بصورة منظمة.',
  ],

  recommendationsIntro: 'نوصي عند إعداد البرنامج التعليمي الخاص بالطفل بما يلي:',
  recommendations: [
    'اعتماد جدول يومي واضح وثابت قدر الإمكان.',
    'توفير مكان هادئ ومناسب للتعلم.',
    'استخدام الوسائل البصرية والجداول المصورة.',
    'تقسيم المحتوى التعليمي إلى وحدات قصيرة ومتدرجة.',
    'دمج فترات الحركة والراحة بين الأنشطة.',
    'استخدام التعزيز الإيجابي والتشجيع المستمر.',
    'تجنب الضغط الزائد أو المقارنة بالآخرين.',
    'مراعاة مستوى الاستعداد النفسي والانفعالي قبل بدء الأنشطة.',
    'متابعة مستوى التقدم بصورة دورية.',
    'المحافظة على فرص مناسبة للتفاعل الاجتماعي والأنشطة الخارجية التدريجية في بيئات آمنة ومناسبة لاحتياجاته.',
  ],

  opinionParagraph1:
    'في ضوء المعلومات المتاحة عن الحالة، فإن الطفل يحتاج إلى بيئة تعليمية مرنة تراعي احتياجاته الانتباهية والانفعالية والحسية.',
  opinionParagraph2:
    'وقد يكون التعليم المنزلي المنظم أحد البدائل التعليمية المناسبة لدراسة احتياجاته، خاصة إذا أتاح له الاستقرار والهدوء والقدرة على التعلم وفقاً لسرعته واحتياجاته الفردية.',
  opinionParagraph3:
    'ونوصي بأن تقوم الجهة التعليمية المختصة بدراسة إمكانية توفير نظام تعليم منزلي أو ترتيبات تعليمية فردية مناسبة، مع ضمان استمرار حصول الطفل على فرص التعلم والتفاعل الاجتماعي والدعم النمائي اللازم.',
  coreGoalQuote:
    'الهدف الأساسي هو توفير الظروف التعليمية التي تساعد عدنان على الوصول إلى أفضل مستوى ممكن من التعلم والاستقرار النفسي والسلوكي، وليس عزله عن المجتمع أو الحد من فرص تطوره.',
  closingSalutation: 'وتفضلوا بقبول فائق الاحترام والتقدير.',

  preparedBy: 'أ/ أسامة الصماد',
  professionalTitle: 'مدير فني المركز',
  signCenterName: 'المركز الشامل لرعاية الطفل بدمنهور',
  signDate: '2026/11/25',
};

export const DEFAULT_ENGLISH_REPORT_DATA: ReportData = {
  centerName: 'Comprehensive Child Care Center',
  centerCity: 'Damanhour',
  directorName: 'Osama El-Samad',
  directorRole: 'Technical Director of the Center',
  phone: '01069579757',
  referenceNumber: 'T/2026-114',
  reportDate: '25/11/2026',
  schoolAddressee: 'Dear Esteemed School Principal,',
  reportTitle: 'Educational Report on the Child’s Learning and Environmental Needs',
  reportSubtitle: 'In Support of Home Schooling Request',

  childName: 'Adnan A HEMIDA',
  birthDate: '04/04/2017',
  age: '9 Years and 7 Months',
  diagnosis: 'Attention-Deficit/Hyperactivity Disorder (ADHD)',

  backgroundParagraph1:
    'The child experiences difficulties related to attention regulation, activity modulation, and emotional control, in addition to noticeable sensitivity toward certain environmental stimuli, particularly noise, loud sounds, and sudden transitions.',
  backgroundParagraph2:
    'Unfamiliar or crowded environments containing elevated sensory and social stimulation may heighten tension and emotional reactivity, which can adversely affect his ability to focus, follow instructions, and sustain engagement in educational tasks.',

  envIntro:
    'The surrounding environment plays a decisive role in the child’s stability and learning readiness.',
  envPositive:
    'In calm, structured, and predictable settings supported by a consistent daily routine and clear expectations, the child demonstrates markedly stronger focus, participation, and task completion.',
  envNegativeIntro:
    'Conversely, crowded spaces, excessive noise, sensory overload, or unexpected changes may lead to:',
  envNegativePoints: [
    'Increased distractibility and difficulty sustaining attention.',
    'Elevated levels of stress and emotional agitation.',
    'Difficulty regulating behavioral and emotional responses.',
    'Reduced persistence in completing educational activities.',
    'Need for longer recovery breaks to restore calm and focus.',
  ],

  homeSchoolIntro:
    'When properly structured, home schooling offers key advantages tailored to the child’s developmental profile:',
  homeSchoolBenefits: [
    'Providing a calmer learning environment with minimal sensory distractions.',
    'Flexibility to pace the daily schedule according to the child’s attention span.',
    'Dividing academic tasks into short focused intervals interspersed with breaks.',
    'Maintaining a predictable routine that fosters safety, anticipation, and stability.',
    'Reducing stress caused by frequent transitions across crowded settings.',
    'Delivering individualized instruction aligned with the child’s learning pace and needs.',
    'Integrating structured movement and sensory activities into the daily program.',
  ],

  recommendationsIntro:
    'When designing the child’s educational plan, we recommend the following measures:',
  recommendations: [
    'Establish a clear and consistent daily schedule whenever possible.',
    'Provide a quiet, distraction-free workspace dedicated to learning.',
    'Use visual aids, illustrated schedules, and clear step-by-step cues.',
    'Break instructional content into short, progressive learning units.',
    'Integrate structured movement and rest breaks between activities.',
    'Apply positive reinforcement and continuous encouragement.',
    'Avoid excessive pressure or comparisons with peers.',
    'Assess emotional and psychological readiness prior to starting tasks.',
    'Monitor academic and behavioral progress on a periodic basis.',
    'Maintain safe, gradual opportunities for social interaction and outdoor activities suited to his needs.',
  ],

  opinionParagraph1:
    'Based on the available clinical and developmental information, the child requires a flexible educational environment responsive to his attentional, emotional, and sensory needs.',
  opinionParagraph2:
    'Structured home schooling represents a suitable educational alternative worthy of consideration, particularly when it ensures emotional stability, calm, and individualized pacing.',
  opinionParagraph3:
    'We recommend that the relevant educational authority review the provision of a home schooling arrangement or tailored individual accommodations, while safeguarding continued access to learning, social engagement, and developmental support.',
  coreGoalQuote:
    'The primary objective is to provide educational conditions that enable Adnan to achieve his highest potential in learning and emotional-behavioral stability, rather than isolating him from society or limiting his developmental opportunities.',
  closingSalutation: 'Please accept our highest respect and appreciation.',

  preparedBy: 'Mr. Osama El-Samad',
  professionalTitle: 'Technical Director of the Center',
  signCenterName: 'Comprehensive Child Care Center - Damanhour',
  signDate: '25/11/2026',
};

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  data: ReportData;
  englishData: ReportData;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'home-schooling',
    name: 'طلب التعليم المنزلي (Home Schooling)',
    description: 'النموذج الرسمي الكامل الموجه للمدرسة لدعم التعليم المنزلي.',
    data: DEFAULT_REPORT_DATA,
    englishData: DEFAULT_ENGLISH_REPORT_DATA,
  },
  {
    id: 'classroom-accommodations',
    name: 'ترتيبات صفية ودمج تعليمي',
    description: 'تقرير تهيئة البيئة الصفية وتسهيلات الاختبارات داخل المدرسة.',
    data: {
      ...DEFAULT_REPORT_DATA,
      referenceNumber: 'ت/2026-118',
      reportTitle: 'تقرير توصيات التهيئة الصفية والترتيبات التعليمية الفردية',
      reportSubtitle: 'لدعم دمج الطفل وتوفير بيئة مدرسية مراعية لاحتياجاته الحسية والانتباهية',
      homeSchoolIntro:
        'يتطلب دعم الطفل داخل البيئة المدرسية تطبيق حزمة من الترتيبات الصفية المنظمة، ومن أبرزها:',
      homeSchoolBenefits: [
        'الجلوس في الصفوف الأمامية بعيداً عن مصادر الضوضاء والمشتتات البصرية.',
        'تقسيم المهام الدراسية والاختبارات إلى أجزاء قصيرة مع فترات استراحة مقننة.',
        'استخدام إشارات بصرية هادئة للتنبيه وإعادة توجيه الانتباه دون إحراج.',
        'تخصيص ركن أو مساحة هادئة للتهدئة الذاتية عند ارتفاع التوتر الحسي.',
        'منح وقت إضافي مرن في التقييمات التحريرية والتدريبات الصفية.',
        'التواصل اليومي المنظم بين المعلم والأسرة لمتابعة الاستقرار السلوكي.',
      ],
      opinionParagraph2:
        'وعليه، فإن توفير ترتيبات صفية مرنة وتقليل المثيرات الحسية داخل الفصل يمثل ركيزة أساسية لتمكين الطفل من الاندماج الأكاديمي والنفسي بنجاح.',
      opinionParagraph3:
        'نوصي إدارة المدرسة واللجنة المختصة باعتماد هذه التسهيلات ضمن الخطة الصفية للطفل ومراجعتها دورياً بالتنسيق مع ولي الأمر والمركز.',
    },
    englishData: {
      ...DEFAULT_ENGLISH_REPORT_DATA,
      referenceNumber: 'T/2026-118',
      reportTitle: 'Classroom Accommodations & Individualized Support Report',
      reportSubtitle: 'Supporting Inclusive Integration & Sensory-Friendly School Arrangements',
      homeSchoolIntro:
        'Supporting the child within the school environment requires structured classroom accommodations, including:',
      homeSchoolBenefits: [
        'Front-row seating away from noise sources and visual distractions.',
        'Chunking classwork and exams into shorter segments with scheduled breaks.',
        'Using discreet visual cues to redirect attention without embarrassment.',
        'Designating a calm self-regulation corner during sensory overload.',
        'Granting flexible extended time for written assessments and class exercises.',
        'Maintaining structured daily communication between teachers and family.',
      ],
      opinionParagraph2:
        'Accordingly, flexible classroom accommodations and reduced sensory load are essential pillars for successful academic and emotional inclusion.',
      opinionParagraph3:
        'We recommend that school administration adopt these accommodations within the student’s classroom plan and review them periodically with the family and center.',
    },
  },
  {
    id: 'iep-summary',
    name: 'خطة تربوية فردية (IEP)',
    description: 'نموذج موجز يركز على الأهداف السلوكية والأكاديمية القابلة للقياس.',
    data: {
      ...DEFAULT_REPORT_DATA,
      referenceNumber: 'خ/2026-204',
      reportTitle: 'ملخص الخطة التربوية والسلوكية الفردية (IEP)',
      reportSubtitle: 'إطار عمل مشترك بين الأسرة والفريق التعليمي لتنمية الانتباه والتنظيم الذاتي',
      envPositive:
        'تُظهر الملاحظات استجابة مرتفعة عند تقديم المهام في خطوات محددة، مع وضوح التوقعات البصرية ووجود تعزيز فوري إيجابي.',
      homeSchoolIntro: 'الأهداف التربوية والنمائية ذات الأولوية خلال الفصل الدراسي:',
      homeSchoolBenefits: [
        'زيادة مدة التركيز المتواصل على النشاط الأكاديمي تدريجياً.',
        'تنمية مهارات التنظيم الذاتي وإدارة الانفعال أثناء المواقف التعليمية.',
        'تعزيز الالتزام بالروتين اليومي باستخدام الجداول المصورة.',
        'تقوية المهارات القرائية والحسابية عبر أنشطة قصيرة متعددة الحواس.',
        'تطوير مهارات التفاعل الاجتماعي الإيجابي في مجموعات صغيرة آمنة.',
      ],
      opinionParagraph2:
        'تم تصميم هذه الخطة الفردية بحيث تتكامل الجهود المنزلية والمدرسية في قياس التقدم كل أربعة أسابيع وتعديل الأنشطة وفق استجابة الطفل.',
    },
    englishData: {
      ...DEFAULT_ENGLISH_REPORT_DATA,
      referenceNumber: 'IEP/2026-204',
      reportTitle: 'Individualized Educational & Behavioral Plan (IEP) Summary',
      reportSubtitle: 'Collaborative Home-School Framework for Attention & Self-Regulation',
      envPositive:
        'Observations indicate high responsiveness when tasks are presented in clear sequential steps with visual expectations and immediate positive reinforcement.',
      homeSchoolIntro: 'Priority educational and developmental goals for the current term:',
      homeSchoolBenefits: [
        'Gradually increasing sustained attention span during academic tasks.',
        'Building self-regulation and emotional management skills in learning contexts.',
        'Strengthening adherence to daily routines using visual schedules.',
        'Enhancing literacy and numeracy through brief multisensory activities.',
        'Developing positive social interaction skills in small, supportive groups.',
      ],
      opinionParagraph2:
        'This individualized plan aligns home and school efforts to evaluate progress every four weeks and adapt activities based on the child’s response.',
    },
  },
  {
    id: 'progress-followup',
    name: 'تقرير متابعة وتقييم دوري',
    description: 'تقرير متابعة مرحلي لاستعراض التحسن وتحديث التوصيات للمدرسة.',
    data: {
      ...DEFAULT_REPORT_DATA,
      referenceNumber: 'م/2026-309',
      reportTitle: 'تقرير متابعة تربوي وسلوكي دوري',
      reportSubtitle: 'تقييم مرحلي لاستجابة الطفل للبرنامج التنظيمي والبيئي',
      backgroundParagraph1:
        'أظهر الطفل خلال فترة المتابعة الحالية تحسناً ملحوظاً في الاستجابة للتعليمات عند تطبيق الروتين الواضح وتقليل المثيرات السمعية المفاجئة، مع استمرار الحاجة لدعم تنظيم الانتباه.',
      backgroundParagraph2:
        'لا تزال البيئات المزدحمة أو المتغيرة بصورة غير متوقعة تمثل تحدياً يؤثر مؤقتاً على هدوئه النفسي واستمراريته في الأنشطة، مما يؤكد أهمية الثبات البيئي.',
      opinionParagraph2:
        'نوصي بالاستمرار في النهج التربوي المرن والداعم لاحتياجات الطفل الحالية، مع البناء على مؤشرات التحسن المسجلة لتوسيع فرص مشاركته التدريجية.',
    },
    englishData: {
      ...DEFAULT_ENGLISH_REPORT_DATA,
      referenceNumber: 'FU/2026-309',
      reportTitle: 'Periodic Educational & Behavioral Follow-Up Report',
      reportSubtitle: 'Progress Review of Environmental & Instructional Support',
      backgroundParagraph1:
        'During the current follow-up period, the child demonstrated notable improvement in following instructions under clear routines and reduced sudden auditory stimuli, while continuing to benefit from attention support.',
      backgroundParagraph2:
        'Crowded or unpredictable settings still pose temporary challenges to emotional calm and task persistence, underscoring the ongoing need for environmental consistency.',
      opinionParagraph2:
        'We recommend continuing the flexible, supportive educational approach while building on documented gains to gradually expand participation opportunities.',
    },
  },
];

export const ADDRESSEE_SHORTCUTS: string[] = [
  'السيد الأستاذ الفاضل / مدير المدرسة الموقر',
  'السادة أعضاء لجنة الدمج والتربية الخاصة الموقرين',
  'السيد / مدير إدارة التربية الخاصة بالمديرية التعليمية',
  'الأخصائي النفسي والاجتماعي بالمدرسة الموقر',
];

export const RECOMMENDATION_SHORTCUTS: string[] = [
  'تخصيص مقعد في الصف الأمامي بعيداً عن النوافذ والممرات المزدحمة.',
  'السماح بفترات راحة حركية قصيرة (3-5 دقائق) بين الحصص الدراسية.',
  'تقديم التعليمات الشفهية بصورة مختصرة ومصحوبة ببطاقة بصرية.',
  'إتاحة وقت إضافي بنسبة 25% خلال الاختبارات والتقييمات الدورية.',
  'استخدام دفتر متابعة يومي موجز بين المدرسة وولي الأمر.',
];

export const COMPLAINT_SAMPLES: { title: string; text: string; purpose: string }[] = [
  {
    title: 'تشتت وضوضاء الفصل',
    purpose: 'دعم طلب التعليم المنزلي أو تقليل المثيرات',
    text: 'الطفل عمره 8 سنوات ويعاني من فرط حركة وتشتت انتباه، يشتكي المعلمون أنه يغادر مقعده كثيراً وينفعل بشدة عند ارتفاع صوت زملائه في الفصل، ويفقد تركيزه بعد 10 دقائق، بينما في البيت الهادئ يستوعب الدروس بشكل ممتاز مع والدته.',
  },
  {
    title: 'صعوبة الامتحانات والضغط الصفي',
    purpose: 'طلب ترتيبات صفية وتسهيلات اختبارات',
    text: 'تلميذة في الصف الرابع الابتدائي تعاني من قلق وتشتت انتباه وحساسية للأصوات العالية، تتعثر في إنهاء ورقة الاختبار في الوقت المحدد وتبكي عند المقارنة بزملائها رغم ذكائها الجيد في الفهم الشفهي.',
  },
];

export interface AccentConfig {
  id: AccentTheme;
  label: string;
  primary: string;
  primarySoft: string;
  primaryBorder: string;
  secondary: string;
  mutedText: string;
}

export const ACCENT_THEMES: Record<AccentTheme, AccentConfig> = {
  lapis: {
    id: 'lapis',
    label: 'أزرق لازوردي رسمي',
    primary: '#1E3A8A',
    primarySoft: '#F1F5FB',
    primaryBorder: '#CBD5E1',
    secondary: '#8C6D3F',
    mutedText: '#475569',
  },
  forest: {
    id: 'forest',
    label: 'أخضر مؤسسي داكن',
    primary: '#14532D',
    primarySoft: '#F2F7F4',
    primaryBorder: '#CBD8D0',
    secondary: '#785A28',
    mutedText: '#4B5563',
  },
  bronze: {
    id: 'bronze',
    label: 'برونزي وفحمي كلاسيكي',
    primary: '#292524',
    primarySoft: '#F7F4EE',
    primaryBorder: '#D6CEBE',
    secondary: '#78350F',
    mutedText: '#57534E',
  },
};
