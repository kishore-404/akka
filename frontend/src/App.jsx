// src/App.jsx
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLoyout'; // <-- Import the new layout

// Lazy-loaded Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Progress = lazy(() => import('./pages/Progress'));
const QuizSelect = lazy(() => import('./pages/QuizSelect'));
const QuizTake = lazy(() => import('./pages/QuizTake'));
const ViewDeck = lazy(() => import('./pages/ViewDeck'));
const Materials = lazy(() => import('./pages/Material'));
const QuizResult = lazy(() => import('./pages/QuizResult'));
const StudyCard = lazy(() => import('./pages/StudyCard'));
const Research = lazy(() => import('./pages/Research'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StudentManager = lazy(() => import('./pages/StudentManager'));
const StruggleMatrix = lazy(() => import('./pages/StruggleMatrix'));
// ... import your other pages

const App = () => {
  return (
    <Router>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
        <Routes>
          {/* Public Routes (No Navbar) */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes (Wrapped in MainLayout Navbar) */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/quiz-select" element={<QuizSelect />} />
            <Route path="/quiz/start/:type/:idOrNum" element={<QuizTake />} />
            <Route path="/quiz/results" element={<QuizResult />} />
            <Route path="/materials" element={<Materials />} /> 
            <Route path="/study/:deckId/:algo" element={<StudyCard />} />
            <Route path="/research" element={<Research />} />
            <Route path="/admin_dashboard" element={<AdminDashboard />} />
<Route path="/admin/students" element={<StudentManager />} />
<Route path="/admin/matrix" element={<StruggleMatrix />} />
{/* This looks INSIDE one specific deck. Note the ":id" param! */}
<Route path="/decks/:id" element={<ViewDeck />} />
            {/* Add your other protected routes here */}
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;