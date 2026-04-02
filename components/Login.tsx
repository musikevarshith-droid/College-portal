
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

interface LoginProps {
  onLogin: (user: { id: string; role: 'student' | 'admin' }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [id, setId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Face Auth States
  const [isScanning, setIsScanning] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !pin) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate API delay for standard login
    setTimeout(() => {
      setIsLoading(false);
      onLogin({ id, role });
    }, 1200);
  };

  const startFaceAuth = async () => {
    setIsScanning(true);
    setIsVerified(false);
    setError('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          if (videoRef.current) videoRef.current.onloadedmetadata = resolve;
        });
        await videoRef.current.play();
      }

      // Active Liveness simulation - wait for user to focus
      await new Promise(r => setTimeout(r, 2500));

      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        stream.getTracks().forEach(t => t.stop());

        // Use gemini-3-flash-preview for vision-based authentication task
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: `Liveness & Identity Authentication Task:
                1. Check if subject is real (not a photo/screen).
                2. Verify if person matches ${role === 'admin' ? 'Administrator' : 'Student Alex Thompson'}.
                3. Respond 'AUTH_SUCCESS' if verified, 'FAKE_DETECTION' if liveness fails, 'LOW_QUALITY' for poor light, otherwise 'AUTH_FAILED'.` },
              { inlineData: { mimeType: 'image/jpeg', data: imageData } }
            ]
          }
        });

        const result = response.text?.trim() || "AUTH_FAILED";
        
        if (result.includes('AUTH_SUCCESS')) {
          setIsVerified(true);
          // Identity is now visible in UI. Wait 2s then login.
          setTimeout(() => {
            onLogin({ 
              id: role === 'admin' ? 'AD-9901' : '2023-0012', 
              role 
            });
          }, 2000);
        } else {
          setIsScanning(false);
          if (result.includes('FAKE_DETECTION')) setError('Liveness check failed.');
          else if (result.includes('LOW_QUALITY')) setError('Lighting too low.');
          else setError('Biometric mismatch.');
        }
      }
    } catch (err) {
      setError("Camera permission required.");
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-white flex flex-col justify-center items-center px-6">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-primary rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-primary/20 rotate-12">
            <span className="material-symbols-outlined text-4xl text-white -rotate-12">school</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mt-6">FAMES GROUP</h1>
          <p className="text-sm opacity-50 uppercase tracking-widest">Digital Campus Gate</p>
        </div>

        {!isScanning && (
          <div className="bg-white/5 p-1 rounded-2xl flex border border-white/5">
            {['student', 'admin'].map(r => (
              <button
                key={r}
                onClick={() => setRole(r as any)}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all capitalize ${
                  role === r ? 'bg-primary text-white shadow-lg' : 'opacity-50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {isScanning ? (
          <div className="space-y-8 animate-in zoom-in duration-300">
            <div className={`relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 shadow-2xl transition-all duration-700 ${isVerified ? 'border-green-500 scale-110' : 'border-primary/30'}`}>
              {!isVerified ? (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
                  <div className="absolute inset-0 border-[16px] border-background-dark/80 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary/60 shadow-[0_0_15px_rgba(236,91,19,1)] animate-[faceScan_3s_infinite] pointer-events-none"></div>
                </>
              ) : (
                <div className="w-full h-full bg-green-500/10 flex flex-col items-center justify-center animate-in zoom-in duration-500">
                  <span className="material-symbols-outlined text-6xl text-green-500 mb-2">check_circle</span>
                  <div className="bg-green-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">Success</div>
                </div>
              )}
            </div>
            
            <div className="text-center min-h-[80px]">
              {isVerified ? (
                <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                  <h3 className="text-2xl font-black text-white">{role === 'admin' ? 'Director' : 'Alex Thompson'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-primary text-sm">id_card</span>
                    <p className="text-base font-bold text-primary tracking-widest uppercase">
                      ID: {role === 'admin' ? 'AD-9901' : '2023-0012'}
                    </p>
                  </div>
                  <p className="text-[10px] font-bold text-white/40 uppercase mt-4 tracking-widest animate-pulse">Redirecting to Dashboard...</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-primary font-black uppercase text-xs tracking-[0.2em] animate-pulse">Verifying Liveness...</p>
                  <p className="text-[10px] opacity-40">Ensure you are in a well-lit environment</p>
                </div>
              )}
            </div>

            {!isVerified && (
              <button onClick={() => setIsScanning(false)} className="w-full py-3 text-[10px] font-bold uppercase tracking-widest opacity-30 hover:opacity-100">Cancel</button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Identity Number</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-50">badge</span>
                <input type="text" value={id} onChange={e => setId(e.target.value)} placeholder={role === 'student' ? "2023-0012" : "AD-9901"} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-primary transition-all outline-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Access PIN</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-50">lock</span>
                <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" maxLength={6} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 tracking-[0.5em] focus:border-primary transition-all outline-none" />
              </div>
            </div>

            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold text-center uppercase tracking-wider">{error}</div>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isLoading} className="flex-1 py-4 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                {isLoading ? <span className="animate-spin material-symbols-outlined">progress_activity</span> : <><span className="material-symbols-outlined">login</span>Login</>}
              </button>
              <button type="button" onClick={startFaceAuth} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group active:scale-95 transition-all">
                <span className="material-symbols-outlined text-3xl group-hover:scale-110">face</span>
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{`
        @keyframes faceScan { 0%, 100% { top: 10%; opacity: 0; } 10%, 90% { opacity: 1; } 100% { top: 90%; } }
      `}</style>
    </div>
  );
};

export default Login;
