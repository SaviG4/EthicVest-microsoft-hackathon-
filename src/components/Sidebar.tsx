import React from 'react';
import {
  PieChart,
  CheckCircle2,
  Search,
  LayoutDashboard,
  FileText,
  Database,
  Settings,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export type NavPage =
  | 'portfolio'
  | 'screening'
  | 'research'
  | 'dashboard'
  | 'evidence'
  | 'data_quality'
  | 'settings'
  | 'profile'
  | 'analyst'
  | 'simulator'
  | 'stress_test'
  | 'audit';

interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  eligibleCount: number;
  excludedCount: number;
  investigateCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  eligibleCount,
  excludedCount,
  investigateCount,
}) => {
  // Exact 7 navigation items in specified order
  const navItems = [
    {
      id: 'portfolio' as NavPage,
      label: 'Portfolio Builder',
      badgeText: 'Homepage',
      icon: PieChart,
      desc: 'Cautious & Balanced Allocation',
    },
    {
      id: 'screening' as NavPage,
      label: 'Ethical Screening',
      badgeText: `${eligibleCount} Pass`,
      icon: CheckCircle2,
      desc: '3-Status Policy Engine',
    },
    {
      id: 'research' as NavPage,
      label: 'Investment Research',
      badgeText: '12 Assets',
      icon: Search,
      desc: 'European Infrastructure Universe',
    },
    {
      id: 'dashboard' as NavPage,
      label: 'Research Overview',
      icon: LayoutDashboard,
      desc: 'Executive Summary & Metrics',
    },
    {
      id: 'evidence' as NavPage,
      label: 'Evidence Explorer',
      icon: FileText,
      desc: 'Audited Factsheets & Filings',
    },
    {
      id: 'data_quality' as NavPage,
      label: 'Data Quality',
      icon: Database,
      desc: 'Disclosures & Freshness Audit',
    },
    {
      id: 'settings' as NavPage,
      label: 'Settings & Data',
      icon: Settings,
      desc: 'Connectors & Reset Demo',
    },
  ];

  return (
    <aside
      className="w-64 bg-[#051a0d] border-r border-[#093017] flex flex-col justify-between shrink-0 min-h-[calc(100vh-65px)]"
      aria-label="Main Navigation"
    >
      <div className="p-3.5 space-y-4">
        <div className="px-3 pt-1 pb-1 flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-[#74D885]">
          <span>Decision Workflow</span>
          <span className="text-[10px] font-mono text-emerald-400/70">7 Modules</span>
        </div>

        <nav className="space-y-1.5" aria-label="EthicVest Sections">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive =
              currentPage === item.id ||
              (item.id === 'dashboard' && currentPage === ('overview' as any));

            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors duration-150 flex items-center justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2CA757] ${
                  isActive
                    ? 'bg-[#093017] text-[#D3FCDA] border border-[#2CA757]/40 shadow-sm'
                    : 'text-slate-300 hover:bg-[#072411] hover:text-white border border-transparent'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isActive
                        ? 'bg-[#2CA757] text-[#093017]'
                        : 'bg-[#093017]/80 text-[#74D885] group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold truncate leading-tight">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {item.badgeText && !isActive && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#093017] text-[#74D885] border border-[#2CA757]/20">
                      {item.badgeText}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-[#74D885] shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status Card */}
      <div className="p-3.5 border-t border-[#093017] text-[11px] text-slate-300 space-y-2 bg-[#04140a]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D3FCDA]">
          <ShieldCheck className="w-4 h-4 text-[#2CA757]" />
          <span>EthicVest v2026.1</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Screening Status:</span>
          <span className="font-mono text-[#D3FCDA] font-semibold">
            {eligibleCount} Pass · {excludedCount} Excl · {investigateCount} Inves
          </span>
        </div>
        <div className="text-[10px] text-slate-400 leading-snug">
          European Infrastructure Decision Support. Audited factsheets & decimal arithmetic.
        </div>
      </div>
    </aside>
  );
};
