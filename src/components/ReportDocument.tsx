import React from 'react';
import {
  ACCENT_THEMES,
  AccentTheme,
  LayoutMode,
  PaperTone,
  ReportData,
  ReportLanguage,
  SectionVisibility,
} from '../types/report';
import {
  DEFAULT_SECTION_ORDER,
  EditTargetDescriptor,
  ReportSectionKey,
} from '../types/clickEdit';
import { LightThemeDefinition, ReportExtras } from '../types/studio';
import {
  CenterEmblem,
  CenterOfficialStamp,
  SignatureFlourish,
} from './CenterEmblem';
import { EditableBlock } from './EditableBlock';
import { ReportExtrasRenderer } from './ReportExtrasRenderer';

interface ReportDocumentProps {
  data: ReportData;
  layoutMode: LayoutMode;
  paperTone: PaperTone;
  accentTheme: AccentTheme;
  showStamp: boolean;
  visibility: SectionVisibility;
  language: ReportLanguage;
  extras?: ReportExtras;
  lightTheme?: LightThemeDefinition;
  fontSizeScale?: 'small' | 'medium' | 'large';
  clickEditEnabled?: boolean;
  onSelectBlock?: (target: EditTargetDescriptor) => void;
  page1Ref?: React.RefObject<HTMLDivElement | null>;
  page2Ref?: React.RefObject<HTMLDivElement | null>;
}

const SectionHeading: React.FC<{
  index: string;
  title: string;
  primary: string;
  secondary: string;
  compact?: boolean;
}> = ({ index, title, primary, secondary, compact = false }) => (
  <div
    className={`flex items-baseline justify-between border-b pb-1 ${
      compact ? 'mb-1.5' : 'mb-3 pb-1.5'
    }`}
    style={{ borderColor: `${primary}26` }}
  >
    <div className="flex items-baseline gap-2">
      <span
        className={`font-editorial font-bold ${compact ? 'text-[13px]' : 'text-[16px]'}`}
        style={{ color: secondary }}
      >
        {index}
      </span>
      <h2
        className={`font-editorial font-bold tracking-normal ${
          compact ? 'text-[14.5px]' : 'text-[18px]'
        }`}
        style={{ color: primary }}
      >
        {title}
      </h2>
    </div>
  </div>
);

export const ReportDocument: React.FC<ReportDocumentProps> = ({
  data,
  layoutMode,
  paperTone,
  accentTheme,
  showStamp,
  visibility,
  language,
  extras,
  lightTheme,
  fontSizeScale = 'medium',
  clickEditEnabled = false,
  onSelectBlock,
  page1Ref,
  page2Ref,
}) => {
  const stylesMap = extras?.blockStyles || {};
  const sectionOrder: ReportSectionKey[] =
    extras?.sectionOrder && extras.sectionOrder.length > 0
      ? extras.sectionOrder
      : DEFAULT_SECTION_ORDER;
  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';
  const baseTheme = ACCENT_THEMES[accentTheme];
  const theme = lightTheme
    ? {
        ...baseTheme,
        primary: lightTheme.headingColor,
        primarySoft: lightTheme.accentSoft,
        primaryBorder: lightTheme.borderColor,
        secondary: lightTheme.accentColor,
      }
    : baseTheme;
  const paperBg = lightTheme
    ? lightTheme.pageBg
    : paperTone === 'archival'
    ? '#FBF9F5'
    : '#FFFFFF';
  const surfaceBg = lightTheme
    ? lightTheme.surfaceBg
    : paperTone === 'archival'
    ? '#F4EFE6'
    : theme.primarySoft;
  const borderSubtle = lightTheme
    ? lightTheme.borderColor
    : paperTone === 'archival'
    ? '#DDD5C7'
    : theme.primaryBorder;

  const hasExtras = Boolean(
    extras &&
      ((extras.extrasVisibility.summary &&
        (extras.summaryText.trim() || extras.quickSummaryLines.length > 0)) ||
        (extras.extrasVisibility.plan && extras.planGoals.length > 0) ||
        (extras.extrasVisibility.charts && extras.charts.length > 0) ||
        (extras.extrasVisibility.tables && extras.tables.length > 0) ||
        (extras.extrasVisibility.behaviorTechniques &&
          extras.selectedBehaviorTechniques.length > 0) ||
        (extras.extrasVisibility.evaluations &&
          extras.selectedEvaluationForms.length > 0))
  );
  const sheetHeightClass = hasExtras ? '!h-auto min-h-[1123px]' : '';
  const scaleZoomStyle =
    fontSizeScale === 'small'
      ? { fontSize: '94%' }
      : fontSizeScale === 'large'
      ? { fontSize: '106%' }
      : undefined;

  const L = isRtl
    ? {
        centerHeaderSuffix: data.centerCity ? ` ب${data.centerCity}` : '',
        supervision: `التقييم التربوي والنمائي · الإشراف الفني: ${data.preparedBy} (${data.directorRole})`,
        ref: 'المرجع',
        regNo: 'رقم القيد',
        date: 'التاريخ',
        phone: 'الهاتف',
        to: 'موجه إلى',
        docBadge: 'وثيقة استرشادية رسمية لدعم الطلب التربوي',
        docBadgeShort: 'تقرير تربوي معتمد',
        s1Idx: 'أولاً:',
        s1Title: 'البيانات الشخصية',
        name: 'الاسم',
        dob: 'تاريخ الميلاد',
        age: 'العمر',
        diag: 'التشخيص المذكور',
        s2Idx: 'ثانياً:',
        s2Title: 'الخلفية النمائية والسلوكية',
        s3Idx: 'ثالثاً:',
        s3Title: 'تأثير البيئة المحيطة على كفاءة التعلم',
        envPosTitle: 'البيئة الهادئة والمنظمة',
        envPosResult: 'النتيجة: تركيز أعلى · مشاركة أفضل · إنجاز للمهام',
        s4Idx: 'رابعاً:',
        s4Title: 'أهمية التعليم في بيئة منزلية منظمة',
        s5Idx: 'خامساً:',
        s5Title: 'التوصيات التعليمية',
        s6Idx: 'سادساً:',
        s6Title: 'الرأي والتوصية المهنية',
        prep: 'إعداد',
        role: 'الصفة المهنية',
        center: 'المركز',
        sign: 'التوقيع',
        stampBox: 'الختم الرسمي',
        stampPlace: 'مكان الختم',
        page1Foot: 'صفحة 1 من 2 — يتبع التوصيات والرأي المهني',
        page2Foot: 'صفحة 2 من 2',
        runningPrefix: 'تقرير تربوي',
      }
    : {
        centerHeaderSuffix: data.centerCity ? ` - ${data.centerCity}` : '',
        supervision: `Educational & Developmental Assessment · Technical Director: ${data.preparedBy}`,
        ref: 'Ref',
        regNo: 'File No.',
        date: 'Date',
        phone: 'Phone',
        to: 'Addressed To',
        docBadge: 'Official Educational Support Report',
        docBadgeShort: 'Certified Educational Report',
        s1Idx: 'I.',
        s1Title: 'Personal Information',
        name: 'Full Name',
        dob: 'Date of Birth',
        age: 'Age',
        diag: 'Reported Diagnosis',
        s2Idx: 'II.',
        s2Title: 'Developmental & Behavioral Background',
        s3Idx: 'III.',
        s3Title: 'Environmental Impact on Learning Efficiency',
        envPosTitle: 'Calm & Structured Environment',
        envPosResult: 'Outcome: Higher focus · Better engagement · Task completion',
        s4Idx: 'IV.',
        s4Title: 'Value of Structured Home Schooling',
        s5Idx: 'V.',
        s5Title: 'Educational Recommendations',
        s6Idx: 'VI.',
        s6Title: 'Professional Opinion & Recommendation',
        prep: 'Prepared By',
        role: 'Title',
        center: 'Center',
        sign: 'Signature',
        stampBox: 'Official Seal',
        stampPlace: 'Official Stamp',
        page1Foot: 'Page 1 of 2 — Recommendations & Professional Opinion Follow',
        page2Foot: 'Page 2 of 2',
        runningPrefix: 'Educational Report',
      };

  const borderSideClass = isRtl ? 'border-l' : 'border-r';
  const textEndAlign = isRtl ? 'text-left' : 'text-right';

  if (layoutMode === 'single') {
    return (
      <div className="a4-sheet-wrapper shadow-[0_18px_45px_-12px_rgba(28,25,23,0.18)]">
        <article
          ref={page1Ref}
          dir={dir}
          className={`a4-sheet flex flex-col justify-between px-[34px] py-[24px] text-[#1C1917] ${sheetHeightClass}`}
          style={{ backgroundColor: paperBg, ...scaleZoomStyle }}
        >
          <div
            className="pointer-events-none absolute inset-[12px] border"
            style={{ borderColor: `${theme.primary}22` }}
          />
          <div
            className="pointer-events-none absolute inset-[15px] border"
            style={{ borderColor: `${theme.secondary}1F` }}
          />

          <div className="relative z-10 flex flex-col gap-[9px]">
            {/* Official Letterhead */}
            <header
              className="flex items-center justify-between border-b pb-2"
              style={{ borderColor: `${theme.primary}30` }}
            >
              <div className="flex items-center gap-3">
                <CenterEmblem color={theme.primary} accent={theme.secondary} size={48} />
                <div>
                  <EditableBlock
                    as="h1"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['centerName']}
                    target={{
                      blockId: 'centerName',
                      label: 'اسم المركز',
                      kind: 'heading',
                      textValue: data.centerName,
                      dataField: 'centerName',
                    }}
                    className="font-editorial text-[18px] font-bold leading-tight"
                    style={{ color: theme.primary }}
                  >
                    {data.centerName}
                    {L.centerHeaderSuffix}
                  </EditableBlock>
                  <p className="mt-0.5 text-[10px] font-medium text-[#57534E]">
                    {L.supervision}
                  </p>
                </div>
              </div>

              <div className={`${textEndAlign} text-[10px] leading-[1.55] text-[#44403C] tabular-nums-ar shrink-0`}>
                <div>
                  <span className="text-[#78716C]">{L.ref}: </span>
                  <span className="font-semibold text-[#1C1917]">{data.referenceNumber}</span>
                </div>
                <div>
                  <span className="text-[#78716C]">{L.date}: </span>
                  <span className="font-semibold text-[#1C1917]">{data.reportDate}</span>
                </div>
                <div>
                  <span className="text-[#78716C]">{L.phone}: </span>
                  <span dir="ltr" className="inline-block font-semibold text-[#1C1917]">
                    {data.phone}
                  </span>
                </div>
              </div>
            </header>

            {/* School Addressee & Report Title */}
            <section
              className="border px-3.5 py-2"
              style={{ backgroundColor: surfaceBg, borderColor: borderSubtle }}
            >
              <div
                className="flex items-center justify-between border-b pb-1.5 mb-1.5 text-[10.8px]"
                style={{ borderColor: `${theme.primary}1A` }}
              >
                <EditableBlock
                  as="div"
                  editable={clickEditEnabled}
                  onSelect={onSelectBlock}
                  override={stylesMap['schoolAddressee']}
                  target={{
                    blockId: 'schoolAddressee',
                    label: 'الجهة الموجه إليها',
                    kind: 'paragraph',
                    textValue: data.schoolAddressee,
                    dataField: 'schoolAddressee',
                  }}
                  className="font-semibold text-[#1C1917]"
                >
                  <span className="text-[#57534E] font-normal">{L.to}: </span>
                  {data.schoolAddressee}
                </EditableBlock>
                <div className="text-[9.8px] font-medium shrink-0" style={{ color: theme.secondary }}>
                  {L.docBadge}
                </div>
              </div>
              <div className="text-center">
                <EditableBlock
                  as="h2"
                  editable={clickEditEnabled}
                  onSelect={onSelectBlock}
                  override={stylesMap['reportTitle']}
                  target={{
                    blockId: 'reportTitle',
                    label: 'عنوان التقرير الرئيسي',
                    kind: 'heading',
                    textValue: data.reportTitle,
                    dataField: 'reportTitle',
                  }}
                  className="font-editorial text-[16.5px] font-bold leading-snug"
                  style={{ color: theme.primary }}
                >
                  {data.reportTitle}
                </EditableBlock>
                <EditableBlock
                  as="p"
                  editable={clickEditEnabled}
                  onSelect={onSelectBlock}
                  override={stylesMap['reportSubtitle']}
                  target={{
                    blockId: 'reportSubtitle',
                    label: 'العنوان الفرعي / الغرض',
                    kind: 'paragraph',
                    textValue: data.reportSubtitle,
                    dataField: 'reportSubtitle',
                  }}
                  className="text-[10.8px] font-semibold text-[#44403C] mt-0.5"
                >
                  {data.reportSubtitle}
                </EditableBlock>
              </div>
            </section>

            {sectionOrder.map((secKey) => {
              if (secKey === 'personal' && visibility.personal) {
                return (
                  <EditableBlock
                    key="personal"
                    as="section"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['section-personal']}
                    target={{
                      blockId: 'section-personal',
                      label: 'البيانات الشخصية',
                      kind: 'personal-table',
                      textValue: `${data.childName} — ${data.diagnosis}`,
                      sectionKey: 'personal',
                    }}
                  >
                    <SectionHeading
                      index={L.s1Idx}
                      title={L.s1Title}
                      primary={theme.primary}
                      secondary={theme.secondary}
                      compact
                    />
                    <div
                      className="grid grid-cols-12 border text-[10.3px]"
                      style={{ borderColor: borderSubtle }}
                    >
                      <div
                        className={`col-span-3 ${borderSideClass} px-2.5 py-1.5`}
                        style={{ borderColor: borderSubtle }}
                      >
                        <div className="text-[9.2px] text-[#78716C]">{L.name}</div>
                        <div
                          dir="ltr"
                          className={`font-bold text-[#1C1917] mt-0.5 ${isRtl ? 'text-right' : 'text-left'}`}
                        >
                          {data.childName}
                        </div>
                      </div>
                      <div
                        className={`col-span-2 ${borderSideClass} px-2.5 py-1.5`}
                        style={{ borderColor: borderSubtle }}
                      >
                        <div className="text-[9.2px] text-[#78716C]">{L.dob}</div>
                        <div className="font-bold text-[#1C1917] tabular-nums-ar mt-0.5">
                          {data.birthDate}
                        </div>
                      </div>
                      <div
                        className={`col-span-2 ${borderSideClass} px-2.5 py-1.5`}
                        style={{ borderColor: borderSubtle }}
                      >
                        <div className="text-[9.2px] text-[#78716C]">{L.age}</div>
                        <div className="font-bold text-[#1C1917] mt-0.5">{data.age}</div>
                      </div>
                      <div className="col-span-5 px-2.5 py-1.5">
                        <div className="text-[9.2px] text-[#78716C]">{L.diag}</div>
                        <div className="font-bold mt-0.5" style={{ color: theme.primary }}>
                          {data.diagnosis}
                        </div>
                      </div>
                    </div>
                  </EditableBlock>
                );
              }

              if (secKey === 'background' && visibility.background) {
                return (
                  <EditableBlock
                    key="background"
                    as="section"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['section-background']}
                    target={{
                      blockId: 'section-background',
                      label: 'الخلفية النمائية والسلوكية (الفقرة الأولى)',
                      kind: 'paragraph',
                      textValue: data.backgroundParagraph1,
                      dataField: 'backgroundParagraph1',
                      sectionKey: 'background',
                    }}
                  >
                    <SectionHeading
                      index={L.s2Idx}
                      title={L.s2Title}
                      primary={theme.primary}
                      secondary={theme.secondary}
                      compact
                    />
                    <div className="space-y-1 text-[10.4px] leading-[1.5] text-[#292524] text-justify">
                      <EditableBlock
                        as="p"
                        editable={clickEditEnabled}
                        onSelect={onSelectBlock}
                        override={stylesMap['backgroundParagraph1']}
                        target={{
                          blockId: 'backgroundParagraph1',
                          label: 'الخلفية النمائية — الفقرة 1',
                          kind: 'paragraph',
                          textValue: data.backgroundParagraph1,
                          dataField: 'backgroundParagraph1',
                          sectionKey: 'background',
                        }}
                      >
                        {data.backgroundParagraph1}
                      </EditableBlock>
                      <EditableBlock
                        as="p"
                        editable={clickEditEnabled}
                        onSelect={onSelectBlock}
                        override={stylesMap['backgroundParagraph2']}
                        target={{
                          blockId: 'backgroundParagraph2',
                          label: 'الخلفية النمائية — الفقرة 2',
                          kind: 'paragraph',
                          textValue: data.backgroundParagraph2,
                          dataField: 'backgroundParagraph2',
                          sectionKey: 'background',
                        }}
                      >
                        {data.backgroundParagraph2}
                      </EditableBlock>
                    </div>
                  </EditableBlock>
                );
              }

              if (secKey === 'environment' && visibility.environment) {
                return (
                  <EditableBlock
                    key="environment"
                    as="section"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['section-environment']}
                    target={{
                      blockId: 'section-environment',
                      label: 'تأثير البيئة (المقدمة)',
                      kind: 'paragraph',
                      textValue: data.envIntro,
                      dataField: 'envIntro',
                      sectionKey: 'environment',
                    }}
                  >
                    <SectionHeading
                      index={L.s3Idx}
                      title={L.s3Title}
                      primary={theme.primary}
                      secondary={theme.secondary}
                      compact
                    />
                    <EditableBlock
                      as="p"
                      editable={clickEditEnabled}
                      onSelect={onSelectBlock}
                      override={stylesMap['envIntro']}
                      target={{
                        blockId: 'envIntro',
                        label: 'مقدمة تأثير البيئة',
                        kind: 'paragraph',
                        textValue: data.envIntro,
                        dataField: 'envIntro',
                        sectionKey: 'environment',
                      }}
                      className="text-[10.3px] text-[#292524] mb-1.5 font-medium"
                    >
                      {data.envIntro}
                    </EditableBlock>
                    <div className="grid grid-cols-12 gap-2.5">
                      <EditableBlock
                        as="div"
                        editable={clickEditEnabled}
                        onSelect={onSelectBlock}
                        override={stylesMap['envPositive']}
                        target={{
                          blockId: 'envPositive',
                          label: 'البيئة الهادئة والمنظمة',
                          kind: 'paragraph',
                          textValue: data.envPositive,
                          dataField: 'envPositive',
                          sectionKey: 'environment',
                        }}
                        className={`${
                          data.envNegativePoints.length > 0 ? 'col-span-5' : 'col-span-12'
                        } border p-2 flex flex-col justify-between`}
                        style={{ backgroundColor: surfaceBg, borderColor: borderSubtle }}
                      >
                        <div>
                          <div
                            className="text-[10.3px] font-bold pb-1 mb-1 border-b"
                            style={{ color: theme.primary, borderColor: `${theme.primary}20` }}
                          >
                            {L.envPosTitle}
                          </div>
                          <p className="text-[10px] leading-[1.5] text-[#292524]">
                            {data.envPositive}
                          </p>
                        </div>
                        <div
                          className="mt-1.5 pt-1 border-t text-[9.2px] font-medium"
                          style={{ color: theme.secondary, borderColor: `${theme.primary}18` }}
                        >
                          {L.envPosResult}
                        </div>
                      </EditableBlock>

                      {data.envNegativePoints.length > 0 && (
                        <div className="col-span-7 border p-2" style={{ borderColor: borderSubtle }}>
                          <EditableBlock
                            as="div"
                            editable={clickEditEnabled}
                            onSelect={onSelectBlock}
                            override={stylesMap['envNegativeIntro']}
                            target={{
                              blockId: 'envNegativeIntro',
                              label: 'عنوان التحديات البيئية',
                              kind: 'paragraph',
                              textValue: data.envNegativeIntro,
                              dataField: 'envNegativeIntro',
                              sectionKey: 'environment',
                            }}
                            className="text-[10.2px] font-bold text-[#44403C] pb-1 mb-1 border-b"
                            style={{ borderColor: borderSubtle }}
                          >
                            {data.envNegativeIntro}
                          </EditableBlock>
                          <ul className="grid grid-cols-1 gap-0.5 text-[9.9px] leading-[1.43] text-[#292524]">
                            {data.envNegativePoints.map((point, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span
                                  className="font-bold tabular-nums-ar shrink-0"
                                  style={{ color: theme.secondary }}
                                >
                                  {idx + 1}.
                                </span>
                                <EditableBlock
                                  as="span"
                                  editable={clickEditEnabled}
                                  onSelect={onSelectBlock}
                                  override={stylesMap[`env-neg-${idx}`]}
                                  target={{
                                    blockId: `env-neg-${idx}`,
                                    label: `تحدي بيئي #${idx + 1}`,
                                    kind: 'list-item',
                                    textValue: point,
                                    listKind: 'envNegativePoints',
                                    listIndex: idx,
                                    listTotal: data.envNegativePoints.length,
                                  }}
                                >
                                  {point}
                                </EditableBlock>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </EditableBlock>
                );
              }

              if (secKey === 'homeSchool' && visibility.homeSchool && data.homeSchoolBenefits.length > 0) {
                return (
                  <EditableBlock
                    key="homeSchool"
                    as="section"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['section-homeSchool']}
                    target={{
                      blockId: 'section-homeSchool',
                      label: 'أهمية التعليم في بيئة منزلية منظمة',
                      kind: 'paragraph',
                      textValue: data.homeSchoolIntro,
                      dataField: 'homeSchoolIntro',
                      sectionKey: 'homeSchool',
                    }}
                  >
                    <SectionHeading
                      index={L.s4Idx}
                      title={L.s4Title}
                      primary={theme.primary}
                      secondary={theme.secondary}
                      compact
                    />
                    <EditableBlock
                      as="p"
                      editable={clickEditEnabled}
                      onSelect={onSelectBlock}
                      override={stylesMap['homeSchoolIntro']}
                      target={{
                        blockId: 'homeSchoolIntro',
                        label: 'مقدمة التعليم المنزلي',
                        kind: 'paragraph',
                        textValue: data.homeSchoolIntro,
                        dataField: 'homeSchoolIntro',
                        sectionKey: 'homeSchool',
                      }}
                      className="text-[10.1px] text-[#44403C] mb-1.5"
                    >
                      {data.homeSchoolIntro}
                    </EditableBlock>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9.9px] leading-[1.4]">
                      {data.homeSchoolBenefits.map((item, idx) => (
                        <EditableBlock
                          key={idx}
                          as="div"
                          editable={clickEditEnabled}
                          onSelect={onSelectBlock}
                          override={stylesMap[`home-benefit-${idx}`]}
                          target={{
                            blockId: `home-benefit-${idx}`,
                            label: `بند التعليم المنزلي #${idx + 1}`,
                            kind: 'list-item',
                            textValue: item,
                            listKind: 'homeSchoolBenefits',
                            listIndex: idx,
                            listTotal: data.homeSchoolBenefits.length,
                          }}
                          className={`flex items-start gap-1.5 pb-1 border-b ${
                            idx === data.homeSchoolBenefits.length - 1 &&
                            data.homeSchoolBenefits.length % 2 === 1
                              ? 'col-span-2'
                              : ''
                          }`}
                          style={{ borderColor: `${theme.primary}14` }}
                        >
                          <span
                            className="font-editorial font-bold tabular-nums-ar text-[11px] shrink-0"
                            style={{ color: theme.primary }}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[#1C1917]">{item}</span>
                        </EditableBlock>
                      ))}
                    </div>
                  </EditableBlock>
                );
              }

              if (secKey === 'recommendations' && visibility.recommendations && data.recommendations.length > 0) {
                return (
                  <EditableBlock
                    key="recommendations"
                    as="section"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['section-recommendations']}
                    target={{
                      blockId: 'section-recommendations',
                      label: 'قسم التوصيات التعليمية',
                      kind: 'paragraph',
                      textValue: data.recommendationsIntro,
                      dataField: 'recommendationsIntro',
                      sectionKey: 'recommendations',
                    }}
                  >
                    <SectionHeading
                      index={L.s5Idx}
                      title={L.s5Title}
                      primary={theme.primary}
                      secondary={theme.secondary}
                      compact
                    />
                    <EditableBlock
                      as="p"
                      editable={clickEditEnabled}
                      onSelect={onSelectBlock}
                      override={stylesMap['recommendationsIntro']}
                      target={{
                        blockId: 'recommendationsIntro',
                        label: 'مقدمة التوصيات',
                        kind: 'paragraph',
                        textValue: data.recommendationsIntro,
                        dataField: 'recommendationsIntro',
                        sectionKey: 'recommendations',
                      }}
                      className="text-[10.1px] text-[#44403C] mb-1.5"
                    >
                      {data.recommendationsIntro}
                    </EditableBlock>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9.8px] leading-[1.38]">
                      {data.recommendations.map((rec, idx) => (
                        <EditableBlock
                          key={idx}
                          as="div"
                          editable={clickEditEnabled}
                          onSelect={onSelectBlock}
                          override={stylesMap[`rec-${idx}`]}
                          target={{
                            blockId: `rec-${idx}`,
                            label: `توصية #${idx + 1}`,
                            kind: 'list-item',
                            textValue: rec,
                            listKind: 'recommendations',
                            listIndex: idx,
                            listTotal: data.recommendations.length,
                          }}
                          className="flex items-start gap-1.5 pb-1 border-b"
                          style={{ borderColor: `${theme.primary}14` }}
                        >
                          <span
                            className="font-bold tabular-nums-ar text-[9.8px] shrink-0 mt-[1px]"
                            style={{ color: theme.secondary }}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[#1C1917]">{rec}</span>
                        </EditableBlock>
                      ))}
                    </div>
                  </EditableBlock>
                );
              }

              if (secKey === 'opinion' && visibility.opinion) {
                return (
                  <EditableBlock
                    key="opinion"
                    as="section"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['section-opinion']}
                    target={{
                      blockId: 'section-opinion',
                      label: 'قسم الرأي والتوصية المهنية',
                      kind: 'paragraph',
                      textValue: data.opinionParagraph1,
                      dataField: 'opinionParagraph1',
                      sectionKey: 'opinion',
                    }}
                  >
                    <SectionHeading
                      index={L.s6Idx}
                      title={L.s6Title}
                      primary={theme.primary}
                      secondary={theme.secondary}
                      compact
                    />
                    <div className="space-y-1 text-[10.1px] leading-[1.46] text-[#292524] text-justify">
                      <EditableBlock
                        as="p"
                        editable={clickEditEnabled}
                        onSelect={onSelectBlock}
                        override={stylesMap['opinionParagraph1']}
                        target={{
                          blockId: 'opinionParagraph1',
                          label: 'الرأي المهني — الفقرة 1',
                          kind: 'paragraph',
                          textValue: data.opinionParagraph1,
                          dataField: 'opinionParagraph1',
                          sectionKey: 'opinion',
                        }}
                      >
                        {data.opinionParagraph1}
                      </EditableBlock>
                      <EditableBlock
                        as="p"
                        editable={clickEditEnabled}
                        onSelect={onSelectBlock}
                        override={stylesMap['opinionParagraph2']}
                        target={{
                          blockId: 'opinionParagraph2',
                          label: 'الرأي المهني — الفقرة 2',
                          kind: 'paragraph',
                          textValue: data.opinionParagraph2,
                          dataField: 'opinionParagraph2',
                          sectionKey: 'opinion',
                        }}
                      >
                        {data.opinionParagraph2}
                      </EditableBlock>
                      <EditableBlock
                        as="p"
                        editable={clickEditEnabled}
                        onSelect={onSelectBlock}
                        override={stylesMap['opinionParagraph3']}
                        target={{
                          blockId: 'opinionParagraph3',
                          label: 'الرأي المهني — الفقرة 3',
                          kind: 'paragraph',
                          textValue: data.opinionParagraph3,
                          dataField: 'opinionParagraph3',
                          sectionKey: 'opinion',
                        }}
                      >
                        {data.opinionParagraph3}
                      </EditableBlock>
                    </div>
                    <EditableBlock
                      as="div"
                      editable={clickEditEnabled}
                      onSelect={onSelectBlock}
                      override={stylesMap['coreGoalQuote']}
                      target={{
                        blockId: 'coreGoalQuote',
                        label: 'الهدف التربوي الأساسي',
                        kind: 'quote',
                        textValue: data.coreGoalQuote,
                        dataField: 'coreGoalQuote',
                      }}
                      className="mt-1.5 border-y py-1.5 px-3 text-center"
                      style={{
                        backgroundColor: surfaceBg,
                        borderColor: `${theme.secondary}55`,
                      }}
                    >
                      <p
                        className="font-editorial text-[11.8px] font-bold leading-snug"
                        style={{ color: theme.primary }}
                      >
                        «{data.coreGoalQuote}»
                      </p>
                    </EditableBlock>
                  </EditableBlock>
                );
              }

              return null;
            })}

            {extras && (
              <ReportExtrasRenderer
                extras={extras}
                primaryColor={theme.primary}
                secondaryColor={theme.secondary}
                surfaceBg={surfaceBg}
                borderColor={borderSubtle}
                isRtl={isRtl}
                compact
                clickEditEnabled={clickEditEnabled}
                onSelectBlock={onSelectBlock}
              />
            )}
          </div>

          {/* Sign-Off & Stamp Footer */}
          <footer
            className="relative z-10 mt-1.5 pt-1.5 border-t"
            style={{ borderColor: `${theme.primary}30` }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <EditableBlock
                  as="p"
                  editable={clickEditEnabled}
                  onSelect={onSelectBlock}
                  override={stylesMap['closingSalutation']}
                  target={{
                    blockId: 'closingSalutation',
                    label: 'عبارة الختام',
                    kind: 'paragraph',
                    textValue: data.closingSalutation,
                    dataField: 'closingSalutation',
                  }}
                  className="text-[10.5px] font-semibold text-[#1C1917] mb-1.5"
                >
                  {data.closingSalutation}
                </EditableBlock>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                  <div>
                    <span className="text-[#78716C]">{L.prep}: </span>
                    <span className="font-bold text-[#1C1917]">{data.preparedBy}</span>
                  </div>
                  <div>
                    <span className="text-[#78716C]">{L.role}: </span>
                    <span className="font-bold text-[#1C1917]">{data.professionalTitle}</span>
                  </div>
                  <div>
                    <span className="text-[#78716C]">{L.center}: </span>
                    <span className="font-semibold text-[#1C1917]">{data.signCenterName}</span>
                  </div>
                  <div>
                    <span className="text-[#78716C]">{L.date}: </span>
                    <span className="font-semibold text-[#1C1917] tabular-nums-ar">
                      {data.signDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                  <div className="text-[9.5px] text-[#78716C] mb-0.5">{L.sign}</div>
                  {showStamp ? (
                    <SignatureFlourish color={theme.primary} />
                  ) : (
                    <div className="h-[34px] w-[105px] border-b border-dotted border-[#78716C]" />
                  )}
                </div>

                <div className="text-center min-w-[116px]">
                  {showStamp ? (
                    <div className="-my-4 scale-[0.82] origin-center">
                      <CenterOfficialStamp
                        centerName={data.centerName}
                        city={data.centerCity}
                        directorName={data.directorName}
                        directorRole={data.directorRole}
                        phone={data.phone}
                        color={theme.primary}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="text-[9.5px] text-[#78716C] mb-1">{L.stampBox}</div>
                      <div className="h-[46px] w-[100px] border border-dashed border-[#A8A29E] flex items-center justify-center text-[9px] text-[#A8A29E]">
                        {L.stampPlace}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </footer>
        </article>
      </div>
    );
  }

  /* TWO-PAGE CLASSIC FORMAL A4 LAYOUT */
  return (
    <div className="flex flex-col gap-8">
      {/* PAGE 1 */}
      <div className="a4-sheet-wrapper shadow-[0_18px_45px_-12px_rgba(28,25,23,0.18)]">
        <article
          ref={page1Ref}
          dir={dir}
          className="a4-sheet flex flex-col justify-between px-[44px] py-[34px] text-[#1C1917]"
          style={{ backgroundColor: paperBg }}
        >
          <div
            className="pointer-events-none absolute inset-[14px] border"
            style={{ borderColor: `${theme.primary}24` }}
          />
          <div
            className="pointer-events-none absolute inset-[18px] border"
            style={{ borderColor: `${theme.secondary}22` }}
          />

          <div className="relative z-10 flex flex-col gap-5">
            <header
              className="flex items-center justify-between border-b pb-4"
              style={{ borderColor: `${theme.primary}33` }}
            >
              <div className="flex items-center gap-4">
                <CenterEmblem color={theme.primary} accent={theme.secondary} size={62} />
                <div>
                  <EditableBlock
                    as="h1"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['centerName']}
                    target={{
                      blockId: 'centerName',
                      label: 'اسم المركز',
                      kind: 'heading',
                      textValue: data.centerName,
                      dataField: 'centerName',
                    }}
                    className="font-editorial text-[23px] font-bold leading-tight"
                    style={{ color: theme.primary }}
                  >
                    {data.centerName}
                    {L.centerHeaderSuffix}
                  </EditableBlock>
                  <p className="mt-1 text-[11.5px] font-medium text-[#57534E]">
                    {data.preparedBy} ({data.directorRole})
                  </p>
                </div>
              </div>

              <div className={`${textEndAlign} text-[11.5px] leading-[1.7] text-[#44403C] tabular-nums-ar shrink-0`}>
                <div>
                  <span className="text-[#78716C]">{L.regNo}: </span>
                  <span className="font-semibold text-[#1C1917]">{data.referenceNumber}</span>
                </div>
                <div>
                  <span className="text-[#78716C]">{L.date}: </span>
                  <span className="font-semibold text-[#1C1917]">{data.reportDate}</span>
                </div>
                <div>
                  <span className="text-[#78716C]">{L.phone}: </span>
                  <span dir="ltr" className="inline-block font-semibold text-[#1C1917]">
                    {data.phone}
                  </span>
                </div>
              </div>
            </header>

            <section
              className="border px-5 py-3.5"
              style={{ backgroundColor: surfaceBg, borderColor: borderSubtle }}
            >
              <div
                className="flex items-center justify-between border-b pb-2.5 mb-2.5 text-[12px]"
                style={{ borderColor: `${theme.primary}1C` }}
              >
                <EditableBlock
                  as="div"
                  editable={clickEditEnabled}
                  onSelect={onSelectBlock}
                  override={stylesMap['schoolAddressee']}
                  target={{
                    blockId: 'schoolAddressee',
                    label: 'الجهة الموجه إليها',
                    kind: 'paragraph',
                    textValue: data.schoolAddressee,
                    dataField: 'schoolAddressee',
                  }}
                  className="font-semibold text-[#1C1917]"
                >
                  <span className="text-[#57534E] font-normal">{L.to}: </span>
                  {data.schoolAddressee}
                </EditableBlock>
                <div className="text-[11px] font-medium shrink-0" style={{ color: theme.secondary }}>
                  {L.docBadgeShort}
                </div>
              </div>
              <div className="text-center">
                <EditableBlock
                  as="h2"
                  editable={clickEditEnabled}
                  onSelect={onSelectBlock}
                  override={stylesMap['reportTitle']}
                  target={{
                    blockId: 'reportTitle',
                    label: 'عنوان التقرير الرئيسي',
                    kind: 'heading',
                    textValue: data.reportTitle,
                    dataField: 'reportTitle',
                  }}
                  className="font-editorial text-[21px] font-bold leading-snug"
                  style={{ color: theme.primary }}
                >
                  {data.reportTitle}
                </EditableBlock>
                <EditableBlock
                  as="p"
                  editable={clickEditEnabled}
                  onSelect={onSelectBlock}
                  override={stylesMap['reportSubtitle']}
                  target={{
                    blockId: 'reportSubtitle',
                    label: 'العنوان الفرعي / الغرض',
                    kind: 'paragraph',
                    textValue: data.reportSubtitle,
                    dataField: 'reportSubtitle',
                  }}
                  className="text-[12.5px] font-semibold text-[#44403C] mt-1"
                >
                  {data.reportSubtitle}
                </EditableBlock>
              </div>
            </section>

            {sectionOrder.map((secKey) => {
              if (secKey === 'personal' && visibility.personal) {
                return (
                  <EditableBlock
                    key="personal"
                    as="section"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['section-personal']}
                    target={{
                      blockId: 'section-personal',
                      label: 'البيانات الشخصية',
                      kind: 'personal-table',
                      textValue: `${data.childName} — ${data.diagnosis}`,
                      sectionKey: 'personal',
                    }}
                  >
                <SectionHeading
                  index={L.s1Idx}
                  title={L.s1Title}
                  primary={theme.primary}
                  secondary={theme.secondary}
                />
                <div
                  className="grid grid-cols-12 border text-[12px]"
                  style={{ borderColor: borderSubtle }}
                >
                  <div
                    className={`col-span-3 ${borderSideClass} px-3.5 py-2.5`}
                    style={{ borderColor: borderSubtle }}
                  >
                    <div className="text-[11px] text-[#78716C]">{L.name}</div>
                    <div
                      dir="ltr"
                      className={`font-bold text-[#1C1917] mt-0.5 ${isRtl ? 'text-right' : 'text-left'}`}
                    >
                      {data.childName}
                    </div>
                  </div>
                  <div
                    className={`col-span-2 ${borderSideClass} px-3.5 py-2.5`}
                    style={{ borderColor: borderSubtle }}
                  >
                    <div className="text-[11px] text-[#78716C]">{L.dob}</div>
                    <div className="font-bold text-[#1C1917] tabular-nums-ar mt-0.5">
                      {data.birthDate}
                    </div>
                  </div>
                  <div
                    className={`col-span-2 ${borderSideClass} px-3.5 py-2.5`}
                    style={{ borderColor: borderSubtle }}
                  >
                    <div className="text-[11px] text-[#78716C]">{L.age}</div>
                    <div className="font-bold text-[#1C1917] mt-0.5">{data.age}</div>
                  </div>
                  <div className="col-span-5 px-3.5 py-2.5">
                    <div className="text-[11px] text-[#78716C]">{L.diag}</div>
                    <div className="font-bold mt-0.5" style={{ color: theme.primary }}>
                      {data.diagnosis}
                    </div>
                  </div>
                </div>
                  </EditableBlock>
                );
              }

              if (secKey === 'background' && visibility.background) {
                return (
                  <EditableBlock
                    key="background"
                    as="section"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['section-background']}
                    target={{
                      blockId: 'section-background',
                      label: 'الخلفية النمائية والسلوكية',
                      kind: 'paragraph',
                      textValue: data.backgroundParagraph1,
                      dataField: 'backgroundParagraph1',
                      sectionKey: 'background',
                    }}
                  >
                <SectionHeading
                  index={L.s2Idx}
                  title={L.s2Title}
                  primary={theme.primary}
                  secondary={theme.secondary}
                />
                <div className="space-y-2 text-[12.5px] leading-[1.72] text-[#292524] text-justify">
                  <EditableBlock
                    as="p"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['backgroundParagraph1']}
                    target={{
                      blockId: 'backgroundParagraph1',
                      label: 'الخلفية النمائية — الفقرة 1',
                      kind: 'paragraph',
                      textValue: data.backgroundParagraph1,
                      dataField: 'backgroundParagraph1',
                      sectionKey: 'background',
                    }}
                  >
                    {data.backgroundParagraph1}
                  </EditableBlock>
                  <EditableBlock
                    as="p"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['backgroundParagraph2']}
                    target={{
                      blockId: 'backgroundParagraph2',
                      label: 'الخلفية النمائية — الفقرة 2',
                      kind: 'paragraph',
                      textValue: data.backgroundParagraph2,
                      dataField: 'backgroundParagraph2',
                      sectionKey: 'background',
                    }}
                  >
                    {data.backgroundParagraph2}
                  </EditableBlock>
                </div>
                  </EditableBlock>
                );
              }

              if (secKey === 'environment' && visibility.environment) {
                return (
                  <EditableBlock
                    key="environment"
                    as="section"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['section-environment']}
                    target={{
                      blockId: 'section-environment',
                      label: 'تأثير البيئة',
                      kind: 'paragraph',
                      textValue: data.envIntro,
                      dataField: 'envIntro',
                      sectionKey: 'environment',
                    }}
                  >
                <SectionHeading
                  index={L.s3Idx}
                  title={L.s3Title}
                  primary={theme.primary}
                  secondary={theme.secondary}
                />
                <EditableBlock
                  as="p"
                  editable={clickEditEnabled}
                  onSelect={onSelectBlock}
                  override={stylesMap['envIntro']}
                  target={{
                    blockId: 'envIntro',
                    label: 'مقدمة تأثير البيئة',
                    kind: 'paragraph',
                    textValue: data.envIntro,
                    dataField: 'envIntro',
                    sectionKey: 'environment',
                  }}
                  className="text-[12.5px] text-[#292524] mb-2.5 font-medium"
                >
                  {data.envIntro}
                </EditableBlock>
                <div className="grid grid-cols-12 gap-4">
                  <EditableBlock
                    as="div"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['envPositive']}
                    target={{
                      blockId: 'envPositive',
                      label: 'البيئة الهادئة والمنظمة',
                      kind: 'paragraph',
                      textValue: data.envPositive,
                      dataField: 'envPositive',
                      sectionKey: 'environment',
                    }}
                    className={`${
                      data.envNegativePoints.length > 0 ? 'col-span-5' : 'col-span-12'
                    } border p-3.5 flex flex-col justify-between`}
                    style={{ backgroundColor: surfaceBg, borderColor: borderSubtle }}
                  >
                    <div>
                      <div
                        className="text-[12px] font-bold pb-1.5 mb-2 border-b"
                        style={{ color: theme.primary, borderColor: `${theme.primary}20` }}
                      >
                        {L.envPosTitle}
                      </div>
                      <p className="text-[12px] leading-[1.68] text-[#292524]">
                        {data.envPositive}
                      </p>
                    </div>
                    <div
                      className="mt-3 pt-2 border-t text-[10.5px] font-medium"
                      style={{ color: theme.secondary, borderColor: `${theme.primary}1A` }}
                    >
                      {L.envPosResult}
                    </div>
                  </EditableBlock>

                  {data.envNegativePoints.length > 0 && (
                    <div className="col-span-7 border p-3.5" style={{ borderColor: borderSubtle }}>
                      <EditableBlock
                        as="div"
                        editable={clickEditEnabled}
                        onSelect={onSelectBlock}
                        override={stylesMap['envNegativeIntro']}
                        target={{
                          blockId: 'envNegativeIntro',
                          label: 'عنوان التحديات البيئية',
                          kind: 'paragraph',
                          textValue: data.envNegativeIntro,
                          dataField: 'envNegativeIntro',
                          sectionKey: 'environment',
                        }}
                        className="text-[12px] font-bold text-[#44403C] pb-1.5 mb-2 border-b"
                        style={{ borderColor: borderSubtle }}
                      >
                        {data.envNegativeIntro}
                      </EditableBlock>
                      <ul className="space-y-1.5 text-[12px] leading-[1.58] text-[#292524]">
                        {data.envNegativePoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span
                              className="font-bold tabular-nums-ar shrink-0"
                              style={{ color: theme.secondary }}
                            >
                              {idx + 1}.
                            </span>
                            <EditableBlock
                              as="span"
                              editable={clickEditEnabled}
                              onSelect={onSelectBlock}
                              override={stylesMap[`env-neg-${idx}`]}
                              target={{
                                blockId: `env-neg-${idx}`,
                                label: `تحدي بيئي #${idx + 1}`,
                                kind: 'list-item',
                                textValue: point,
                                listKind: 'envNegativePoints',
                                listIndex: idx,
                                listTotal: data.envNegativePoints.length,
                              }}
                            >
                              {point}
                            </EditableBlock>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                  </EditableBlock>
                );
              }

              if (secKey === 'homeSchool' && visibility.homeSchool && data.homeSchoolBenefits.length > 0) {
                return (
                  <EditableBlock
                    key="homeSchool"
                    as="section"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['section-homeSchool']}
                    target={{
                      blockId: 'section-homeSchool',
                      label: 'أهمية التعليم في بيئة منزلية منظمة',
                      kind: 'paragraph',
                      textValue: data.homeSchoolIntro,
                      dataField: 'homeSchoolIntro',
                      sectionKey: 'homeSchool',
                    }}
                  >
                <SectionHeading
                  index={L.s4Idx}
                  title={L.s4Title}
                  primary={theme.primary}
                  secondary={theme.secondary}
                />
                <EditableBlock
                  as="p"
                  editable={clickEditEnabled}
                  onSelect={onSelectBlock}
                  override={stylesMap['homeSchoolIntro']}
                  target={{
                    blockId: 'homeSchoolIntro',
                    label: 'مقدمة التعليم المنزلي',
                    kind: 'paragraph',
                    textValue: data.homeSchoolIntro,
                    dataField: 'homeSchoolIntro',
                    sectionKey: 'homeSchool',
                  }}
                  className="text-[12.2px] text-[#44403C] mb-2.5"
                >
                  {data.homeSchoolIntro}
                </EditableBlock>
                <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-[11.8px] leading-[1.55]">
                  {data.homeSchoolBenefits.map((item, idx) => (
                    <EditableBlock
                      key={idx}
                      as="div"
                      editable={clickEditEnabled}
                      onSelect={onSelectBlock}
                      override={stylesMap[`home-benefit-${idx}`]}
                      target={{
                        blockId: `home-benefit-${idx}`,
                        label: `بند التعليم المنزلي #${idx + 1}`,
                        kind: 'list-item',
                        textValue: item,
                        listKind: 'homeSchoolBenefits',
                        listIndex: idx,
                        listTotal: data.homeSchoolBenefits.length,
                      }}
                      className={`flex items-start gap-2 pb-1.5 border-b ${
                        idx === data.homeSchoolBenefits.length - 1 &&
                        data.homeSchoolBenefits.length % 2 === 1
                          ? 'col-span-2'
                          : ''
                      }`}
                      style={{ borderColor: `${theme.primary}15` }}
                    >
                      <span
                        className="font-editorial font-bold tabular-nums-ar text-[13px] shrink-0"
                        style={{ color: theme.primary }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[#1C1917]">{item}</span>
                    </EditableBlock>
                  ))}
                </div>
                  </EditableBlock>
                );
              }

              return null;
            })}
          </div>

          <footer
            className="relative z-10 flex items-center justify-between border-t pt-2.5 text-[10.5px] text-[#78716C]"
            style={{ borderColor: `${theme.primary}26` }}
          >
            <span>
              {data.centerName}
              {L.centerHeaderSuffix} · {data.preparedBy} ·{' '}
              <span dir="ltr" className="inline-block tabular-nums-ar">
                {data.phone}
              </span>
            </span>
            <span className="font-semibold" style={{ color: theme.primary }}>
              {L.page1Foot}
            </span>
          </footer>
        </article>
      </div>

      {/* PAGE 2 */}
      <div className="a4-sheet-wrapper shadow-[0_18px_45px_-12px_rgba(28,25,23,0.18)]">
        <article
          ref={page2Ref}
          dir={dir}
          className={`a4-sheet flex flex-col justify-between px-[44px] py-[36px] text-[#1C1917] ${sheetHeightClass}`}
          style={{ backgroundColor: paperBg, ...scaleZoomStyle }}
        >
          <div
            className="pointer-events-none absolute inset-[14px] border"
            style={{ borderColor: `${theme.primary}24` }}
          />
          <div
            className="pointer-events-none absolute inset-[18px] border"
            style={{ borderColor: `${theme.secondary}22` }}
          />

          <div className="relative z-10 flex flex-col gap-6">
            <header
              className="flex items-center justify-between border-b pb-3 text-[11px] text-[#57534E]"
              style={{ borderColor: `${theme.primary}28` }}
            >
              <div className="flex items-center gap-2.5">
                <CenterEmblem color={theme.primary} accent={theme.secondary} size={30} />
                <span className="font-editorial text-[14px] font-bold" style={{ color: theme.primary }}>
                  {data.centerName}
                  {L.centerHeaderSuffix}
                </span>
                <span>·</span>
                <span>
                  {L.runningPrefix}: {data.childName}
                </span>
              </div>
              <div className="tabular-nums-ar">
                <span>
                  {L.ref}: {data.referenceNumber}
                </span>
                <span className="mx-2">·</span>
                <span>{data.reportDate}</span>
              </div>
            </header>

            {sectionOrder.map((secKey) => {
              if (secKey === 'recommendations' && visibility.recommendations && data.recommendations.length > 0) {
                return (
                  <EditableBlock
                    key="recommendations"
                    as="section"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['section-recommendations']}
                    target={{
                      blockId: 'section-recommendations',
                      label: 'قسم التوصيات التعليمية',
                      kind: 'paragraph',
                      textValue: data.recommendationsIntro,
                      dataField: 'recommendationsIntro',
                      sectionKey: 'recommendations',
                    }}
                  >
                <SectionHeading
                  index={L.s5Idx}
                  title={L.s5Title}
                  primary={theme.primary}
                  secondary={theme.secondary}
                />
                <EditableBlock
                  as="p"
                  editable={clickEditEnabled}
                  onSelect={onSelectBlock}
                  override={stylesMap['recommendationsIntro']}
                  target={{
                    blockId: 'recommendationsIntro',
                    label: 'مقدمة التوصيات',
                    kind: 'paragraph',
                    textValue: data.recommendationsIntro,
                    dataField: 'recommendationsIntro',
                    sectionKey: 'recommendations',
                  }}
                  className="text-[12.8px] text-[#44403C] mb-3.5"
                >
                  {data.recommendationsIntro}
                </EditableBlock>
                <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-[12.2px] leading-[1.64]">
                  {data.recommendations.map((rec, idx) => (
                    <EditableBlock
                      key={idx}
                      as="div"
                      editable={clickEditEnabled}
                      onSelect={onSelectBlock}
                      override={stylesMap[`rec-${idx}`]}
                      target={{
                        blockId: `rec-${idx}`,
                        label: `توصية #${idx + 1}`,
                        kind: 'list-item',
                        textValue: rec,
                        listKind: 'recommendations',
                        listIndex: idx,
                        listTotal: data.recommendations.length,
                      }}
                      className="flex items-start gap-2.5 border p-3"
                      style={{
                        backgroundColor: idx % 2 === 0 ? surfaceBg : paperBg,
                        borderColor: borderSubtle,
                      }}
                    >
                      <span
                        className="font-editorial font-bold tabular-nums-ar text-[13.5px] shrink-0"
                        style={{ color: theme.secondary }}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[#1C1917]">{rec}</span>
                    </EditableBlock>
                  ))}
                </div>
                  </EditableBlock>
                );
              }

              if (secKey === 'opinion' && visibility.opinion) {
                return (
                  <EditableBlock
                    key="opinion"
                    as="section"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['section-opinion']}
                    target={{
                      blockId: 'section-opinion',
                      label: 'قسم الرأي والتوصية المهنية',
                      kind: 'paragraph',
                      textValue: data.opinionParagraph1,
                      dataField: 'opinionParagraph1',
                      sectionKey: 'opinion',
                    }}
                  >
                <SectionHeading
                  index={L.s6Idx}
                  title={L.s6Title}
                  primary={theme.primary}
                  secondary={theme.secondary}
                />
                <div className="space-y-3 text-[12.8px] leading-[1.78] text-[#292524] text-justify">
                  <EditableBlock
                    as="p"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['opinionParagraph1']}
                    target={{
                      blockId: 'opinionParagraph1',
                      label: 'الرأي المهني — الفقرة 1',
                      kind: 'paragraph',
                      textValue: data.opinionParagraph1,
                      dataField: 'opinionParagraph1',
                      sectionKey: 'opinion',
                    }}
                  >
                    {data.opinionParagraph1}
                  </EditableBlock>
                  <EditableBlock
                    as="p"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['opinionParagraph2']}
                    target={{
                      blockId: 'opinionParagraph2',
                      label: 'الرأي المهني — الفقرة 2',
                      kind: 'paragraph',
                      textValue: data.opinionParagraph2,
                      dataField: 'opinionParagraph2',
                      sectionKey: 'opinion',
                    }}
                  >
                    {data.opinionParagraph2}
                  </EditableBlock>
                  <EditableBlock
                    as="p"
                    editable={clickEditEnabled}
                    onSelect={onSelectBlock}
                    override={stylesMap['opinionParagraph3']}
                    target={{
                      blockId: 'opinionParagraph3',
                      label: 'الرأي المهني — الفقرة 3',
                      kind: 'paragraph',
                      textValue: data.opinionParagraph3,
                      dataField: 'opinionParagraph3',
                      sectionKey: 'opinion',
                    }}
                  >
                    {data.opinionParagraph3}
                  </EditableBlock>
                </div>

                <EditableBlock
                  as="div"
                  editable={clickEditEnabled}
                  onSelect={onSelectBlock}
                  override={stylesMap['coreGoalQuote']}
                  target={{
                    blockId: 'coreGoalQuote',
                    label: 'الهدف التربوي الأساسي',
                    kind: 'quote',
                    textValue: data.coreGoalQuote,
                    dataField: 'coreGoalQuote',
                  }}
                  className="mt-5 border-y py-4 px-6 text-center"
                  style={{
                    backgroundColor: surfaceBg,
                    borderColor: `${theme.secondary}66`,
                  }}
                >
                  <p
                    className="font-editorial text-[15.5px] font-bold leading-relaxed"
                    style={{ color: theme.primary }}
                  >
                    «{data.coreGoalQuote}»
                  </p>
                </EditableBlock>

                <EditableBlock
                  as="p"
                  editable={clickEditEnabled}
                  onSelect={onSelectBlock}
                  override={stylesMap['closingSalutation']}
                  target={{
                    blockId: 'closingSalutation',
                    label: 'عبارة الختام',
                    kind: 'paragraph',
                    textValue: data.closingSalutation,
                    dataField: 'closingSalutation',
                  }}
                  className="mt-5 text-[13px] font-semibold text-[#1C1917]"
                >
                  {data.closingSalutation}
                </EditableBlock>
                  </EditableBlock>
                );
              }

              return null;
            })}

            {extras && (
              <ReportExtrasRenderer
                extras={extras}
                primaryColor={theme.primary}
                secondaryColor={theme.secondary}
                surfaceBg={surfaceBg}
                borderColor={borderSubtle}
                isRtl={isRtl}
                clickEditEnabled={clickEditEnabled}
                onSelectBlock={onSelectBlock}
              />
            )}
          </div>

          <div className="relative z-10 flex flex-col gap-4">
            <section
              className="border p-5"
              style={{ backgroundColor: surfaceBg, borderColor: borderSubtle }}
            >
              <div className="flex items-center justify-between gap-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[12px] flex-1">
                  <div>
                    <div className="text-[11px] text-[#78716C]">{L.prep}</div>
                    <div className="font-bold text-[#1C1917] mt-0.5">{data.preparedBy}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#78716C]">{L.role}</div>
                    <div className="font-bold text-[#1C1917] mt-0.5">{data.professionalTitle}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#78716C]">{L.center}</div>
                    <div className="font-semibold text-[#1C1917] mt-0.5">{data.signCenterName}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#78716C]">
                      {L.date} · {L.phone}
                    </div>
                    <div className="font-semibold text-[#1C1917] tabular-nums-ar mt-0.5">
                      {data.signDate} ·{' '}
                      <span dir="ltr" className="inline-block">
                        {data.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <div className="text-[11px] text-[#78716C] mb-1.5">{L.sign}</div>
                    {showStamp ? (
                      <SignatureFlourish color={theme.primary} />
                    ) : (
                      <div className="h-[36px] w-[110px] border-b border-dotted border-[#78716C]" />
                    )}
                  </div>
                  <div className="text-center min-w-[136px]">
                    {showStamp ? (
                      <CenterOfficialStamp
                        centerName={data.centerName}
                        city={data.centerCity}
                        directorName={data.directorName}
                        directorRole={data.directorRole}
                        phone={data.phone}
                        color={theme.primary}
                      />
                    ) : (
                      <div>
                        <div className="text-[11px] text-[#78716C] mb-1.5">{L.stampBox}</div>
                        <div className="h-[72px] w-[124px] border border-dashed border-[#A8A29E] flex items-center justify-center text-[11px] text-[#A8A29E]">
                          {L.stampPlace}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <footer
              className="flex items-center justify-between border-t pt-2.5 text-[10.5px] text-[#78716C]"
              style={{ borderColor: `${theme.primary}26` }}
            >
              <span>
                {data.centerName}
                {L.centerHeaderSuffix} · {L.docBadgeShort}
              </span>
              <span className="font-semibold" style={{ color: theme.primary }}>
                {L.page2Foot}
              </span>
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
};
