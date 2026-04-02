
import React, { useState, useEffect } from 'react';
import { BusRoute } from '../types';

const INITIAL_ROUTES: BusRoute[] = [
  { id: '1', number: 'Route 42A', destination: 'North Campus', status: 'on-time', nextStop: 'Oak Square', eta: '4 mins' },
  { id: '2', number: 'Route 15', destination: 'Main City Center', status: 'delayed', nextStop: 'East Library', eta: '12 mins' },
  { id: '3', number: 'Express B', destination: 'West Resident Hall', status: 'on-time', nextStop: 'Sports Arena', eta: '8 mins' },
];

const STOPS = [
  { id: 's1', name: 'Main Admin Block', x: 50, y: 150 },
  { id: 's2', name: 'Library East', x: 150, y: 50 },
  { id: 's3', name: 'Oak Square', x: 250, y: 100 },
  { id: 's4', name: 'Science Lab', x: 320, y: 160 },
];

const Transport: React.FC = () => {
  const [routes, setRoutes] = useState<BusRoute[]>(INITIAL_ROUTES);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  
  // Route path for SVG
  const routePath = "M 50 150 L 150 50 L 250 100 L 320 160";

  const updateRouteField = (id: string, field: keyof BusRoute, value: string) => {
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Transit Services</h2>
          <p className="text-sm opacity-60">Live Shuttle Tracking</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            isEditing ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-primary border border-primary/20 hover:border-primary/40'
          }`}
        >
          <span className="material-symbols-outlined text-sm">{isEditing ? 'done_all' : 'edit_road'}</span>
          {isEditing ? 'Save Changes' : 'Manage Routes'}
        </button>
      </header>

      {/* Interactive Map Simulation */}
      <div className="relative h-64 w-full rounded-2xl bg-card-dark overflow-hidden border border-white/10 shadow-inner group">
        <svg 
          viewBox="0 0 400 200" 
          className="w-full h-full p-4"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Background Grid Lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(236, 91, 19, 0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Route Path */}
          <path 
            d={routePath} 
            fill="none" 
            stroke="rgba(236, 91, 19, 0.2)" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            strokeDasharray="8 4"
          />

          {/* Animated Bus */}
          <g className="bus-animation">
            <circle r="6" fill="#ec5b13" className="animate-pulse shadow-lg" />
            <circle r="12" fill="rgba(236, 91, 19, 0.2)" className="animate-ping" />
          </g>

          {/* Bus Stops */}
          {STOPS.map((stop) => (
            <g 
              key={stop.id} 
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={() => setSelectedStop(stop.name)}
            >
              <circle 
                cx={stop.x} 
                cy={stop.y} 
                r="5" 
                fill={selectedStop === stop.name ? "#ec5b13" : "#221610"} 
                stroke="#ec5b13" 
                strokeWidth="2" 
              />
              <circle 
                cx={stop.x} 
                cy={stop.y} 
                r="15" 
                fill="transparent" 
              />
            </g>
          ))}
        </svg>

        {/* Selected Stop Overlay */}
        {selectedStop && (
          <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-primary/90 backdrop-blur-md px-4 py-2 rounded-xl text-white shadow-xl flex items-center gap-3">
              <div>
                <p className="text-[10px] uppercase font-bold opacity-80 leading-none mb-1">Stop Info</p>
                <p className="text-xs font-black">{selectedStop}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedStop(null); }}
                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 bg-background-dark/80 backdrop-blur px-3 py-2 rounded-xl border border-white/10 pointer-events-none">
          <p className="text-[10px] font-bold uppercase opacity-50">Global GPS</p>
          <p className="text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {routes[0].number} active near {routes[0].nextStop}
          </p>
        </div>

        <style>{`
          .bus-animation {
            offset-path: path("${routePath}");
            animation: move-bus 20s infinite linear;
          }
          @keyframes move-bus {
            0% { offset-distance: 0%; }
            100% { offset-distance: 100%; }
          }
        `}</style>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-50">Active Route Log</h3>
        {routes.map(route => (
          <div key={route.id} className={`bg-white/5 rounded-2xl p-4 border transition-all flex items-center gap-4 ${isEditing ? 'border-primary ring-1 ring-primary/30 shadow-lg shadow-primary/10' : 'border-white/5'}`}>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-3xl">directions_bus</span>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              {isEditing ? (
                <>
                  <input 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-sm font-bold text-primary outline-none focus:border-primary"
                    value={route.number}
                    placeholder="Route Name/No."
                    onChange={(e) => updateRouteField(route.id, 'number', e.target.value)}
                  />
                  <input 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs opacity-80 outline-none focus:border-primary"
                    value={route.destination}
                    placeholder="Campus Destination"
                    onChange={(e) => updateRouteField(route.id, 'destination', e.target.value)}
                  />
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm">{route.number}</h4>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      route.status === 'delayed' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {route.status}
                    </span>
                  </div>
                  <p className="text-xs opacity-60">Destination: {route.destination}</p>
                </>
              )}
              {!isEditing && (
                <p className="text-[10px] font-medium">Coming next: <span className="text-primary/70">{route.nextStop}</span></p>
              )}
            </div>
            {!isEditing && (
              <div className="text-right">
                <p className="text-lg font-black text-primary">{route.eta}</p>
                <p className="text-[9px] uppercase font-bold opacity-40">Arriving</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <button 
          onClick={() => setIsEditing(false)}
          className="w-full py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/30 animate-in slide-in-from-bottom duration-300 active:scale-95"
        >
          Confirm Route Schedule
        </button>
      )}

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-4">
        <span className="material-symbols-outlined text-primary">info</span>
        <p className="text-[11px] leading-relaxed opacity-80 italic">
          <strong>Fleet Management Mode:</strong> Administrators can modify route identifiers and terminus points. All tracking data synchronizes with the main terminal.
        </p>
      </div>
    </div>
  );
};

export default Transport;
