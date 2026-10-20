import { Navigate, Route, Routes } from 'react-router-dom';
import { session } from './api';
import Layout from './components/Layout';
import Fixtures from './pages/public/Fixtures';
import Draw from './pages/public/Draw';
import Points from './pages/public/Points';
import Top from './pages/public/Top';
import Teams from './pages/public/Teams';
import MatchDetail from './pages/public/MatchDetail';
import Login from './pages/admin/Login';
import Home from './pages/admin/Home';
import ATeams from './pages/admin/Teams';
import Rounds from './pages/admin/Rounds';
import Schedule from './pages/admin/Schedule';
import Users from './pages/admin/Users';
import ScoringList from './pages/scoring/ScoringList';
import ScoringMatch from './pages/scoring/ScoringMatch';

// Scorers can only open the scoring pages. Everything else needs the super admin.
const Guard = ({ superOnly, children }) => !session.isStaff ? <Navigate to="/admin/login" /> : superOnly && !session.isSuper ? <Navigate to="/admin/scoring" /> : children;
export default function App() {
  return <Routes><Route element={<Layout />}>
    <Route index element={<Fixtures />} /><Route path="draw" element={<Draw />} /><Route path="points" element={<Points />} /><Route path="top" element={<Top />} />
    <Route path="teams" element={<Teams />} /><Route path="match/:id" element={<MatchDetail />} />
    <Route path="admin/login" element={<Login />} />
    <Route path="admin" element={<Guard superOnly><Home /></Guard>} />
    <Route path="admin/teams" element={<Guard superOnly><ATeams /></Guard>} />
    <Route path="admin/rounds" element={<Guard superOnly><Rounds /></Guard>} />
    <Route path="admin/schedule" element={<Guard superOnly><Schedule /></Guard>} />
    <Route path="admin/users" element={<Guard superOnly><Users /></Guard>} />
    <Route path="admin/scoring" element={<Guard><ScoringList /></Guard>} />
    <Route path="admin/scoring/:id" element={<Guard><ScoringMatch /></Guard>} />
    <Route path="*" element={<Navigate to="/" />} />
  </Route></Routes>;
}
