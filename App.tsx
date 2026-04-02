
import React, { useState } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Attendance from './components/Attendance';
import Transport from './components/Transport';
import Profile from './components/Profile';
import Login from './components/Login';
import Exams from './components/Exams';

const App: React.FC = () => {
  const [user, setUser] = useState<{ id: string; role: 'student' | 'admin' } | null>(null);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <HashRouter>
      <Layout userRole={user.role} userId={user.id}>
        <Routes>
          <Route path="/" element={<Dashboard userRole={user.role} />} />
          <Route path="/exams" element={<Exams userRole={user.role} />} />
          <Route path="/attendance" element={<Attendance userRole={user.role} />} />
          <Route path="/transport" element={<Transport />} />
          <Route path="/profile" element={<Profile onLogout={() => setUser(null)} />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

const Layout: React.FC<{ children: React.ReactNode; userRole: 'student' | 'admin'; userId: string }> = ({ children, userRole, userId }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background-dark text-white max-w-md mx-auto shadow-2xl relative">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-background-dark/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden">
            <img 
              alt="User Avatar" 
              className="w-full h-full object-cover" 
              src={userRole === 'admin' ? "https://picsum.photos/seed/admin/100/100" : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} 
            />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-primary leading-none uppercase">FAMES {userRole}</h1>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Portal Active</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>
          <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background-dark/95 backdrop-blur-lg border-t border-primary/10 px-4 py-3 pb-6 flex items-center justify-between z-50">
        <NavItem to="/" icon="home" label="Home" />
        <NavItem to="/exams" icon="edit_note" label="Exams" />
        <NavItem to="/attendance" icon="calendar_today" label="Attendance" />
        <NavItem to="/transport" icon="directions_bus" label="Transit" />
        <NavItem to="/profile" icon="person" label="Me" />
      </nav>
    </div>
  );
};

const NavItem: React.FC<{ to: string; icon: string; label: string }> = ({ to, icon, label }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-primary scale-110' : 'opacity-40 hover:opacity-100'}`}
    >
      <span className={`material-symbols-outlined text-2xl`}>{icon}</span>
      <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
    </NavLink>
  );
};

export default App;
