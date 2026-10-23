import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavPage } from './components/Sidebar';
import { FloatingChatbot } from './components/FloatingChatbot';
import { TestRunnerModal } from './components/TestRunnerModal';
import { DashboardView } from './views/DashboardView';
import { ProfileView } from './views/ProfileView';
import { ScreeningView } from './views/ScreeningView';
import { PortfolioView } from './views/PortfolioView';
import { ResearchView } from './views/ResearchView';
import { AnalystView } from './views/AnalystView';
import { EvidenceView } from './views/EvidenceView';
import { SimulatorView } from './views/SimulatorView';
import { StressTestView } from './views/StressTestView';
import { DataQualityView } from './views/DataQualityView';
import { AuditView } from './views/AuditView';
import { SettingsView } from './views/SettingsView';
import {
  ClientProfile,
  Candidate,
  PolicyRule,
  ScreeningRun,
  PortfolioScenario,
  AIExplanation,
} from './types';
import { api } from './api';

export function App() {
  // 1. Portfolio Builder is the Homepage!
  const [currentPage, setCurrentPage] = useState<NavPage>('portfolio');
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [latestRun, setLatestRun] = useState<ScreeningRun | null>(null);
  const [latestScenario, setLatestScenario] = useState<PortfolioScenario | null>(null);
  const [scenariosList, setScenariosList] = useState<PortfolioScenario[]>([]);
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);

  const [loading, setLoading] = useState(true);
  const [isScreening, setIsScreening] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const [isRestoringDemo, setIsRestoringDemo] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // Initial Data Load
  const refreshAllData = async () => {
    try {
      const [profData, candsData, polData, screenData, scenData] = await Promise.all([
        api.getProfile().catch(() => null),
        api.getCandidates().catch(() => []),
        api.getPolicies().catch(() => ({ rules: [] })),
        api.getLatestScreening().catch(() => ({ latest_run: null })),
        api.getScenarios().catch(() => []),
      ]);

      if (profData) setProfile(profData);
      setCandidates(candsData);
      setRules(polData.rules || []);
      setLatestRun(screenData.latest_run);
      setScenariosList(scenData);
      if (scenData.length > 0) {
        const detail = await api.getScenarioDetail(scenData[0].id).catch(() => null);
        if (detail) {
          setLatestScenario({ ...detail.scenario, positions: detail.positions });
        } else {
          setLatestScenario(scenData[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Handlers
  const handleRunScreening = async () => {
    setIsScreening(true);
    try {
      await api.runScreening();
      const [candsData, screenData] = await Promise.all([
        api.getCandidates(),
        api.getLatestScreening(),
      ]);
      setCandidates(candsData);
      setLatestRun(screenData.latest_run);
      showNotification('Ethical screening executed successfully against active policy rules.');
    } catch (err: any) {
      showNotification('Screening error: ' + err.message);
    } finally {
      setIsScreening(false);
    }
  };

  const handleRecalculatePortfolio = async (params: any) => {
    setIsCalculating(true);
    try {
      const newScen = await api.calculatePortfolio(params);
      const detail = await api.getScenarioDetail(newScen.id);
      setLatestScenario({ ...detail.scenario, positions: detail.positions });
      const allScens = await api.getScenarios();
      setScenariosList(allScens);
      showNotification(`Portfolio calculated: £${newScen.allocated_amount.toLocaleString()} allocated, £${newScen.unallocated_cash.toLocaleString()} cash.`);
    } catch (err: any) {
      showNotification('Calculation error: ' + err.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleGenerateExplanation = async () => {
    setIsGeneratingExplanation(true);
    try {
      const exp = await api.getAIExplanation(latestScenario?.id);
      setExplanation(exp);
    } catch (err: any) {
      showNotification('Explanation error: ' + err.message);
    } finally {
      setIsGeneratingExplanation(false);
    }
  };

  const handleRestoreDemo = async () => {
    setIsRestoringDemo(true);
    try {
      await api.restoreDemoData();
      await refreshAllData();
      setExplanation(null);
      showNotification('EthicVest European infrastructure universe restored.');
    } catch (err: any) {
      showNotification('Reset error: ' + err.message);
    } finally {
      setIsRestoringDemo(false);
    }
  };

  // 3-Status counts
  const eligibleCount = candidates.filter(
    (c) => c.primary_status === 'Passes required checks' || c.primary_status === 'ELIGIBLE FOR FURTHER COMPARISON'
  ).length;
  const excludedCount = candidates.filter(
    (c) => c.primary_status === 'Excluded' || c.primary_status === 'EXCLUDED'
  ).length;
  const investigateCount = candidates.filter(
    (c) => c.primary_status === 'Needs ethical investigation' || c.primary_status === 'NEEDS INVESTIGATION'
  ).length;

  return (
    <div className="min-h-screen bg-[#030d06] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        profile={profile}
        onOpenTestRunner={() => setShowTestRunner(true)}
        onRestoreDemo={handleRestoreDemo}
        isRestoringDemo={isRestoringDemo}
      />

      {/* Floating Status Notification Toast */}
      {statusNotification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 right-6 z-50 bg-[#093017] text-[#D3FCDA] px-4 py-2.5 rounded-xl border border-[#2CA757]/40 shadow-xl text-xs font-medium animate-in fade-in slide-in-from-top-2"
        >
          {statusNotification}
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with 7 items */}
        <Sidebar
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          eligibleCount={eligibleCount}
          excludedCount={excludedCount}
          investigateCount={investigateCount}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 bg-[#030d06] max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#2CA757] border-t-transparent rounded-full animate-spin" />
              <span className="font-medium text-xs text-[#D3FCDA]">
                Initializing EthicVest decision support engine...
              </span>
            </div>
          ) : (
            <>
              {/* 1. Portfolio Builder (Homepage) */}
              {currentPage === 'portfolio' && (
                <PortfolioView
                  scenario={latestScenario}
                  scenariosList={scenariosList}
                  candidates={candidates}
                  onRecalculatePortfolio={handleRecalculatePortfolio}
                  isCalculating={isCalculating}
                  onNavigateToScreening={() => setCurrentPage('screening')}
                  onNavigateToResearch={() => setCurrentPage('research')}
                />
              )}

              {/* 2. Ethical Screening */}
              {currentPage === 'screening' && (
                <ScreeningView
                  candidates={candidates}
                  latestRun={latestRun}
                  onRunScreening={handleRunScreening}
                  isScreening={isScreening}
                  onNavigateToPortfolio={() => setCurrentPage('portfolio')}
                />
              )}

              {/* 3. Investment Research */}
              {currentPage === 'research' && (
                <ResearchView
                  candidates={candidates}
                  onNavigateToScreening={() => setCurrentPage('screening')}
                  onNavigateToPortfolio={() => setCurrentPage('portfolio')}
                />
              )}

              {/* 4. Research Overview (Preserved Original Dashboard) */}
              {currentPage === 'dashboard' && (
                <DashboardView
                  profile={profile}
                  candidates={candidates}
                  latestRun={latestRun}
                  latestScenario={latestScenario}
                  onNavigate={setCurrentPage}
                  onRunScreening={handleRunScreening}
                  isScreening={isScreening}
                />
              )}

              {/* 5. Evidence Explorer */}
              {currentPage === 'evidence' && <EvidenceView />}

              {/* 6. Data Quality */}
              {currentPage === 'data_quality' && <DataQualityView />}

              {/* 7. Settings & Data */}
              {currentPage === 'settings' && (
                <SettingsView
                  onOpenTestRunner={() => setShowTestRunner(true)}
                  onRestoreDemo={handleRestoreDemo}
                  isRestoringDemo={isRestoringDemo}
                />
              )}

              {/* Preserved Sub-tools if navigated internally */}
              {currentPage === 'profile' && (
                <ProfileView
                  profile={profile}
                  rules={rules}
                  onProfileUpdated={refreshAllData}
                  onRulesUpdated={refreshAllData}
                />
              )}

              {currentPage === 'analyst' && (
                <AnalystView
                  scenario={latestScenario}
                  explanation={explanation}
                  onGenerateExplanation={handleGenerateExplanation}
                  isGenerating={isGeneratingExplanation}
                />
              )}

              {currentPage === 'simulator' && (
                <SimulatorView rules={rules} candidates={candidates} />
              )}

              {currentPage === 'stress_test' && <StressTestView />}

              {currentPage === 'audit' && <AuditView />}
            </>
          )}
        </main>
      </div>

      {/* Persistent Floating Chatbot: EthicVest Research Assistant */}
      <FloatingChatbot />

      {/* Test Runner Modal */}
      <TestRunnerModal
        isOpen={showTestRunner}
        onClose={() => setShowTestRunner(false)}
      />
    </div>
  );
}

export default App;
