import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Workspace from './pages/workspace/Workspace';
import LessonPlanner from './pages/lesson/LessonPlanner';
import QuizGenerator from './pages/quiz/QuizGenerator';

import './index.css';

// A simple protective wrapper for authenticated routes
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="workspaces" element={<Workspace />} />
          <Route path="lesson-planner" element={<LessonPlanner />} />
          <Route path="quiz-generator" element={<QuizGenerator />} />
        </Route>
      </Routes>
    </Router>
  );
}
