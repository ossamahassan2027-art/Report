import {
  DEFAULT_REPORT_DATA,
  DEFAULT_ENGLISH_REPORT_DATA,
  DEFAULT_SECTION_VISIBILITY,
  ItemSelections,
  ReportData,
  ReportLanguage,
  SectionVisibility,
  createFullSelections,
} from '../types/report';
import {
  AddonsSettings,
  AutoFormatSettings,
  ChangeLogEntry,
  ContactSettings,
  DEFAULT_ADDONS_SETTINGS,
  DEFAULT_AUTO_FORMAT_SETTINGS,
  DEFAULT_CONTACT_SETTINGS,
  DEFAULT_REPORT_EXTRAS,
  DEFAULT_STUDIO_PREFS,
  DEFAULT_THEME_SETTINGS,
  LIGHT_THEMES,
  LightThemeId,
  ReportExtras,
  SavedReportRecord,
  SmartAddDraftItem,
  StudioNavigationPrefs,
  ThemeSettings,
} from '../types/studio';
import { SavedCvRecord } from '../types/cv';

const LS_THEME_KEY = 'cc_center_theme_settings_v1';
const LS_REPORTS_KEY = 'cc_center_saved_reports_v1';
const LS_CONTACT_KEY = 'cc_center_contact_settings_v1';
const LS_ADDONS_KEY = 'cc_center_addons_settings_v1';
const LS_NAV_PREFS_KEY = 'cc_center_nav_prefs_v1';
const LS_SAVED_CVS_KEY = 'cc_center_saved_cvs_v1';
const LS_CHANGELOG_KEY = 'cc_center_changelog_v1';
const LS_ACCOUNT_KEY = 'cc_center_account_security_v1';
const LS_AUTO_FORMAT_KEY = 'shamel_auto_format_settings_v1';
const LS_SMART_ADD_DRAFTS_KEY = 'shamel_smart_add_drafts_v1';

export interface AccountSecurityConfig {
  passcode: string;
  locked: boolean;
}

export function loadThemeSettings(): ThemeSettings {
  try {
    const raw = localStorage.getItem(LS_THEME_KEY);
    if (!raw) return DEFAULT_THEME_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      screenTheme:
        parsed.screenTheme && LIGHT_THEMES[parsed.screenTheme as LightThemeId]
          ? parsed.screenTheme
          : DEFAULT_THEME_SETTINGS.screenTheme,
      printTheme:
        parsed.printTheme && LIGHT_THEMES[parsed.printTheme as LightThemeId]
          ? parsed.printTheme
          : DEFAULT_THEME_SETTINGS.printTheme,
      fontSize: parsed.fontSize || DEFAULT_THEME_SETTINGS.fontSize,
      buttonShape: parsed.buttonShape || DEFAULT_THEME_SETTINGS.buttonShape,
      density: parsed.density || DEFAULT_THEME_SETTINGS.density,
    };
  } catch {
    return DEFAULT_THEME_SETTINGS;
  }
}

export function saveThemeSettings(settings: ThemeSettings): void {
  localStorage.setItem(LS_THEME_KEY, JSON.stringify(settings));
}

export function loadContactSettings(): ContactSettings {
  try {
    const raw = localStorage.getItem(LS_CONTACT_KEY);
    if (!raw) return DEFAULT_CONTACT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      phone: parsed.phone ?? DEFAULT_CONTACT_SETTINGS.phone,
      website: parsed.website ?? DEFAULT_CONTACT_SETTINGS.website,
      whatsapp: parsed.whatsapp ?? DEFAULT_CONTACT_SETTINGS.whatsapp,
      youtube: parsed.youtube ?? DEFAULT_CONTACT_SETTINGS.youtube,
      facebook: parsed.facebook ?? DEFAULT_CONTACT_SETTINGS.facebook,
      instagram: parsed.instagram ?? DEFAULT_CONTACT_SETTINGS.instagram,
    };
  } catch {
    return DEFAULT_CONTACT_SETTINGS;
  }
}

export function saveContactSettings(settings: ContactSettings): void {
  localStorage.setItem(LS_CONTACT_KEY, JSON.stringify(settings));
}

export function loadChangeLog(): ChangeLogEntry[] {
  try {
    const raw = localStorage.getItem(LS_CHANGELOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistChangeLog(entries: ChangeLogEntry[]): void {
  localStorage.setItem(LS_CHANGELOG_KEY, JSON.stringify(entries.slice(0, 120)));
}

export function loadAccountSecurity(): AccountSecurityConfig {
  try {
    const raw = localStorage.getItem(LS_ACCOUNT_KEY);
    if (!raw) return { passcode: '', locked: false };
    const parsed = JSON.parse(raw);
    return {
      passcode: typeof parsed.passcode === 'string' ? parsed.passcode : '',
      locked: Boolean(parsed.locked) && Boolean(parsed.passcode),
    };
  } catch {
    return { passcode: '', locked: false };
  }
}

export function saveAccountSecurity(cfg: AccountSecurityConfig): void {
  localStorage.setItem(LS_ACCOUNT_KEY, JSON.stringify(cfg));
}

export function loadAddonsSettings(): AddonsSettings {
  try {
    const raw = localStorage.getItem(LS_ADDONS_KEY);
    if (!raw) return DEFAULT_ADDONS_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      visibleIds: Array.isArray(parsed.visibleIds)
        ? parsed.visibleIds
        : DEFAULT_ADDONS_SETTINGS.visibleIds,
    };
  } catch {
    return DEFAULT_ADDONS_SETTINGS;
  }
}

export function saveAddonsSettings(settings: AddonsSettings): void {
  localStorage.setItem(LS_ADDONS_KEY, JSON.stringify(settings));
}

export function loadStudioPrefs(): StudioNavigationPrefs {
  try {
    const raw = localStorage.getItem(LS_NAV_PREFS_KEY);
    if (!raw) return DEFAULT_STUDIO_PREFS;
    const parsed = JSON.parse(raw);
    return {
      activeSection: parsed.activeSection || DEFAULT_STUDIO_PREFS.activeSection,
      sectionTabs: parsed.sectionTabs && typeof parsed.sectionTabs === 'object' ? parsed.sectionTabs : {},
    };
  } catch {
    return DEFAULT_STUDIO_PREFS;
  }
}

export function saveStudioPrefs(prefs: StudioNavigationPrefs): void {
  localStorage.setItem(LS_NAV_PREFS_KEY, JSON.stringify(prefs));
}

export function loadSavedReports(): SavedReportRecord[] {
  try {
    const raw = localStorage.getItem(LS_REPORTS_KEY);
    if (!raw) {
      // Seed with the original default report record without deleting anything
      const initialRecord: SavedReportRecord = {
        id: 'default-adnan-report',
        name: `تقرير ${DEFAULT_REPORT_DATA.childName} (التقرير الأساسي)`,
        isDraft: false,
        updatedAt: DEFAULT_REPORT_DATA.reportDate,
        language: 'ar',
        arData: DEFAULT_REPORT_DATA,
        enData: DEFAULT_ENGLISH_REPORT_DATA,
        visibility: DEFAULT_SECTION_VISIBILITY,
        selections: createFullSelections(DEFAULT_REPORT_DATA),
        extras: DEFAULT_REPORT_EXTRAS,
      };
      localStorage.setItem(LS_REPORTS_KEY, JSON.stringify([initialRecord]));
      return [initialRecord];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedReports(records: SavedReportRecord[]): void {
  localStorage.setItem(LS_REPORTS_KEY, JSON.stringify(records));
}

export function loadSavedCvs(): SavedCvRecord[] {
  try {
    const raw = localStorage.getItem(LS_SAVED_CVS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedCvs(records: SavedCvRecord[]): void {
  localStorage.setItem(LS_SAVED_CVS_KEY, JSON.stringify(records));
}

function triggerDownloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportReportToHtml(
  data: ReportData,
  extras: ReportExtras,
  visibility: SectionVisibility,
  language: ReportLanguage,
  filenameBase: string
): void {
  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';
  const safeName = filenameBase.trim() || `تقرير-${data.childName}`;

  const html = `<!doctype html>
<html lang="${language}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(data.reportTitle)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: Tahoma, Arial, sans-serif; color: #1C1917; background: #FFFFFF; margin: 0; padding: 24px; line-height: 1.65; }
    .container { max-width: 794px; margin: 0 auto; border: 1px solid #D4D4D8; padding: 28px; background: #FFFFFF; }
    h1, h2, h3 { color: #1E3A8A; margin-top: 18px; margin-bottom: 8px; }
    h1 { font-size: 22px; text-align: center; }
    h2 { font-size: 16px; border-bottom: 1px solid #CBD5E1; padding-bottom: 4px; }
    .meta { display: flex; justify-content: space-between; border-bottom: 2px solid #1E3A8A; padding-bottom: 10px; margin-bottom: 14px; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; border: 1px solid #E4E4E7; padding: 10px; margin-bottom: 14px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
    th, td { border: 1px solid #D4D4D8; padding: 6px 10px; text-align: ${isRtl ? 'right' : 'left'}; }
    th { background: #F8FAFC; }
    .quote { border-top: 1px solid #8C6D3F; border-bottom: 1px solid #8C6D3F; padding: 10px; text-align: center; font-weight: bold; margin: 14px 0; background: #FAF8F5; }
    @media print { body { padding: 0; background: #FFFFFF !important; } .container { border: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="meta">
      <div><strong>${escapeHtml(data.centerName)} - ${escapeHtml(data.centerCity)}</strong><br/>${escapeHtml(data.preparedBy)} (${escapeHtml(data.directorRole)})</div>
      <div>${escapeHtml(data.referenceNumber)}<br/>${escapeHtml(data.reportDate)} · ${escapeHtml(data.phone)}</div>
    </div>
    <p><strong>${isRtl ? 'موجه إلى' : 'Addressed To'}:</strong> ${escapeHtml(data.schoolAddressee)}</p>
    <h1>${escapeHtml(data.reportTitle)}</h1>
    <p style="text-align:center;color:#57534E;">${escapeHtml(data.reportSubtitle)}</p>

    ${visibility.personal ? `
    <h2>${isRtl ? 'أولاً: البيانات الشخصية' : 'I. Personal Information'}</h2>
    <div class="grid">
      <div><strong>${isRtl ? 'الاسم' : 'Name'}:</strong> ${escapeHtml(data.childName)}</div>
      <div><strong>${isRtl ? 'تاريخ الميلاد' : 'DOB'}:</strong> ${escapeHtml(data.birthDate)}</div>
      <div><strong>${isRtl ? 'العمر' : 'Age'}:</strong> ${escapeHtml(data.age)}</div>
      <div><strong>${isRtl ? 'التشخيص' : 'Diagnosis'}:</strong> ${escapeHtml(data.diagnosis)}</div>
    </div>` : ''}

    ${extras.extrasVisibility.summary && extras.summaryText ? `
    <h2>${isRtl ? 'ملخص التقرير' : 'Executive Summary'}</h2>
    <p>${escapeHtml(extras.summaryText)}</p>` : ''}

    ${extras.extrasVisibility.summary && extras.quickSummaryLines.length > 0 ? `
    <h2>${isRtl ? 'ملخص سريع (5 سطور)' : 'Quick 5-Line Summary'}</h2>
    <ul>${extras.quickSummaryLines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>` : ''}

    ${visibility.background ? `
    <h2>${isRtl ? 'ثانياً: الخلفية النمائية والسلوكية' : 'II. Developmental & Behavioral Background'}</h2>
    <p>${escapeHtml(data.backgroundParagraph1)}</p>
    <p>${escapeHtml(data.backgroundParagraph2)}</p>` : ''}

    ${visibility.environment ? `
    <h2>${isRtl ? 'ثالثاً: تأثير البيئة المحيطة على كفاءة التعلم' : 'III. Environmental Impact'}</h2>
    <p>${escapeHtml(data.envIntro)}</p>
    <p><strong>${isRtl ? 'البيئة الهادئة والمنظمة' : 'Calm Environment'}:</strong> ${escapeHtml(data.envPositive)}</p>
    <p><strong>${escapeHtml(data.envNegativeIntro)}</strong></p>
    <ul>${data.envNegativePoints.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>` : ''}

    ${visibility.homeSchool ? `
    <h2>${isRtl ? 'رابعاً: أهمية التعليم في بيئة منزلية منظمة' : 'IV. Structured Home Schooling'}</h2>
    <p>${escapeHtml(data.homeSchoolIntro)}</p>
    <ul>${data.homeSchoolBenefits.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}

    ${visibility.recommendations ? `
    <h2>${isRtl ? 'خامساً: التوصيات التعليمية' : 'V. Educational Recommendations'}</h2>
    <p>${escapeHtml(data.recommendationsIntro)}</p>
    <ol>${data.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ol>` : ''}

    ${extras.extrasVisibility.behaviorTechniques && extras.selectedBehaviorTechniques.length > 0 ? `
    <h2>${isRtl ? 'فنيات تعديل السلوك المختارة' : 'Behavior Modification Techniques'}</h2>
    <p>${escapeHtml(extras.selectedBehaviorTechniques.join(' · '))}</p>` : ''}

    ${extras.extrasVisibility.plan && extras.planGoals.length > 0 ? `
    <h2>${isRtl ? 'خطة الأهداف والمتابعة' : 'Plan & Goals'}</h2>
    <table>
      <thead><tr><th>${isRtl ? 'الهدف' : 'Goal'}</th><th>${isRtl ? 'المدة' : 'Duration'}</th><th>${isRtl ? 'المسؤول' : 'Owner'}</th><th>${isRtl ? 'التقدم' : 'Progress'}</th></tr></thead>
      <tbody>${extras.planGoals.map((g) => `<tr><td>${escapeHtml(g.goal)}</td><td>${escapeHtml(g.targetDuration)}</td><td>${escapeHtml(g.owner)}</td><td>${escapeHtml(g.progress)}</td></tr>`).join('')}</tbody>
    </table>` : ''}

    ${extras.extrasVisibility.evaluations && extras.selectedEvaluationForms.length > 0 ? `
    <h2>${isRtl ? 'استمارات التقييم المرفقة' : 'Attached Evaluation Forms'}</h2>
    ${extras.selectedEvaluationForms.map((f) => `<h3>${escapeHtml(f.title)}</h3><table><tbody>${f.fields.map((fld) => `<tr><th>${escapeHtml(fld.label)}</th><td>${escapeHtml(fld.value)}</td></tr>`).join('')}</tbody></table>`).join('')}` : ''}

    ${extras.extrasVisibility.tables && extras.tables.length > 0 ? `
    ${extras.tables.map((tbl) => `<h2>${escapeHtml(tbl.title)}</h2><table><thead><tr>${tbl.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${tbl.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`).join('')}` : ''}

    ${visibility.opinion ? `
    <h2>${isRtl ? 'سادساً: الرأي والتوصية المهنية' : 'VI. Professional Opinion'}</h2>
    <p>${escapeHtml(data.opinionParagraph1)}</p>
    <p>${escapeHtml(data.opinionParagraph2)}</p>
    <p>${escapeHtml(data.opinionParagraph3)}</p>
    <div class="quote">${escapeHtml(data.coreGoalQuote)}</div>` : ''}

    <p><strong>${escapeHtml(data.closingSalutation)}</strong></p>
    <p>${escapeHtml(data.preparedBy)} — ${escapeHtml(data.professionalTitle)} · ${escapeHtml(data.signCenterName)} · ${escapeHtml(data.signDate)} · ${escapeHtml(data.phone)}</p>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  triggerDownloadBlob(blob, `${safeName}.html`);
}

export interface ReportBackupPayload {
  version: number;
  exportedAt: string;
  name: string;
  language: ReportLanguage;
  arData: ReportData;
  enData: ReportData | null;
  visibility: SectionVisibility;
  selections: ItemSelections;
  extras: ReportExtras;
}

export function exportReportToJson(
  payload: Omit<ReportBackupPayload, 'version' | 'exportedAt'>,
  filenameBase: string
): void {
  const full: ReportBackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...payload,
  };
  const blob = new Blob([JSON.stringify(full, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const safeName = filenameBase.trim() || `نسخة-${payload.arData.childName}`;
  triggerDownloadBlob(blob, `${safeName}.json`);
}

export function parseImportedBackupJson(rawText: string): ReportBackupPayload {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== 'object' || !parsed.arData) {
    throw new Error('صيغة الملف غير صالحة. يرجى اختيار ملف JSON مصدر من البرنامج.');
  }
  return {
    version: Number(parsed.version) || 1,
    exportedAt: String(parsed.exportedAt || new Date().toISOString()),
    name: String(parsed.name || parsed.arData.reportTitle || 'تقرير مستورد'),
    language: parsed.language === 'en' ? 'en' : 'ar',
    arData: { ...DEFAULT_REPORT_DATA, ...parsed.arData },
    enData: parsed.enData ? { ...DEFAULT_ENGLISH_REPORT_DATA, ...parsed.enData } : null,
    visibility: { ...DEFAULT_SECTION_VISIBILITY, ...(parsed.visibility || {}) },
    selections: parsed.selections || createFullSelections(parsed.arData),
    extras: { ...DEFAULT_REPORT_EXTRAS, ...(parsed.extras || {}) },
  };
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function loadAutoFormatSettings(): AutoFormatSettings {
  try {
    const raw = localStorage.getItem(LS_AUTO_FORMAT_KEY);
    if (!raw) return DEFAULT_AUTO_FORMAT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      spellCheck: typeof parsed.spellCheck === 'boolean' ? parsed.spellCheck : true,
      unifyFonts: typeof parsed.unifyFonts === 'boolean' ? parsed.unifyFonts : true,
      unifyDates: typeof parsed.unifyDates === 'boolean' ? parsed.unifyDates : true,
      fixTables: typeof parsed.fixTables === 'boolean' ? parsed.fixTables : true,
      atsCvCheck: typeof parsed.atsCvCheck === 'boolean' ? parsed.atsCvCheck : true,
      backupBeforeFormat:
        typeof parsed.backupBeforeFormat === 'boolean' ? parsed.backupBeforeFormat : true,
      formatOnExport: typeof parsed.formatOnExport === 'boolean' ? parsed.formatOnExport : false,
    };
  } catch {
    return DEFAULT_AUTO_FORMAT_SETTINGS;
  }
}

export function saveAutoFormatSettings(settings: AutoFormatSettings): void {
  localStorage.setItem(LS_AUTO_FORMAT_KEY, JSON.stringify(settings));
}

export function loadSmartAddDrafts(): SmartAddDraftItem[] {
  try {
    const raw = localStorage.getItem(LS_SMART_ADD_DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSmartAddDrafts(drafts: SmartAddDraftItem[]): void {
  localStorage.setItem(LS_SMART_ADD_DRAFTS_KEY, JSON.stringify(drafts.slice(0, 40)));
}

