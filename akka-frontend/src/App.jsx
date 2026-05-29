import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

// 1. Global Layout (Replaces base.html)
// This ensures your mobile-first constraints and clean UI wrap every page.
const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-blue-100 antialiased font-sans">
      {/* Navigation/Sidebar will go here later */}
      <main className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet /> 
      </main>
    </div>
  );
};

// 2. Lazy-loaded Pages (Maps to your frontend/templates folder)
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
// const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// // Study & Decks
// const Deck = lazy(() => import('./pages/Deck'));
// const ViewDeck = lazy(() => import('./pages/ViewDeck'));
// const StudySelect = lazy(() => import('./pages/StudySelect'));
// const StudyCard = lazy(() => import('./pages/StudyCard'));
// const StudyDone = lazy(() => import('./pages/StudyDone'));
// const LearningMaterial = lazy(() => import('./pages/LearningMaterial'));

// // Quizzes
// const QuizSelect = lazy(() => import('./pages/QuizSelect'));
// const QuizTake = lazy(() => import('./pages/QuizTake'));
// const QuizResult = lazy(() => import('./pages/QuizResult'));

// // Progress & Research
// const Progress = lazy(() => import('./pages/Progress'));
// const Research = lazy(() => import('./pages/Research'));
// const ResearchStatistics = lazy(() => import('./pages/ResearchStatistics'));
// const Upload = lazy(() => import('./pages/Upload'));

// Loading Fallback (Can be styled later with glassmorphism or sleek spinners)
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-gray-400 font-medium">Loading...</div>
  </div>
);

const App = () => {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<MainLayout />}>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route element={<MainLayout />}>
            {/* Protected Routes (Add auth checks later) */}
            <Route path="/dashboard" element={<Dashboard />} />
            {/* <Route path="/admin" element={<AdminDashboard />} /> */}
            
            {/* Study & Decks */}
            {/* <Route path="/decks" element={<Deck />} />
            <Route path="/decks/:id" element={<ViewDeck />} />
            <Route path="/study/select" element={<StudySelect />} />
            <Route path="/study/card" element={<StudyCard />} />
            <Route path="/study/done" element={<StudyDone />} />
            <Route path="/learning-material" element={<LearningMaterial />} /> */}

            {/* Quizzes */}
            {/* <Route path="/quizzes/select" element={<QuizSelect />} />
            <Route path="/quizzes/take" element={<QuizTake />} />
            <Route path="/quizzes/result" element={<QuizResult />} /> */}

            {/* Progress & Research */}
            {/* <Route path="/progress" element={<Progress />} />
            <Route path="/research" element={<Research />} />
            <Route path="/research/statistics" element={<ResearchStatistics />} />
            <Route path="/upload" element={<Upload />} /> */}
          </Route>  
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;