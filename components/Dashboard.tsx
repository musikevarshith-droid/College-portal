
import React, { useState, useEffect, useMemo } from 'react';
import { Notification, AttendanceDay, Exam } from '../types';
import { useNavigate } from 'react-router-dom';

const QUOTES = [
  "The beautiful thing about learning is that no one can take it away from you. — B.B. King",
  "Education is the most powerful weapon which you can use to change the world. — Nelson Mandela",
  "Live as if you were to die tomorrow. Learn as if you were to live forever. — Mahatma Gandhi",
  "The more that you read, the more things you will know. — Dr. Seuss",
  "Learning never exhausts the mind. — Leonardo da Vinci",
  "Develop a passion for learning. If you do, you will never cease to grow. — Anthony J. D'Angelo",
  "An investment in knowledge pays the best interest. — Benjamin Franklin",
  "Education is not the filling of a pail, but the lighting of a fire. — W.B. Yeats",
  "Knowledge is power. Information is liberating. — Kofi Annan",
  "A person who never made a mistake never tried anything new. — Albert Einstein",
  "Study while others are sleeping; prepare while others are playing. — William Arthur Ward",
  "Education is the key to unlocking the world, a passport to freedom. — Oprah Winfrey",
  "The aim of education is the knowledge, not of facts, but of values. — William S. Burroughs",
  "Change is the end result of all true learning. — Leo Buscaglia",
  "Teachers open the door, but you must enter by yourself. — Chinese Proverb",
  "I am still learning. — Michelangelo",
  "The capacity to learn is a gift; the willingness to learn is a choice. — Brian Herbert",
  "Success is the sum of small efforts, repeated day in and day out. — Robert Collier",
  "The secret of getting ahead is getting started. — Mark Twain",
  "Don't let what you cannot do interfere with what you can do. — John Wooden"
];

const Dashboard: React.FC<{ userRole: 'student' | 'admin' }> = ({ userRole }) => {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<AttendanceDay[]>([]);
  const [greeting, setGreeting] = useState('');
  const [quote, setQuote] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [showBadge, setShowBadge] = useState(false);
  const [regCount, setRegCount] = useState(0);

  const getGreetingByIST = () => {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utcTime + (3600000 * 5.5));
    const hours = istTime.getHours();

    if (hours >= 5 && hours < 12) return "Hi, Good Morning";
    if (hours >= 12 && hours < 17) return "Hi, Good Afternoon";
    if (hours >= 17 && hours < 22) return "Hi, Good Evening";
    return "Hi, Keep Learning!";
  };

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    return QUOTES[randomIndex];
  };

  const getUpcomingExams = useMemo(() => {
    return [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [exams]);

  useEffect(() => {
    setGreeting(getGreetingByIST());
    setQuote(getRandomQuote());

    // Load Exams
    const savedExams = localStorage.getItem('fames_exams');
    if (savedExams) {
      setExams(JSON.parse(savedExams));
    }

    // Load User Registrations
    const userId = "Alex"; // Simulation
    const savedRegs = localStorage.getItem(`fames_regs_${userId}`);
    if (savedRegs) {
      setRegCount(JSON.parse(savedRegs).length);
    }

    // Check Badge
    const lastCount = parseInt(localStorage.getItem('fames_last_exam_count') || "0");
    if (exams.length > lastCount) {
      setShowBadge(true);
    }

    // Attendance Mock
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() - today.getDay() + i);
      const status: 'present' | 'absent' | 'none' = d.getDate() < today.getDate() 
        ? (Math.random() > 0.2 ? 'present' : 'absent')
        : (d.getDate() === today.getDate() ? 'none' : 'none');
      week.push({ day: days[d.getDay()], status } as AttendanceDay);
    }
    setAttendance(week);
  }, []);

  const clearBadge = () => {
    setShowBadge(false);
    localStorage.setItem('fames_last_exam_count', exams.length.toString());
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      {/* Greeting & Quote */}
      <section className="p-4" onClick={clearBadge}>
        <div className="bg-gradient-to-br from-card-dark to-background-dark rounded-[2.5rem] p-6 border border-primary/20 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-primary text-2xl animate-pulse">
                  {greeting.includes('Morning') ? 'light_mode' : 
                   greeting.includes('Afternoon') ? 'sunny' : 
                   greeting.includes('Evening') ? 'dark_mode' : 'auto_stories'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white leading-tight">
                  {greeting}, {userRole === 'admin' ? 'Director' : 'Alex'}!
                </h2>
                <p className="text-[10px] uppercase font-bold text-primary tracking-[0.2em]">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })} • IST
                </p>
              </div>
              {showBadge && (
                <div className="ml-auto w-3 h-3 bg-red-500 rounded-full animate-ping shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
              )}
            </div>
            <p className="text-xs italic leading-relaxed text-white/70 font-medium">"{quote}"</p>
          </div>
        </div>
      </section>

      {/* Quick Stats & Registrations */}
      <section className="px-4 py-2 grid grid-cols-2 gap-4">
        <div 
          onClick={() => navigate('/exams')}
          className="bg-primary/10 border border-primary/20 rounded-2xl p-4 cursor-pointer hover:bg-primary/20 transition-all group"
        >
          <p className="text-[10px] uppercase font-bold text-primary mb-1">Registered Exams</p>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-black">{regCount}</p>
            <span className="material-symbols-outlined text-primary text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-[10px] uppercase font-bold opacity-50 mb-1">Today's Attendance</p>
          <p className="text-2xl font-black text-green-500">92%</p>
        </div>
      </section>

      {/* Exam Notifications Module */}
      <section className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">Upcoming Exams</h3>
            {showBadge && (
              <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">NEW</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {getUpcomingExams.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <span className="material-symbols-outlined text-4xl opacity-20 mb-2">event_busy</span>
              <p className="text-[10px] font-bold uppercase opacity-30 tracking-widest">No Exams Scheduled</p>
            </div>
          ) : (
            getUpcomingExams.slice(0, 3).map(exam => (
              <div key={exam.id} className="group relative bg-card-dark rounded-3xl p-5 border border-white/5 hover:border-primary/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full w-fit tracking-tighter uppercase bg-primary/20 text-primary">
                      {exam.subject}
                    </span>
                    <h4 className="font-bold text-base text-white">{exam.name}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white leading-none">{exam.date.split('-')[2]}</p>
                    <p className="text-[9px] uppercase font-bold opacity-40">{new Date(exam.date).toLocaleString('default', { month: 'short' })}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5 opacity-60">
                    <span className="material-symbols-outlined text-sm text-primary">calendar_month</span>
                    <span className="text-[10px] font-bold">{exam.date}</span>
                  </div>
                </div>

                {exam.description && (
                  <p className="text-[11px] leading-relaxed opacity-60 line-clamp-2 italic">{exam.description}</p>
                )}
              </div>
            ))
          )}
          {exams.length > 3 && (
            <button 
              onClick={() => navigate('/exams')}
              className="w-full py-3 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
            >
              View All Exams ({exams.length})
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
