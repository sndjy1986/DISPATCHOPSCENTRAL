import { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/centralhub/Layout';
import { StartPage } from './pages/centralhub/StartPage';
import { PageWrapper } from './components/centralhub/PageWrapper';
import { MatrixPasscodeGate } from './components/centralhub/MatrixPasscodeGate';

const ToneTest = lazy(() => import('./pages/ToneTest'));
const ShiftReport = lazy(() => import('./pages/ShiftReport'));
const DistanceMap = lazy(() => import('./pages/DistanceMap'));
import { UnitPosting } from './components/tools/UnitPosting';
const DotCameras = lazy(() => import('./pages/DotCameras'));
const AdminPage = lazy(() => import('./pages/centralhub/AdminPage'));
const TimeClock = lazy(() => import('./pages/TimeClock'));
const Directory = lazy(() => import('./pages/Directory'));
const Timers = lazy(() => import('./pages/Timers'));
const OperationalGuidelines = lazy(() => import('./pages/OperationalGuidelines'));
const CodesReference = lazy(() => import('./pages/CodesReference'));
const DispatchTools = lazy(() => import('./pages/DispatchTools'));
const ShiftTurnover = lazy(() => import('./pages/ShiftTurnover'));
const SendAdminMessage = lazy(() => import('./pages/centralhub/SendAdminMessage'));

export default function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<div className="w-full h-full bg-bg-main flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
            <Route path="/" element={<PageWrapper fullWidth className="p-6 md:p-10 max-w-[1920px] mx-auto overflow-y-auto"><StartPage /></PageWrapper>} />
            <Route path="/tone-test" element={<PageWrapper className="overflow-y-auto"><ToneTest /></PageWrapper>} />
            <Route path="/unit-posting" element={<PageWrapper fullWidth className="overflow-hidden"><UnitPosting /></PageWrapper>} />
            <Route path="/distance-map" element={<PageWrapper fullWidth className="overflow-hidden"><DistanceMap /></PageWrapper>} />
            <Route path="/cameras" element={<PageWrapper fullWidth className="overflow-hidden"><DotCameras /></PageWrapper>} />
            <Route 
              path="/shift-report" 
              element={
                <PageWrapper className="overflow-y-auto">
                  <MatrixPasscodeGate allowedRoles={['root', 'admin', 'shift_lead']}>
                    <ShiftReport />
                  </MatrixPasscodeGate>
                </PageWrapper>
              } 
            />
            <Route 
              path="/single-shift-report" 
              element={
                <PageWrapper className="overflow-y-auto max-w-[1920px] mx-auto p-2 sm:p-6">
                  <ShiftReport />
                </PageWrapper>
              } 
            />
            <Route 
              path="/shift-report/standalone" 
              element={
                <PageWrapper className="overflow-y-auto max-w-[1920px] mx-auto p-2 sm:p-6">
                  <ShiftReport />
                </PageWrapper>
              } 
            />
            <Route path="/time-clock" element={<PageWrapper fullWidth className="overflow-hidden"><TimeClock /></PageWrapper>} />
            <Route path="/timers" element={<PageWrapper className="overflow-y-auto"><Timers /></PageWrapper>} />
            <Route path="/directory" element={<PageWrapper className="overflow-y-auto"><Directory /></PageWrapper>} />
            <Route path="/guidelines" element={<PageWrapper className="overflow-y-auto"><OperationalGuidelines /></PageWrapper>} />
            <Route path="/codes" element={<PageWrapper className="overflow-y-auto"><CodesReference /></PageWrapper>} />
            <Route path="/tools" element={<PageWrapper className="overflow-y-auto"><DispatchTools /></PageWrapper>} />
            <Route path="/turnover" element={<PageWrapper className="overflow-y-auto"><ShiftTurnover /></PageWrapper>} />
            <Route path="/admin/settings" element={<PageWrapper className="overflow-y-auto"><AdminPage /></PageWrapper>} />
            <Route 
              path="/admin/send-message" 
              element={
                <PageWrapper className="overflow-y-auto">
                  <MatrixPasscodeGate allowedRoles={['root', 'admin']}>
                    <SendAdminMessage />
                  </MatrixPasscodeGate>
                </PageWrapper>
              } 
            />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}
