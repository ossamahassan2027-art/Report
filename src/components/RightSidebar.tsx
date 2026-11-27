import React, { useMemo, useState } from 'react';
import {
  Archive,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileCheck2,
  FilePlus2,
  FileSpreadsheet,
  FolderOpen,
  History,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  ListChecks,
  LogOut,
  Menu,
  Paperclip,
  PieChart,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  LightThemeDefinition,
  SidebarSectionId,
  SmartAddKind,
} from '../types/studio';
import { CvMenuActionId } from './CvAtsStudio';
import { UtilityModalType } from './StudioUtilityModals';

interface RightSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  activeSection: SidebarSectionId;
  activeTab?: string;
  onSelectSection: (id: SidebarSectionId, targetTab?: string) => void;
  onTriggerCvMenuAction?: (action: CvMenuActionId) => void;
  onOpenNewReport: () => void;
  onOpenParentReport?: () => void;
  libraryCardsCount?: number;
  onOpenSmartAdd?: (kind: SmartAddKind) => void;
  onFocusFollowUp: () => void;
  onOpenUtilityModal: (modal: UtilityModalType) => void;
  showAddonsButton: boolean;
  onOpenAddons: () => void;
  centerName: string;
  specialistName: string;
  specialistRole: string;
  theme: LightThemeDefinition;
  buttonRadiusClass: string;
}

interface SidebarItemDef {
  id: SidebarSectionId;
  label: string;
  shortcut: string;
  group: 'reports' | 'assessment' | 'studio';
  icon: React.ComponentType<{ className?: string }>;
  tabs: { id: string; label: string }[];
}

export const SIDEBAR_ITEMS: SidebarItemDef[] = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    shortcut: '1',
    group: 'reports',
    icon: LayoutDashboard,
    tabs: [
      { id: 'new', label: 'تقرير جديد' },
      { id: 'all', label: 'كل الحالات' },
      { id: 'drafts', label: 'أرشيف الحالات' },
      { id: 'tasks', label: 'جدول مهام أسبوعي' },
    ],
  },
  {
    id: 'library',
    label: 'مكتبتي الذكية',
    shortcut: 'L',
    group: 'reports',
    icon: BookOpen,
    tabs: [
      { id: 'cards', label: 'البطاقات الذكية' },
      { id: 'folders', label: 'ملفات التخصص (8)' },
      { id: 'assistant', label: 'المساعد الآلي' },
      { id: 'extractor', label: 'تفريغ المرفقات' },
      { id: 'compare', label: 'مقارنة بطاقتين' },
    ],
  },
  {
    id: 'summary',
    label: 'ملخص تقرير',
    shortcut: '2',
    group: 'reports',
    icon: Sparkles,
    tabs: [
      { id: 'create', label: 'إنشاء ملخص' },
      { id: 'five-lines', label: 'ملخص سريع 5 سطور' },
    ],
  },
  {
    id: 'cv',
    label: 'توليد CV',
    shortcut: '0',
    group: 'reports',
    icon: FileCheck2,
    tabs: [
      { id: 'new-cv', label: 'CV جديد' },
      { id: 'import-old', label: 'استيراد CV' },
      { id: 'templates', label: 'قوالب CV' },
      { id: 'saved', label: 'سيرتي المحفوظة' },
      { id: 'export-pdf', label: 'تصدير PDF' },
      { id: 'target-sector', label: 'الجهة والمجال' },
      { id: 'job-ad', label: 'إرفاق إعلان' },
    ],
  },
  {
    id: 'certificates',
    label: 'الشهادات والإفادات',
    shortcut: 'C',
    group: 'reports',
    icon: Award,
    tabs: [{ id: 'main', label: 'استوديو الشهادات والإفادات' }],
  },
  {
    id: 'evaluations',
    label: 'التقييم',
    shortcut: '7',
    group: 'assessment',
    icon: ClipboardCheck,
    tabs: [
      { id: 'comprehensive', label: 'استمارة تقييم شامل' },
      { id: 'specialty', label: 'استمارات حسب التخصص' },
      { id: 'infographic', label: 'انفو جراف خطة العمل' },
    ],
  },
  {
    id: 'plan',
    label: 'توليد خطة',
    shortcut: '3',
    group: 'assessment',
    icon: Target,
    tabs: [
      { id: 'create', label: 'إنشاء خطة' },
      { id: 'table', label: 'جدول الأهداف' },
      { id: 'progress', label: 'متابعة التقدم' },
    ],
  },
  {
    id: 'recommendations',
    label: 'توليد توصيات',
    shortcut: '6',
    group: 'assessment',
    icon: ListChecks,
    tabs: [
      { id: 'school', label: 'للمدرسة' },
      { id: 'home', label: 'للمنزل' },
      { id: 'specialist', label: 'للأخصائي' },
    ],
  },
  {
    id: 'charts',
    label: 'رسوم وجداول',
    shortcut: '4',
    group: 'studio',
    icon: BarChart3,
    tabs: [
      { id: 'chart', label: 'رسم بياني' },
      { id: 'table', label: 'جدول' },
      { id: 'before-after', label: 'مقارنة قبل / بعد' },
    ],
  },
  {
    id: 'templates',
    label: 'قوالب التقارير',
    shortcut: '5',
    group: 'studio',
    icon: LayoutTemplate,
    tabs: [
      { id: 'content', label: 'قوالب المحتوى' },
      { id: 'layouts', label: 'أنماط العرض' },
      { id: 'shortcuts', label: 'اختصارات ذكية' },
    ],
  },
  {
    id: 'recipients',
    label: 'الجهة الموجه إليها',
    shortcut: '8',
    group: 'studio',
    icon: Users,
    tabs: [{ id: 'main', label: 'الجهات والنسخ الموجهة' }],
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    shortcut: '9',
    group: 'studio',
    icon: Settings,
    tabs: [
      { id: 'center', label: 'إعدادات المركز' },
      { id: 'themes', label: 'الثيمات' },
      { id: 'addons', label: 'زر الإضافات' },
      { id: 'signature', label: 'التوقيع والختم' },
      { id: 'format', label: 'إعدادات التنسيق الآلي' },
    ],
  },
];

interface NavGroupEntry {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  sectionId?: SidebarSectionId;
  tabId?: string;
  cvAction?: CvMenuActionId;
  actionType?: 'new-report' | 'parent-report' | 'focus-followup' | 'utility-modal';
  utilityModal?: UtilityModalType;
  danger?: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  titleColor: string;
  items: NavGroupEntry[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'main',
    title: 'MAIN',
    titleColor: '#94A3B8',
    items: [
      {
        key: 'main-dashboard',
        label: 'لوحة التحكم',
        icon: LayoutDashboard,
        sectionId: 'dashboard',
        tabId: 'all',
      },
      {
        key: 'main-library',
        label: '📚 مكتبتي',
        icon: BookOpen,
        sectionId: 'library',
        tabId: 'cards',
      },
      {
        key: 'main-summary',
        label: 'ملخص تقرير',
        icon: Sparkles,
        sectionId: 'summary',
        tabId: 'create',
      },
    ],
  },
  {
    id: 'cases',
    title: 'الحالات',
    titleColor: '#60A5FA',
    items: [
      {
        key: 'cases-new',
        label: 'حالة جديدة',
        icon: UserPlus,
        actionType: 'new-report',
      },
      {
        key: 'cases-all',
        label: 'كل الحالات',
        icon: FolderOpen,
        sectionId: 'dashboard',
        tabId: 'all',
      },
      {
        key: 'cases-archive',
        label: 'أرشيف الحالات',
        icon: Archive,
        sectionId: 'dashboard',
        tabId: 'drafts',
      },
    ],
  },
  {
    id: 'evaluation',
    title: 'التقييم',
    titleColor: '#34D399',
    items: [
      {
        key: 'eval-comprehensive',
        label: 'استمارة تقييم شامل',
        icon: ClipboardCheck,
        sectionId: 'evaluations',
        tabId: 'comprehensive',
      },
      {
        key: 'eval-specialty',
        label: 'استمارات حسب التخصص',
        icon: Award,
        sectionId: 'evaluations',
        tabId: 'specialty',
      },
      {
        key: 'eval-infographic',
        label: 'انفو جراف خطة العمل',
        icon: PieChart,
        sectionId: 'evaluations',
        tabId: 'infographic',
      },
    ],
  },
  {
    id: 'reports',
    title: 'التقارير',
    titleColor: '#93C5FD',
    items: [
      {
        key: 'rep-new',
        label: 'تقرير جديد',
        icon: FilePlus2,
        sectionId: 'dashboard',
        tabId: 'new',
      },
      {
        key: 'rep-parent-15',
        label: 'تقرير ولي أمر (15 قسم)',
        icon: ShieldCheck,
        actionType: 'parent-report',
      },
      {
        key: 'rep-templates',
        label: 'قوالب التقارير',
        icon: LayoutTemplate,
        sectionId: 'templates',
        tabId: 'content',
      },
      {
        key: 'rep-plan',
        label: 'توليد خطة',
        icon: Target,
        sectionId: 'plan',
        tabId: 'create',
      },
      {
        key: 'rep-recs',
        label: 'توليد توصيات',
        icon: ListChecks,
        sectionId: 'recommendations',
        tabId: 'school',
      },
      {
        key: 'rep-charts',
        label: 'رسوم وجداول',
        icon: BarChart3,
        sectionId: 'charts',
        tabId: 'chart',
      },
      {
        key: 'rep-recipients',
        label: 'الجهة الموجه إليها',
        icon: Users,
        sectionId: 'recipients',
        tabId: 'main',
      },
      {
        key: 'rep-certificates',
        label: '🏆 الشهادات والإفادات',
        icon: Award,
        sectionId: 'certificates',
        tabId: 'main',
      },
    ],
  },
  {
    id: 'followup',
    title: 'المتابعة',
    titleColor: '#FBBF24',
    items: [
      {
        key: 'follow-tasks',
        label: 'جدول مهام أسبوعي',
        icon: FileSpreadsheet,
        sectionId: 'dashboard',
        tabId: 'tasks',
      },
      {
        key: 'follow-date',
        label: 'موعد متابعة',
        icon: CalendarClock,
        actionType: 'focus-followup',
      },
      {
        key: 'follow-changelog',
        label: 'سجل التعديلات',
        icon: History,
        actionType: 'utility-modal',
        utilityModal: 'change-log',
      },
    ],
  },
  {
    id: 'cv',
    title: 'CV',
    titleColor: '#38BDF8',
    items: [
      {
        key: 'cv-generate',
        label: 'توليد CV',
        icon: FileCheck2,
        sectionId: 'cv',
        tabId: 'new-cv',
      },
      {
        key: 'cv-import',
        label: 'استيراد CV',
        icon: Upload,
        sectionId: 'cv',
        tabId: 'new-cv',
        cvAction: 'import-cv',
      },
      {
        key: 'cv-job-ad',
        label: 'إرفاق إعلان',
        icon: Paperclip,
        sectionId: 'cv',
        tabId: 'job-ad',
      },
      {
        key: 'cv-ats-check',
        label: 'فحص ATS',
        icon: Briefcase,
        sectionId: 'cv',
        tabId: 'new-cv',
        cvAction: 'ats-check',
      },
    ],
  },
  {
    id: 'communication',
    title: 'التواصل',
    titleColor: '#A78BFA',
    items: [
      {
        key: 'comm-schedule',
        label: 'إرسال جدول للحالة',
        icon: Send,
        actionType: 'utility-modal',
        utilityModal: 'comm-schedule',
      },
      {
        key: 'comm-reminder',
        label: 'إرسال تذكير',
        icon: CalendarClock,
        actionType: 'utility-modal',
        utilityModal: 'comm-reminder',
      },
      {
        key: 'comm-alerts',
        label: 'تنبيهات',
        icon: Bell,
        actionType: 'utility-modal',
        utilityModal: 'comm-alerts',
      },
    ],
  },
  {
    id: 'admin',
    title: 'ADMIN',
    titleColor: '#94A3B8',
    items: [
      {
        key: 'admin-center',
        label: 'إعدادات المركز',
        icon: Building2,
        sectionId: 'settings',
        tabId: 'center',
      },
      {
        key: 'admin-settings',
        label: 'الإعدادات',
        icon: SlidersHorizontal,
        sectionId: 'settings',
        tabId: 'themes',
      },
      {
        key: 'admin-addons',
        label: 'زر الإضافات',
        icon: Plus,
        sectionId: 'settings',
        tabId: 'addons',
      },
      {
        key: 'admin-format',
        label: 'إعدادات التنسيق الآلي',
        icon: Sparkles,
        sectionId: 'settings',
        tabId: 'format',
      },
    ],
  },
  {
    id: 'account',
    title: 'ACCOUNT',
    titleColor: '#94A3B8',
    items: [
      {
        key: 'acc-password',
        label: 'تغيير كلمة المرور',
        icon: KeyRound,
        actionType: 'utility-modal',
        utilityModal: 'account-password',
      },
      {
        key: 'acc-logout',
        label: 'تسجيل خروج',
        icon: LogOut,
        actionType: 'utility-modal',
        utilityModal: 'account-logout',
        danger: true,
      },
    ],
  },
];

export const RightSidebar: React.FC<RightSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  activeSection,
  activeTab,
  onSelectSection,
  onTriggerCvMenuAction,
  onOpenNewReport,
  onOpenParentReport,
  libraryCardsCount,
  onOpenSmartAdd,
  onFocusFollowUp,
  onOpenUtilityModal,
  showAddonsButton,
  onOpenAddons,
  centerName,
  specialistName,
  specialistRole,
  buttonRadiusClass,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNavKey, setSelectedNavKey] = useState<string>('main-dashboard');

  const resolvedActiveKey = useMemo(() => {
    // Prefer exact selectedNavKey if it still aligns with activeSection
    for (const grp of NAV_GROUPS) {
      const matchSelected = grp.items.find((it) => it.key === selectedNavKey);
      if (matchSelected && matchSelected.sectionId === activeSection) {
        if (!matchSelected.tabId || !activeTab || matchSelected.tabId === activeTab) {
          return matchSelected.key;
        }
      }
    }
    // Otherwise derive from section + tab
    for (const grp of NAV_GROUPS) {
      for (const it of grp.items) {
        if (it.sectionId === activeSection && it.tabId && it.tabId === activeTab) {
          return it.key;
        }
      }
    }
    for (const grp of NAV_GROUPS) {
      for (const it of grp.items) {
        if (it.sectionId === activeSection) return it.key;
      }
    }
    return selectedNavKey;
  }, [activeSection, activeTab, selectedNavKey]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: { groupTitle: string; entry: NavGroupEntry }[] = [];
    NAV_GROUPS.forEach((grp) => {
      grp.items.forEach((entry) => {
        if (
          entry.label.toLowerCase().includes(q) ||
          grp.title.toLowerCase().includes(q)
        ) {
          results.push({ groupTitle: grp.title, entry });
        }
      });
    });
    return results.slice(0, 12);
  }, [searchQuery]);

  const handleEntryClick = (entry: NavGroupEntry) => {
    setSelectedNavKey(entry.key);
    onCloseMobile?.();
    if (entry.key === 'cases-new') {
      if (onOpenSmartAdd) {
        onOpenSmartAdd('case');
      } else {
        onOpenNewReport();
      }
      return;
    }
    if (entry.key === 'rep-new' && onOpenSmartAdd) {
      onOpenSmartAdd('report');
      return;
    }
    if (entry.actionType === 'new-report') {
      onOpenNewReport();
      return;
    }
    if (entry.actionType === 'parent-report') {
      onOpenParentReport?.();
      return;
    }
    if (entry.actionType === 'focus-followup') {
      onFocusFollowUp();
      return;
    }
    if (entry.actionType === 'utility-modal' && entry.utilityModal) {
      onOpenUtilityModal(entry.utilityModal);
      return;
    }
    if (entry.sectionId) {
      onSelectSection(entry.sectionId, entry.tabId);
      if (entry.cvAction) {
        onTriggerCvMenuAction?.(entry.cvAction);
      }
    }
  };

  const specialistInitial =
    (specialistName || 'أ')
      .replace(/\[|\]|\./g, '')
      .trim()
      .charAt(0) || 'أ';

  const renderSidebarContent = (isCollapsed: boolean, isMobileDrawer: boolean) => (
    <>
      {/* Top Center Identity + Collapse/Close Toggle */}
      <div className="p-3 border-b border-[#1E293B] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => {
                onSelectSection('settings', 'center');
                onCloseMobile?.();
              }}
              className="flex items-center gap-2.5 text-right min-w-0 flex-1 cursor-pointer group"
              title="إعدادات المركز"
            >
              <span className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate group-hover:text-[#93C5FD]">
                  {centerName || 'المركز الشامل'}
                </div>
                <div className="text-[10px] text-[#94A3B8] truncate">
                  نظام إدارة التقارير والتأهيل
                </div>
              </div>
            </button>
          )}

          {isMobileDrawer ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="إغلاق القائمة الجانبية"
              className={`shrink-0 px-2 min-h-[34px] flex items-center justify-center bg-[#1E293B] hover:bg-[#334155] text-white cursor-pointer ${buttonRadiusClass}`}
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`${
                isCollapsed ? 'w-full' : 'shrink-0 px-2'
              } min-h-[34px] flex items-center justify-center bg-[#1E293B] hover:bg-[#334155] text-[#93C5FD] cursor-pointer transition-colors ${buttonRadiusClass}`}
              title="طي / توسيع القائمة (Ctrl+B)"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Specialist Card synced with report data */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => {
              onSelectSection('settings', 'signature');
              onCloseMobile?.();
            }}
            className="w-full p-2.5 rounded-xl bg-[#132347] hover:bg-[#192D5A] border border-[#243B6B] flex items-center gap-2.5 text-right transition-colors cursor-pointer"
            title="تعديل بيانات الأخصائي / المشرف"
          >
            <span className="w-8 h-8 rounded-full bg-[#3B82F6] text-white font-bold text-xs flex items-center justify-center shrink-0">
              {specialistInitial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {specialistName || 'الأخصائي المسؤول'}
              </div>
              <div className="text-[10px] text-[#94A3B8] truncate">
                {specialistRole || 'أخصائي تربوي ونفسي'}
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Quick Sidebar Search */}
      {!isCollapsed && (
        <div className="px-3 pt-2.5 pb-1 relative">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الأقسام..."
              className={`w-full min-h-[34px] pr-8 pl-7 text-xs bg-[#132347] border border-[#243B6B] text-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#3B82F6] ${buttonRadiusClass}`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="مسح البحث"
                className="absolute left-2 top-2 text-[#94A3B8] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {searchQuery.trim() && (
            <div
              className={`mt-1.5 border border-[#243B6B] bg-[#132347] max-h-56 overflow-y-auto shadow-lg ${buttonRadiusClass}`}
            >
              {searchResults.length === 0 ? (
                <div className="px-3 py-2.5 text-[11px] text-[#94A3B8]">
                  لا توجد نتائج مطابقة.
                </div>
              ) : (
                searchResults.map(({ groupTitle, entry }) => (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => {
                      handleEntryClick(entry);
                      setSearchQuery('');
                    }}
                    className="w-full text-right px-3 py-2 text-xs text-white hover:bg-[#2563EB] transition-colors flex items-center justify-between border-b border-[#243B6B]/60 last:border-b-0 cursor-pointer"
                  >
                    <span className="font-semibold truncate">{entry.label}</span>
                    <span className="text-[10px] text-[#94A3B8] shrink-0 mr-2">
                      {groupTitle}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 9 Organized Navigation Groups (Zero Duplicates) */}
      <nav className="flex-1 p-2.5 space-y-3.5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-0.5">
            {!isCollapsed && (
              <div
                className="px-2.5 pb-1 text-[10.5px] font-bold tracking-wider uppercase"
                style={{ color: group.titleColor }}
              >
                {group.title}
              </div>
            )}
            {group.items.map((entry) => {
              const Icon = entry.icon;
              const isActive =
                !entry.actionType && resolvedActiveKey === entry.key;

              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => handleEntryClick(entry)}
                  title={entry.label}
                  className={`w-full min-h-[36px] flex items-center ${
                    isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                  } text-xs transition-colors cursor-pointer ${buttonRadiusClass}`}
                  style={{
                    backgroundColor: isActive ? '#2563EB' : 'transparent',
                    color: entry.danger
                      ? '#FCA5A5'
                      : isActive
                      ? '#FFFFFF'
                      : '#E2E8F0',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  <span className="inline-flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        entry.danger
                          ? 'text-[#F87171]'
                          : isActive
                          ? 'text-white'
                          : 'text-[#93C5FD]'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex items-center gap-1.5">
                        <span>{entry.label}</span>
                        {entry.key === 'main-library' && typeof libraryCardsCount === 'number' && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-[#1E3A8A] text-[#BAE6FD]">
                            {libraryCardsCount}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Fixed Bottom [ + إضافات ] Multi-Purpose Button */}
      {showAddonsButton && (
        <div
          className="p-2.5 border-t"
          style={{ borderColor: '#1E293B', backgroundColor: '#071128' }}
        >
          <button
            type="button"
            onClick={() => {
              onCloseMobile?.();
              onOpenAddons();
            }}
            title="+ إضافات"
            className={`w-full min-h-[42px] flex items-center ${
              isCollapsed ? 'justify-center px-0' : 'justify-center gap-2 px-3'
            } text-xs font-bold text-white cursor-pointer transition-colors shadow-md bg-[#0EA5E9] hover:bg-[#0284C7] ${buttonRadiusClass}`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>إضافات</span>}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Fixed Right Sidebar (#0A1633, 260px) */}
      <aside
        dir="rtl"
        aria-label="القائمة الجانبية"
        className={`no-print hidden lg:flex flex-col shrink-0 border-l transition-[width] duration-200 select-none ${
          collapsed ? 'w-[64px]' : 'w-[260px]'
        }`}
        style={{
          backgroundColor: '#0A1633',
          borderColor: '#1E293B',
          color: '#F8FAFC',
        }}
      >
        {renderSidebarContent(collapsed, false)}
      </aside>

      {/* Mobile Slide-Over Right Drawer (Opened with ☰ button) */}
      {mobileOpen && (
        <div
          dir="rtl"
          className="no-print lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="القائمة الجانبية للجوال"
        >
          <aside
            className="w-[260px] max-w-[82vw] h-full flex flex-col border-l shadow-2xl select-none"
            style={{
              backgroundColor: '#0A1633',
              borderColor: '#1E293B',
              color: '#F8FAFC',
            }}
          >
            {renderSidebarContent(false, true)}
          </aside>
          <div
            onClick={onCloseMobile}
            className="flex-1 bg-black/50 backdrop-blur-[1px]"
            aria-hidden="true"
          />
        </div>
      )}
    </>
  );
};
