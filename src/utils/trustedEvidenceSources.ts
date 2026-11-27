import {
  LibraryCard,
  LibraryCondition,
  ParentReport15Document,
  ParentReportSectionItem,
  TrustedSourceCitation,
  TrustedSourceOrg,
} from '../types/library';
import { ReportData } from '../types/report';

const MEDICATION_BLACKLIST_RE =
  /\b(ريتالين|كونسيرتا|ستراتيرا|أتوموكسيتين|ميثيلفينيديت|ريسبيريدون|ريسبيردال|بروزاك|زولوفت|فلوكسيتين|سيرترالين|هالوبيريدول|أدوية|دواء|عقار|عقاقير|حبوب|جرعة|ملجم|mg|ritalin|concerta|strattera|atomoxetine|methylphenidate|risperidone|prozac|zoloft|fluoxetine|sertraline|medication|prescription|dosage|drug)\b/gi;

export function containsMedicationLanguage(text: string): boolean {
  MEDICATION_BLACKLIST_RE.lastIndex = 0;
  return MEDICATION_BLACKLIST_RE.test(text);
}

export function sanitizeNoMedicationText(text: string): string {
  if (!text) return '';
  MEDICATION_BLACKLIST_RE.lastIndex = 0;
  if (!MEDICATION_BLACKLIST_RE.test(text)) return text;
  return (
    text
      .replace(MEDICATION_BLACKLIST_RE, '[توجيه تربوي غير دوائي]')
      .trim() +
    ' (ملاحظة مهنية: يقتصر التقرير على التوصيات التربوية والسلوكية والتأهيلية فقط، ولا يتضمن أي توصيات دوائية).'
  );
}

const TODAY_DATE = () => new Date().toISOString().slice(0, 10);

export const VERIFIED_TRUSTED_SOURCES: Record<LibraryCondition, TrustedSourceCitation[]> = {
  ADHD: [
    {
      id: 'cit-adhd-nimh',
      org: 'NIMH',
      title: 'Attention-Deficit/Hyperactivity Disorder (ADHD) Overview & Behavioral Support',
      url: 'https://www.nimh.nih.gov/health/topics/attention-deficit-hyperactivity-disorder-adhd',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'يُعد تدريب الوالدين على إدارة السلوك والترتيبات الصفية التربوية ركيزة أساسية لتنظيم الانتباه وخفض الاندفاعية وتطوير الوظائف التنفيذية لدى الأطفال.',
    },
    {
      id: 'cit-adhd-cdc',
      org: 'CDC',
      title: 'CDC Behavioral Therapy & School Accommodations for ADHD',
      url: 'https://www.cdc.gov/adhd/treatment/index.html',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'توصي مراكز السيطرة على الأمراض (CDC) بالبدء بالتدريب السلوكي للأسرة وبناء بيئة صفية واضحة الروتين وتجزئة المهام مع تعزيز إيجابي فوري.',
    },
    {
      id: 'cit-adhd-dsm',
      org: 'DSM-5-TR',
      title: 'DSM-5-TR Neurodevelopmental Criteria (Inattention & Hyperactivity-Impulsivity)',
      url: 'https://www.psychiatry.org/psychiatrists/practice/dsm',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'يشترط الدليل المرجعي ظهور المؤشرات عبر أكثر من بيئة واحدة (المنزل والمدرسة) مع مراعاة الأثر الوظيفي والتربوي قبل وضع الترتيبات الصفية.',
    },
  ],
  توحد: [
    {
      id: 'cit-asd-who',
      org: 'WHO',
      title: 'WHO Autism Spectrum Disorder & Caregiver Skills Framework',
      url: 'https://www.who.int/news-room/fact-sheets/detail/autism-spectrum-disorders',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'تؤكد منظمة الصحة العالمية (WHO) فعالية التدخلات النفسية الاجتماعية المبنية على الأدلة وإشراك الأسرة وبناء البيئات الدامجة وتيسير التواصل البصري والبديل.',
    },
    {
      id: 'cit-asd-cdc',
      org: 'CDC',
      title: 'CDC Autism Signs, Early Intervention & Visual Support Strategies',
      url: 'https://www.cdc.gov/autism/signs-symptoms/index.html',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'تشدد CDC على أهمية التدخل المبكر لتنمية التواصل الوظيفي وتنظيم الجداول البصرية وتهدئة البيئة الحسية لتسهيل الانتقال والمشاركة.',
    },
    {
      id: 'cit-asd-dsm',
      org: 'DSM-5-TR',
      title: 'DSM-5-TR Autism Spectrum Support Levels & Sensory Profile',
      url: 'https://www.psychiatry.org/psychiatrists/practice/dsm',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'يتطلب التقييم رصد مستوى الدعم التواصلي والاجتماعي ومراعاة الاستجابات الحسية والروتين ضمن بيئة الصف والمنزل.',
    },
  ],
  تخاطب: [
    {
      id: 'cit-sp-asha',
      org: 'ASHA',
      title: 'ASHA Spoken Language, Fluency & Speech Sound Disorders Guidelines',
      url: 'https://www.asha.org/practice-portal/clinical-topics/spoken-language-disorders/',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'تؤكد الجمعية الأمريكية للنطق واللغة والسمع (ASHA) دور النمذجة اللغوية الطبيعية والتوسيع اللفظي والوعي الصوتي وفحص السمع في خطط التخاطب.',
    },
    {
      id: 'cit-sp-cdc',
      org: 'CDC',
      title: 'CDC Developmental Communication Milestones & Early Support',
      url: 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'يدعو برنامج التحقق المبكر من CDC إلى رصد المعالم اللغوية مبكراً وتعزيز التفاعل اللغوي اليومي بين الطفل والأسرة بعيداً عن الشاشات الصامتة.',
    },
  ],
  'صعوبات تعلم': [
    {
      id: 'cit-ld-dsm',
      org: 'DSM-5-TR',
      title: 'DSM-5-TR Specific Learning Disorder (Reading, Writing, Mathematics)',
      url: 'https://www.psychiatry.org/psychiatrists/practice/dsm',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'يعرّف الدليل المرجعي صعوبات التعلم كصعوبة نوعية في القراءة أو الكتابة أو الحساب رغم سلامة الذكاء، مما يستوجب تعليماً منظماً وتيسيرات صفية وامتحانية.',
    },
    {
      id: 'cit-ld-asha',
      org: 'ASHA',
      title: 'ASHA Structured Literacy & Phonological Awareness Support',
      url: 'https://www.asha.org/practice-portal/clinical-topics/written-language-disorders/',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'توصي ASHA بتكامل الوعي الفونولوجي مع التدريب متعدد الحواس لبناء الطلاقة القرائية والإملائية بثبات.',
    },
  ],
  قلق: [
    {
      id: 'cit-anx-nimh',
      org: 'NIMH',
      title: 'NIMH Anxiety Disorders in Children & Cognitive Behavioral Strategies',
      url: 'https://www.nimh.nih.gov/health/topics/anxiety-disorders',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'تؤكد NIMH فعالية البرامج السلوكية المعرفية المبسطة وفنيات التدرج في المواجهة وتقليل تجنب المواقف المدرسية ودعم الوالدين المتوازن.',
    },
    {
      id: 'cit-anx-who',
      org: 'WHO',
      title: 'WHO Child & Adolescent Mental Health Promotion & School Support',
      url: 'https://www.who.int/news-room/fact-sheets/detail/adolescent-mental-health',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'تركز منظمة الصحة العالمية على بناء بيئات مدرسية آمنة دافئة وتنمية مهارات التنظيم الانفعالي والوقاية من الضغوط.',
    },
  ],
  وسواس: [
    {
      id: 'cit-ocd-nimh',
      org: 'NIMH',
      title: 'NIMH Obsessive-Compulsive Disorder & Exposure Response Prevention Concepts',
      url: 'https://www.nimh.nih.gov/health/topics/obsessive-compulsive-disorder-ocd',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'تشير مراجع NIMH إلى فعالية التدخل السلوكي بالتعرض المتدرج وتأجيل الطقوس في بيئة آمنة مع تدريب الأسرة على تقليل الطمأنة المتكررة.',
    },
    {
      id: 'cit-ocd-dsm',
      org: 'DSM-5-TR',
      title: 'DSM-5-TR Pediatric OCD Criteria & Functional Care Guidance',
      url: 'https://www.psychiatry.org/psychiatrists/practice/dsm',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'تمييز الطبيعة الاقتحامية للأفكار وتأثيرها اليومي دون وصمة مع إحالة الحالات الشديدة للتقييم الطبي التخصصي دون إصدار وصفات دوائية بالتقرير التربوي.',
    },
  ],
  'كل الحالات': [
    {
      id: 'cit-gen-who',
      org: 'WHO',
      title: 'WHO Caregiver Skills Training & Inclusive Rehabilitation Standards',
      url: 'https://www.who.int/teams/mental-health-and-substance-use/treatment-care/who-caregivers-skills-training-for-families-of-children-with-developmental-delays-and-disorders',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'شراكة الأسرة والمدرسة والبيئة الهادئة المنظمة والأهداف القابلة للقياس تشكل حجر الأساس للتقدم الوظيفي والدمج التربوي.',
    },
    {
      id: 'cit-gen-cdc',
      org: 'CDC',
      title: 'CDC Child Development, Positive Parenting & Evidence-Based Behavioral Support',
      url: 'https://www.cdc.gov/child-development/positive-parenting-tips/index.html',
      retrievedDate: TODAY_DATE(),
      summaryAr:
        'التعزيز الإيجابي والروتين الثابت والمتابعة الدورية كل 4–6 أسابيع ترفع الاستقرار السلوكي والتعليمي للطفل.',
    },
  ],
};

export async function fetchTrustedEnrichment(params: {
  complaintText: string;
  matchedConditions: LibraryCondition[];
}): Promise<{
  citations: TrustedSourceCitation[];
  usedOnline: boolean;
}> {
  const uniqueConditions = Array.from(
    new Set(params.matchedConditions.length > 0 ? params.matchedConditions : ['كل الحالات'])
  ) as LibraryCondition[];

  const localCitations: TrustedSourceCitation[] = [];
  const seenUrls = new Set<string>();

  uniqueConditions.forEach((cond) => {
    (VERIFIED_TRUSTED_SOURCES[cond] || []).forEach((c) => {
      if (!seenUrls.has(c.url + c.org)) {
        seenUrls.add(c.url + c.org);
        localCitations.push({ ...c, retrievedDate: TODAY_DATE() });
      }
    });
  });

  if (localCitations.length < 3) {
    VERIFIED_TRUSTED_SOURCES['كل الحالات'].forEach((c) => {
      if (!seenUrls.has(c.url + c.org)) {
        seenUrls.add(c.url + c.org);
        localCitations.push({ ...c, retrievedDate: TODAY_DATE() });
      }
    });
  }

  // Attempt optional online trusted lookup from backend only when reachable & clean
  try {
    const resp = await fetch('/api/report/trusted-enrichment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaintText: params.complaintText,
        conditions: uniqueConditions,
      }),
    });
    if (resp.ok) {
      const json = await resp.json();
      if (Array.isArray(json.citations) && json.citations.length > 0) {
        const validOrgs = new Set<TrustedSourceOrg>([
          'NIMH',
          'DSM-5-TR',
          'WHO',
          'CDC',
          'ASHA',
        ]);
        const filtered: TrustedSourceCitation[] = json.citations
          .filter(
            (item: TrustedSourceCitation) =>
              item &&
              validOrgs.has(item.org) &&
              typeof item.url === 'string' &&
              item.url.startsWith('https://') &&
              !containsMedicationLanguage(`${item.title} ${item.summaryAr}`)
          )
          .map((item: TrustedSourceCitation, idx: number) => ({
            id: item.id || `online-cit-${idx}`,
            org: item.org,
            title: sanitizeNoMedicationText(item.title),
            url: item.url,
            retrievedDate: item.retrievedDate || TODAY_DATE(),
            summaryAr: sanitizeNoMedicationText(item.summaryAr),
          }));

        if (filtered.length > 0) {
          return { citations: filtered.slice(0, 5), usedOnline: true };
        }
      }
    }
  } catch {
    // Graceful silent offline fallback to curated NIMH / DSM-5-TR / WHO / CDC / ASHA citations
  }

  return { citations: localCitations.slice(0, 5), usedOnline: false };
}

export function buildParentReport15Sections(params: {
  childName: string;
  age: string;
  birthDate: string;
  guardianName: string;
  guardianPhone: string;
  centerName: string;
  specialistName: string;
  specialistRole: string;
  complaintText: string;
  matchedCards: LibraryCard[];
  citations: TrustedSourceCitation[];
}): ParentReport15Document {
  const {
    childName,
    age,
    birthDate,
    guardianName,
    guardianPhone,
    centerName,
    specialistName,
    specialistRole,
    complaintText,
    matchedCards,
    citations,
  } = params;

  const primary = matchedCards[0];
  const secondary = matchedCards[1];
  const today = TODAY_DATE();

  const allSymptoms = Array.from(
    new Set(matchedCards.flatMap((c) => c.symptoms).slice(0, 6))
  );
  const allSmartGoals = Array.from(
    new Set(matchedCards.flatMap((c) => c.goalsSMART).slice(0, 5))
  );
  const allActivities = matchedCards.flatMap((c) => c.activities).slice(0, 4);
  const famRecs = Array.from(
    new Set(matchedCards.flatMap((c) => c.recommendationsFamily).slice(0, 6))
  );
  const schoolRecs = Array.from(
    new Set(matchedCards.flatMap((c) => c.recommendationsSchool).slice(0, 6))
  );
  const specRecs = Array.from(
    new Set(matchedCards.flatMap((c) => c.recommendationsSpecialist).slice(0, 6))
  );

  const sections: ParentReportSectionItem[] = [
    {
      id: 'sec-01',
      number: 1,
      title: '1. الغلاف والهوية المؤسسية للتقرير',
      content: `${centerName}\nتقرير تقييمي وتأهيلي شامل ومُوثّق لولي الأمر والجهات التربوية\nرقم المرجع: PR-${today.replace(/-/g, '')} | تاريخ الإصدار: ${today}`,
      sourceTag: 'بيانات المركز الرسمية',
      status: 'pending',
    },
    {
      id: 'sec-02',
      number: 2,
      title: '2. البيانات الأساسية للطفل',
      content: `الاسم: ${childName || '[ ... ]'} | العمر: ${age || '[ ... ]'} | تاريخ الميلاد: ${birthDate || '[ ... ]'}\nولي الأمر: ${guardianName || '[ ... ]'} | الهاتف: ${guardianPhone || '[ ... ]'}`,
      sourceTag: 'استمارة الاستقبال',
      status: 'pending',
    },
    {
      id: 'sec-03',
      number: 3,
      title: '3. سبب الإحالة والشكوى الرئيسية المبدئية',
      content: sanitizeNoMedicationText(complaintText.trim() || '[ ... ]'),
      sourceTag: 'إفادة ولي الأمر',
      status: 'pending',
    },
    {
      id: 'sec-04',
      number: 4,
      title: '4. الخلفية النمائية والتعريف المبدئي بالحالة',
      content: primary
        ? `${primary.title}: ${primary.definition}${secondary ? `\nكما لوحظت مؤشرات مرتبطة بـ (${secondary.title}).` : ''}`
        : 'مراجعة نمائية شاملة للجوانب السلوكية والتواصلية والتعليمية للطفل.',
      sourceTag: primary ? `بطاقة مكتبة: ${primary.id} (${primary.source})` : 'المكتبة الذكية',
      status: 'pending',
    },
    {
      id: 'sec-05',
      number: 5,
      title: '5. المؤشرات السلوكية والملاحظات الميدانية',
      content:
        allSymptoms.length > 0
          ? allSymptoms.map((s, i) => `${i + 1}. ${s}`).join('\n')
          : 'رصد ميداني منتظم لسلوك الطفل في المواقف التعليمية واليومية.',
      sourceTag: matchedCards.map((c) => c.title).join(' · ') || 'الملاحظة الميدانية',
      status: 'pending',
    },
    {
      id: 'sec-06',
      number: 6,
      title: '6. نقاط القوة والفرص الإيجابية الحالية',
      content:
        'يستجيب الطفل بصورة أفضل في البيئات الهادئة المنظمة ذات التوقعات الواضحة والتعزيز الفوري، مع قابلية واضحة للنمو عند تقسيم المهام واستخدام المعينات البصرية.',
      sourceTag: 'مؤشرات التقييم الإيجابي',
      status: 'pending',
    },
    {
      id: 'sec-07',
      number: 7,
      title: '7. التحليل الوظيفي والاعتبارات الفارقة (دون قطع طبي)',
      content: primary
        ? `الاعتبارات الفارقة المرجعية:\n${primary.differential.map((d) => `• ${d}`).join('\n')}\n(ملاحظة: يقتصر التقرير على التقييم التربوي والتأهيلي وخالٍ تماماً من أي معلومات دوائية).`
        : 'تم تحليل السوابق والنتائج في البيئة المحيطة لصياغة خطة تربوية آمنة.',
      sourceTag: primary?.source || 'DSM-5-TR & التقييم الوظيفي',
      status: 'pending',
    },
    {
      id: 'sec-08',
      number: 8,
      title: '8. مقارنة الأولويات ومعايير البدء',
      content: matchedCards
        .slice(0, 3)
        .map(
          (c, idx) =>
            `${idx + 1}) ${c.title} (${c.folder}) — الفئة العمرية المرجعية: ${c.ageRange}`
        )
        .join('\n') || 'تحديد أولويات التدخل حسب الاحتياج الوظيفي الحالي.',
      sourceTag: 'فهرس الأولويات',
      status: 'pending',
    },
    {
      id: 'sec-09',
      number: 9,
      title: '9. المراجع العلمية الموثقة (NIMH / DSM-5-TR / WHO / CDC / ASHA)',
      content: citations
        .map(
          (cit, idx) =>
            `[${idx + 1}] ${cit.org}: ${cit.title}\n    الملخص: ${sanitizeNoMedicationText(cit.summaryAr)}\n    الرابط: ${cit.url} | تاريخ الاستشهاد: ${cit.retrievedDate}`
        )
        .join('\n\n'),
      sourceTag: citations.map((c) => c.org).join(' · '),
      status: 'pending',
    },
    {
      id: 'sec-10',
      number: 10,
      title: '10. الأهداف الذكية القابلة للقياس (SMART Goals)',
      content:
        allSmartGoals.length > 0
          ? allSmartGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')
          : 'بناء 3 أهداف عملية قابلة للقياس الأسبوعي في الجلسات والمنزل.',
      sourceTag: 'خطة الأهداف الذكية',
      status: 'pending',
    },
    {
      id: 'sec-11',
      number: 11,
      title: '11. خطة الأنشطة والتدخل العملي بالمركز',
      content:
        allActivities.length > 0
          ? allActivities
              .map(
                (a, i) =>
                  `${i + 1}. ${a.name} (${a.duration})\n   الأدوات: ${a.tools}\n   الخطوات: ${a.steps.join(' ← ')}\n   معيار النجاح: ${a.success}`
              )
              .join('\n\n')
          : 'تطبيق أنشطة منظمة متدرجة 3 مرات أسبوعياً.',
      sourceTag: 'بنك الأنشطة التأهيلية',
      status: 'pending',
    },
    {
      id: 'sec-12',
      number: 12,
      title: '12. التوصيات العملية للأسرة والمنزل',
      content:
        famRecs.length > 0
          ? famRecs.map((r, i) => `${i + 1}. ${r}`).join('\n')
          : 'توفير روتين منزلي هادئ وتعزيز إيجابي فوري.',
      sourceTag: 'دليل الإرشاد الأسري',
      status: 'pending',
    },
    {
      id: 'sec-13',
      number: 13,
      title: '13. التوصيات والترتيبات الميسرة للمدرسة والصف',
      content:
        schoolRecs.length > 0
          ? schoolRecs.map((r, i) => `${i + 1}. ${r}`).join('\n')
          : 'مقعد أمامي هادئ، وتقسيم المهام، ومنح وقت مرن عند التقييم.',
      sourceTag: 'بروتوكول الدمج المدرسي',
      status: 'pending',
    },
    {
      id: 'sec-14',
      number: 14,
      title: '14. توصيات الأخصائي ومعايير القياس والمتابعة الدورية',
      content: `${specRecs.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nمعيار القياس الدوري:\n${matchedCards
        .slice(0, 2)
        .map((c) => `• ${c.measurement}`)
        .join('\n')}`,
      sourceTag: 'خطة القياس والانضباط المهني',
      status: 'pending',
    },
    {
      id: 'sec-15',
      number: 15,
      title: '15. الخلاصة التنفيذية وختم المراجعة والتوقيع',
      content: `بناءً على المراجعة المهنية والتأهيلية، يوصى بالبدء الفوري بالتنفيذ المتكامل بين المنزل والمركز والمدرسة مع إعادة التقييم خلال 6 أسابيع.\nإعداد ومراجعة: ${specialistName} (${specialistRole}) — ${centerName}\nتاريخ الاعتماد: ${today}`,
      sourceTag: 'الاعتماد والختم',
      status: 'pending',
    },
  ];

  return {
    id: `parent-rep-${Date.now()}`,
    createdAt: today,
    childName: childName || '[ ... ]',
    age: age || '[ ... ]',
    birthDate: birthDate || '[ ... ]',
    guardianName: guardianName || '[ ... ]',
    guardianPhone: guardianPhone || '[ ... ]',
    centerName,
    specialistName,
    specialistRole,
    complaintText,
    matchedCardIds: matchedCards.map((c) => c.id),
    citations,
    sections,
    confirmations: [false, false, false],
    stamped: false,
  };
}

export function convertParentReport15ToReportData(
  doc: ParentReport15Document,
  base: ReportData
): Partial<ReportData> {
  const activeSec = (n: number) =>
    doc.sections.find((s) => s.number === n && s.status !== 'deleted')?.content || '';

  const famLines = activeSec(12)
    .split('\n')
    .map((l) => l.replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean);
  const schoolLines = activeSec(13)
    .split('\n')
    .map((l) => l.replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean);
  const symptomLines = activeSec(5)
    .split('\n')
    .map((l) => l.replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean);

  return {
    ...base,
    childName: doc.childName,
    age: doc.age,
    birthDate: doc.birthDate,
    phone: doc.guardianPhone || base.phone,
    reportDate: doc.createdAt.replace(/-/g, '/'),
    reportTitle: `تقرير ولي الأمر الموثق حول: ${doc.childName}`,
    reportSubtitle: `خطة الدعم التربوية والتأهيلية المعتمدة (${doc.stamped ? 'مُراجع ومختوم ✓' : 'مسودة'})`,
    diagnosis: activeSec(4).split('\n')[0]?.slice(0, 180) || base.diagnosis,
    backgroundParagraph1: activeSec(3) || base.backgroundParagraph1,
    backgroundParagraph2: activeSec(4) || base.backgroundParagraph2,
    envNegativePoints: symptomLines.length > 0 ? symptomLines.slice(0, 5) : base.envNegativePoints,
    homeSchoolBenefits: famLines.length > 0 ? famLines.slice(0, 7) : base.homeSchoolBenefits,
    recommendations:
      schoolLines.length > 0 || famLines.length > 0
        ? Array.from(new Set([...famLines, ...schoolLines])).slice(0, 10)
        : base.recommendations,
    opinionParagraph1: activeSec(7) || base.opinionParagraph1,
    opinionParagraph2: activeSec(9) || base.opinionParagraph2,
    opinionParagraph3: activeSec(14) || base.opinionParagraph3,
    coreGoalQuote: activeSec(10).split('\n')[0] || base.coreGoalQuote,
    preparedBy: doc.specialistName || base.preparedBy,
    professionalTitle: doc.specialistRole || base.professionalTitle,
    signCenterName: doc.centerName || base.signCenterName,
    signDate: (doc.stampedAt || doc.createdAt).replace(/-/g, '/'),
  };
}
