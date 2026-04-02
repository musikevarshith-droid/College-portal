
import React, { useState } from 'react';

interface Project {
  id: string;
  title: string;
  description: string;
  link: string;
}

interface PortfolioData {
  bio: string;
  skills: string[];
  projects: Project[];
}

interface ProfileProps {
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileInfo, setProfileInfo] = useState({
    name: 'Alex Thompson',
    major: 'Computer Science',
    classOf: '2026',
    avatar: 'https://picsum.photos/seed/alex/200/200'
  });

  const [portfolio, setPortfolio] = useState<PortfolioData>({
    bio: 'Passionate software engineering student focused on building scalable web applications and exploring AI/ML possibilities.',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Python'],
    projects: [
      { id: '1', title: 'Campus Navigation App', description: 'A mobile-first SVG based map for university students.', link: '#' },
      { id: '2', title: 'AI Attendance System', description: 'Face recognition portal for daily check-ins.', link: '#' }
    ]
  });

  const handleSave = () => {
    setIsEditing(false);
  };

  const addSkill = (skill: string) => {
    if (skill && !portfolio.skills.includes(skill)) {
      setPortfolio({ ...portfolio, skills: [...portfolio.skills, skill] });
    }
  };

  const removeSkill = (index: number) => {
    const newSkills = [...portfolio.skills];
    newSkills.splice(index, 1);
    setPortfolio({ ...portfolio, skills: newSkills });
  };

  const updateProject = (id: string, field: keyof Project, value: string) => {
    const newProjects = portfolio.projects.map(p => p.id === id ? { ...p, [field]: value } : p);
    setPortfolio({ ...portfolio, projects: newProjects });
  };

  return (
    <div className="p-4 space-y-6 pb-32 animate-in slide-in-from-right duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full border-4 border-primary/20 p-1">
            <img 
              src={profileInfo.avatar} 
              className="w-full h-full rounded-full object-cover" 
              alt={profileInfo.name}
            />
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-background-dark shadow-xl transition-colors ${isEditing ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}
          >
            <span className="material-symbols-outlined text-base">
              {isEditing ? 'check' : 'edit'}
            </span>
          </button>
        </div>
        <div className="text-center w-full">
          {isEditing ? (
            <div className="space-y-2">
              <input 
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-xl font-black w-full"
                value={profileInfo.name}
                onChange={(e) => setProfileInfo({...profileInfo, name: e.target.value})}
              />
              <div className="flex gap-2 justify-center">
                <input 
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-xs w-2/3"
                  value={profileInfo.major}
                  onChange={(e) => setProfileInfo({...profileInfo, major: e.target.value})}
                />
                <input 
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-xs w-1/3"
                  value={profileInfo.classOf}
                  onChange={(e) => setProfileInfo({...profileInfo, classOf: e.target.value})}
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black">{profileInfo.name}</h2>
              <p className="text-sm opacity-60">{profileInfo.major} • Class of {profileInfo.classOf}</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
          <p className="text-2xl font-black text-primary">85%</p>
          <p className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Attendance</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
          <p className="text-2xl font-black text-primary">124</p>
          <p className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Credits Done</p>
        </div>
      </div>

      <section className="space-y-4 bg-white/5 rounded-2xl p-4 border border-white/5">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-widest opacity-50">Portfolio</h3>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="text-[10px] text-primary font-bold uppercase">Edit Portfolio</button>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase opacity-40 font-bold">Bio</label>
          {isEditing ? (
            <textarea 
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs leading-relaxed focus:border-primary outline-none"
              rows={3}
              value={portfolio.bio}
              onChange={(e) => setPortfolio({...portfolio, bio: e.target.value})}
            />
          ) : (
            <p className="text-xs leading-relaxed opacity-80">{portfolio.bio}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase opacity-40 font-bold">Expertise</label>
          <div className="flex flex-wrap gap-2">
            {portfolio.skills.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full flex items-center gap-1">
                {skill}
                {isEditing && (
                  <button onClick={() => removeSkill(i)}>
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                )}
              </span>
            ))}
            {isEditing && (
              <input 
                type="text"
                placeholder="+ Add Skill"
                className="bg-transparent border border-white/10 px-2 py-1 rounded-full text-[10px] w-20 outline-none focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addSkill((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] uppercase opacity-40 font-bold">Featured Projects</label>
          <div className="space-y-3">
            {portfolio.projects.map((project) => (
              <div key={project.id} className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <input 
                      className="w-full bg-transparent border-b border-white/10 text-xs font-bold outline-none"
                      value={project.title}
                      onChange={(e) => updateProject(project.id, 'title', e.target.value)}
                    />
                    <textarea 
                      className="w-full bg-transparent text-[10px] opacity-70 outline-none"
                      value={project.description}
                      onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <h4 className="text-xs font-bold text-primary">{project.title}</h4>
                    <p className="text-[10px] opacity-70">{project.description}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {isEditing && (
          <button 
            onClick={handleSave}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl text-xs shadow-lg shadow-primary/20"
          >
            Save Portfolio Changes
          </button>
        )}
      </section>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-50">Quick Settings</h3>
        <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
          {[
            { icon: 'settings', label: 'Account Settings' },
            { icon: 'description', label: 'Academic Transcript' },
            { icon: 'payments', label: 'Fee Payments' },
            { icon: 'lock', label: 'Privacy & Security' },
            { icon: 'help', label: 'Support & Helpdesk' },
          ].map((item, i) => (
            <button key={i} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined opacity-60">{item.icon}</span>
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              <span className="material-symbols-outlined opacity-30 text-base">arrow_forward_ios</span>
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={onLogout}
        className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500 hover:text-white transition-all"
      >
        Sign Out of Portal
      </button>
    </div>
  );
};

export default Profile;
