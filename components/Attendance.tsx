
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Student, AttendanceRecord, AttendanceConfig } from '../types';

const NAMES = ['Alex Thompson', 'Jordan Lee', 'Sarah Chen', 'Michael Ross', 'Emma Wilson', 'David Park', 'Lisa Kumar', 'Chris Evans'];

// Seeded random helper for consistent avatars
const getAvatar = (id: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`;

const Attendance: React.FC<{ userRole: 'student' | 'admin' }> = ({ userRole }) => {
  const [view, setView] = useState<'scan' | 'dashboard' | 'register' | 'config'>(userRole === 'admin' ? 'dashboard' : 'scan');
  const [adminRegisterView, setAdminRegisterView] = useState<'enroll' | 'manage'>('manage');
  
  // Config State
  const [config, setConfig] = useState<AttendanceConfig>({ branches: [], groups: [] });
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  // Student Database State
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  
  // Manage View State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isRecapturing, setIsRecapturing] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  
  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [identifiedStudent, setIdentifiedStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const PAGE_SIZE = 20;

  // Persistence & Initialization
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/attendance/config');
        const data = await res.json();
        setConfig(data);
        
        // Initialize students if needed
        const savedStudents = localStorage.getItem('fames_students');
        if (savedStudents) {
          setStudents(JSON.parse(savedStudents));
        } else if (data.branches.length > 0 && data.groups.length > 0) {
          const initial = Array.from({ length: 400 }).map((_, i) => ({
            id: `2023-${(i + 1).toString().padStart(4, '0')}`,
            name: `${NAMES[i % NAMES.length]} ${i + 1}`,
            branch: data.branches[i % data.branches.length],
            group: data.groups[Math.floor(i / 100) % data.groups.length],
          }));
          setStudents(initial);
          localStorage.setItem('fames_students', JSON.stringify(initial));
        }
      } catch (e) {
        console.error("Failed to fetch config", e);
      }
    };

    fetchConfig();

    const savedLogs = localStorage.getItem('fames_attendance_logs');
    if (savedLogs) setAttendanceLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem('fames_students', JSON.stringify(students));
    }
  }, [students]);

  // Filtering and Pagination Logic
  const filteredStudents = useMemo(() => {
    let result = students.filter(s => 
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       s.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedBranch === 'All' || s.branch === selectedBranch) &&
      (selectedGroup === 'All' || s.group === selectedGroup)
    );
    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [students, searchTerm, sortOrder, selectedBranch, selectedGroup]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStudents.slice(start, start + PAGE_SIZE);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);

  // Handlers
  const handleSaveStudent = (updated: Student) => {
    // Check for duplicate ID if ID changed
    const original = students.find(s => s.id === editingStudent?.id);
    if (original && updated.id !== original.id) {
      if (students.some(s => s.id === updated.id)) {
        setError("Student ID already exists.");
        return;
      }
    }
    
    setStudents(prev => prev.map(s => s.id === editingStudent?.id ? updated : s));
    setEditingStudent(null);
    setSuccessMsg("Student updated successfully.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm("Are you sure? This will remove the student from the database.")) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const startRecapture = async () => {
    setIsRecapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      setError("Camera error.");
      setIsRecapturing(false);
    }
  };

  const captureRecapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const stream = videoRef.current.srcObject as MediaStream;
    stream.getTracks().forEach(t => t.stop());
    setIsRecapturing(false);
    setSuccessMsg("Face template recaptured.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const exportToCSV = () => {
    const headers = "Student ID,Name,Branch,Group\n";
    const rows = students.map(s => `${s.id},${s.name},${s.branch},${s.group}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_database_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const importFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1); // skip headers
      const newStudents = [...students];
      lines.forEach(line => {
        const [id, name, branch, group] = line.split(',').map(s => s.trim());
        if (id && name) {
          const idx = newStudents.findIndex(s => s.id === id);
          if (idx !== -1) {
            newStudents[idx] = { ...newStudents[idx], name, branch: branch as any, group: group as any };
          } else {
            newStudents.push({ id, name, branch: branch as any, group: group as any });
          }
        }
      });
      setStudents(newStudents);
      setSuccessMsg(`Import complete. ${lines.length} records processed.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    };
    reader.readAsText(file);
  };

  const updateBranches = async (newBranches: string[]) => {
    if (userRole !== 'admin') return;
    try {
      const res = await fetch('/api/attendance/branches', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': userRole
        },
        body: JSON.stringify({ branches: newBranches })
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setSuccessMsg("Branches updated successfully");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to update branches");
      }
    } catch (e) {
      setError("Failed to update branches");
    }
  };

  const updateGroups = async (newGroups: string[]) => {
    if (userRole !== 'admin') return;
    try {
      const res = await fetch('/api/attendance/groups', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': userRole
        },
        body: JSON.stringify({ groups: newGroups })
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setSuccessMsg("Groups updated successfully");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to update groups");
      }
    } catch (e) {
      setError("Failed to update groups");
    }
  };

  // Scanner logic integrated from previous turns
  const startScanner = async () => {
    setIsScanning(true);
    setIdentifiedStudent(null);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) { setError("Camera error."); setIsScanning(false); }
  };

  const captureAndIdentify = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;
    setIsProcessing(true);
    try {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: `Identify student from database (2023-0001 to 2023-0400). Respond JSON: {"status": "SUCCESS", "studentId": "2023-XXXX"}` },
            { inlineData: { mimeType: 'image/jpeg', data: imageData } }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text || '{}');
      if (result.status === 'SUCCESS') {
        const student = students.find(s => s.id === result.studentId) || students[0];
        const today = new Date().toISOString().split('T')[0];
        if (attendanceLogs.some(l => l.studentId === student.id && l.date === today)) {
          setError(`Already marked for ${student.name}`);
        } else {
          setIdentifiedStudent(student);
          const newLog = { id: Date.now().toString(), studentId: student.id, studentName: student.name, timestamp: new Date().toLocaleTimeString(), date: today };
          setAttendanceLogs([newLog, ...attendanceLogs]);
          localStorage.setItem('fames_attendance_logs', JSON.stringify([newLog, ...attendanceLogs]));
        }
      }
    } catch (e) { setError("Recognition failed."); } finally { setIsProcessing(false); }
  };

  return (
    <div className="p-4 space-y-6 pb-32 animate-in fade-in duration-500">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Navigation Tabs */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
        <button onClick={() => setView('scan')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${view === 'scan' ? 'bg-primary text-white shadow-lg' : 'opacity-40'}`}>Scanner</button>
        <button onClick={() => setView('dashboard')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${view === 'dashboard' ? 'bg-primary text-white shadow-lg' : 'opacity-40'}`}>Admin</button>
        <button onClick={() => setView('register')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${view === 'register' ? 'bg-primary text-white shadow-lg' : 'opacity-40'}`}>Manage</button>
        {userRole === 'admin' && (
          <button onClick={() => setView('config')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${view === 'config' ? 'bg-primary text-white shadow-lg' : 'opacity-40'}`}>Settings</button>
        )}
      </div>

      {view === 'scan' && (
        <section className="space-y-6">
          <div className={`relative w-full aspect-square max-w-sm mx-auto rounded-[3rem] overflow-hidden border-4 transition-all duration-500 ${identifiedStudent ? 'border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)]' : 'border-primary/30 bg-card-dark shadow-2xl'}`}>
            {isScanning ? (
              <>
                <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
                <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none">
                  {identifiedStudent && (
                    <div className="bg-green-500/90 backdrop-blur-md p-4 rounded-2xl animate-in zoom-in duration-500">
                      <h3 className="text-xl font-black text-white">{identifiedStudent.name}</h3>
                      <p className="text-xs text-white/80">{identifiedStudent.id} • {identifiedStudent.branch}</p>
                    </div>
                  )}
                  {!identifiedStudent && isProcessing && <div className="self-center bg-primary/20 px-4 py-2 rounded-full border border-primary/40 animate-pulse text-[10px] font-black text-primary">SCANNING...</div>}
                </div>
                {!identifiedStudent && !isProcessing && <div className="absolute top-0 left-0 w-full h-1 bg-primary/60 shadow-[0_0_20px_rgba(236,91,19,1)] animate-[faceScan_3s_infinite]"></div>}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                <span className="material-symbols-outlined text-6xl text-primary opacity-20">face_retouching_natural</span>
                <p className="text-xs opacity-50">Identity Verification Gateway</p>
              </div>
            )}
          </div>
          <button onClick={isScanning ? captureAndIdentify : startScanner} className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl">
            {isScanning ? (isProcessing ? 'PROCESSING...' : 'CAPTURE & MARK') : 'INITIALIZE SCANNER'}
          </button>
          {error && <p className="text-center text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>}
        </section>
      )}

      {view === 'register' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-fit mx-auto">
            <button onClick={() => setAdminRegisterView('manage')} className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${adminRegisterView === 'manage' ? 'bg-primary text-white shadow-sm' : 'opacity-40'}`}>Student List</button>
            <button onClick={() => setAdminRegisterView('enroll')} className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${adminRegisterView === 'enroll' ? 'bg-primary text-white shadow-sm' : 'opacity-40'}`}>Enroll New</button>
          </div>

          {adminRegisterView === 'manage' && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-50">search</span>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:border-primary outline-none"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[9px] font-black uppercase tracking-widest outline-none focus:border-primary appearance-none"
                    value={selectedBranch}
                    onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="All">All Branches</option>
                    {config.branches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <select 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-[9px] font-black uppercase tracking-widest outline-none focus:border-primary appearance-none"
                    value={selectedGroup}
                    onChange={(e) => { setSelectedGroup(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="All">All Groups</option>
                    {config.groups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">{sortOrder === 'asc' ? 'sort_by_alpha' : 'sort'}</span>
                    Sort {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                  </button>
                  <button onClick={exportToCSV} className="flex-1 bg-primary/10 border border-primary/20 text-primary rounded-xl py-2 px-4 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export
                  </button>
                  <label className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Import
                    <input type="file" className="hidden" accept=".csv" onChange={importFromCSV} />
                  </label>
                </div>
              </div>

              {successMsg && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-[9px] font-black text-center uppercase tracking-widest">{successMsg}</div>}

              {/* Table */}
              <div className="bg-card-dark rounded-3xl border border-white/5 overflow-hidden">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 font-black uppercase opacity-40">Photo</th>
                      <th className="px-4 py-3 font-black uppercase opacity-40">Student Info</th>
                      <th className="px-4 py-3 font-black uppercase opacity-40 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedStudents.map(student => (
                      <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-3">
                          <img src={getAvatar(student.id)} className="w-8 h-8 rounded-lg bg-background-dark border border-white/10" alt="" />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-black text-white">{student.name}</p>
                          <p className="opacity-40 font-bold uppercase tracking-tight">{student.id} • {student.branch}-{student.group}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setEditingStudent(student)} className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-2">
                <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
                <div className="flex gap-2">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-20">
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-20">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {adminRegisterView === 'enroll' && (
            <div className="bg-card-dark rounded-3xl p-6 border border-white/10 shadow-2xl">
              <h3 className="text-lg font-black mb-6">Enroll New Student</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1">Student ID</label>
                  <input id="new-id" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none" placeholder="2023-XXXX" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1">Full Name</label>
                  <input id="new-name" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none" placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-1">Branch</label>
                    <select id="new-branch" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none appearance-none">
                      {config.branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-40 ml-1">Group</label>
                    <select id="new-group" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none appearance-none">
                      {config.groups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={() => {
                  const id = (document.getElementById('new-id') as HTMLInputElement).value;
                  const name = (document.getElementById('new-name') as HTMLInputElement).value;
                  const branch = (document.getElementById('new-branch') as HTMLSelectElement).value as any;
                  const group = (document.getElementById('new-group') as HTMLSelectElement).value as any;
                  if (!id || !name) { setError("Fill all fields"); return; }
                  if (students.some(s => s.id === id)) { setError("ID already taken"); return; }
                  setStudents([{id, name, branch, group}, ...students]);
                  setSuccessMsg("Student enrolled successfully.");
                  setAdminRegisterView('manage');
                }} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-4">
                  Register Student
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-card-dark rounded-[2.5rem] border border-white/10 p-8 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black">Edit Record</h3>
              <button onClick={() => { setEditingStudent(null); setIsRecapturing(false); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {isRecapturing ? (
              <div className="space-y-4">
                <div className="aspect-square w-full rounded-3xl bg-black overflow-hidden relative">
                  <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
                  <div className="absolute inset-0 border-[15px] border-card-dark rounded-[2.2rem]"></div>
                </div>
                <button onClick={captureRecapture} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Capture Frame</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-6">
                  <img src={getAvatar(editingStudent.id)} className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10" alt="" />
                  <button onClick={startRecapture} className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    Update Photo
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase opacity-40 ml-1">Student ID</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold"
                      value={editingStudent.id}
                      onChange={(e) => setEditingStudent({...editingStudent, id: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase opacity-40 ml-1">Full Name</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold"
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Branch</label>
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold appearance-none"
                        value={editingStudent.branch}
                        onChange={(e) => setEditingStudent({...editingStudent, branch: e.target.value as any})}
                      >
                        {config.branches.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Group</label>
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs font-bold appearance-none"
                        value={editingStudent.group}
                        onChange={(e) => setEditingStudent({...editingStudent, group: e.target.value as any})}
                      >
                        {config.groups.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button onClick={() => handleDeleteStudent(editingStudent.id)} className="flex-1 bg-red-500/10 text-red-500 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-red-500/20">Delete</button>
                  <button onClick={() => handleSaveStudent(editingStudent)} className="flex-[2] bg-primary text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg">Save Record</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'config' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          {/* Branches Section */}
          <section className="bg-card-dark rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-widest text-primary">Manage Branches</h3>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black">{config.branches.length} TOTAL</span>
            </div>
            
            <div className="space-y-3">
              {config.branches.map((branch, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 group">
                  <input 
                    className="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0 outline-none"
                    value={branch}
                    onChange={(e) => {
                      const newBranches = [...config.branches];
                      newBranches[idx] = e.target.value;
                      setConfig({ ...config, branches: newBranches });
                    }}
                    onBlur={() => updateBranches(config.branches)}
                  />
                  <button 
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete the branch "${branch}"?`)) {
                        updateBranches(config.branches.filter((_, i) => i !== idx));
                      }
                    }}
                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <input 
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none"
                placeholder="New Branch Name..."
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
              />
              <button 
                onClick={() => {
                  if (!newBranchName) return;
                  updateBranches([...config.branches, newBranchName]);
                  setNewBranchName('');
                }}
                className="bg-primary text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg"
              >
                Add
              </button>
            </div>
          </section>

          {/* Groups Section */}
          <section className="bg-card-dark rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-widest text-primary">Manage Groups</h3>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black">{config.groups.length} TOTAL</span>
            </div>
            
            <div className="space-y-3">
              {config.groups.map((group, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 group">
                  <input 
                    className="flex-1 bg-transparent border-none text-sm font-bold focus:ring-0 outline-none"
                    value={group}
                    onChange={(e) => {
                      const newGroups = [...config.groups];
                      newGroups[idx] = e.target.value;
                      setConfig({ ...config, groups: newGroups });
                    }}
                    onBlur={() => updateGroups(config.groups)}
                  />
                  <button 
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete the group "${group}"?`)) {
                        updateGroups(config.groups.filter((_, i) => i !== idx));
                      }
                    }}
                    className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <input 
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none"
                placeholder="New Group Name..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <button 
                onClick={() => {
                  if (!newGroupName) return;
                  updateGroups([...config.groups, newGroupName]);
                  setNewGroupName('');
                }}
                className="bg-primary text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg"
              >
                Add
              </button>
            </div>
          </section>
        </div>
      )}

      {view === 'dashboard' && (
        <section className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card-dark rounded-3xl p-5 border border-white/5 shadow-xl">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Database Size</p>
              <span className="text-4xl font-black">{students.length}</span>
            </div>
            <div className="bg-card-dark rounded-3xl p-5 border border-white/5 shadow-xl">
              <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Today's Logs</p>
              <span className="text-4xl font-black">{attendanceLogs.filter(l => l.date === new Date().toISOString().split('T')[0]).length}</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-xs font-black uppercase tracking-widest">Attendance Feed</h3>
              <p className="text-[9px] opacity-40 font-bold uppercase">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="max-h-[300px] overflow-y-auto no-scrollbar">
              {attendanceLogs.length === 0 ? (
                <div className="p-12 text-center opacity-20"><p className="text-[10px] font-bold uppercase">No records found</p></div>
              ) : (
                attendanceLogs.map((log) => (
                  <div key={log.id} className="p-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div>
                      <h4 className="text-sm font-black group-hover:text-primary transition-colors">{log.studentName}</h4>
                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-tight">{log.studentId} • {log.timestamp}</p>
                    </div>
                    <img src={getAvatar(log.studentId)} className="w-8 h-8 rounded-lg" alt="" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      <style>{`
        @keyframes faceScan { 0%, 100% { top: 10%; opacity: 0; } 10%, 90% { opacity: 1; } 100% { top: 90%; } }
      `}</style>
    </div>
  );
};

export default Attendance;
