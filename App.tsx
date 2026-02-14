
import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PeriodEntry, CycleStats, CyclePhase, HealthNote, UserProfile } from './types';
import { calculateStats } from './utils/cycleCalculator';

const SYMPTOMS_LIST = [
  { id: 'cramp', label: 'Cólica', icon: 'fa-bolt' },
  { id: 'headache', label: 'Dor de Cabeça', icon: 'fa-head-side-virus' },
  { id: 'bloating', label: 'Inchaço', icon: 'fa-cloud' },
  { id: 'acne', label: 'Acne', icon: 'fa-circle-dot' },
  { id: 'tender_breasts', label: 'Seios Sensíveis', icon: 'fa-person-breastfeeding' },
  { id: 'back_pain', label: 'Dor Lombar', icon: 'fa-bone' },
];

const MOODS = [
  { emoji: "😊", label: "Feliz" },
  { emoji: "🥰", label: "Amada" },
  { emoji: "🤩", label: "Radiante" },
  { emoji: "🧘", label: "Calma" },
  { emoji: "😐", label: "Ok" },
  { emoji: "😔", label: "Triste" },
  { emoji: "😠", label: "Brava" },
  { emoji: "😴", label: "Exausta" },
  { emoji: "😰", label: "Ansiosa" },
  { emoji: "🤒", label: "Mal" },
  { emoji: "🥳", label: "Festa" },
  { emoji: "😭", label: "Sensível" },
  { emoji: "🫠", label: "Derretendo" },
  { emoji: "🍕", label: "Fome" },
  { emoji: "💃", label: "Ativa" },
];

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: '',
  goal: 'track',
  defaultCycleLength: 28,
  defaultPeriodLength: 5,
  notificationsEnabled: false
};

const getGoalLabel = (goal: UserProfile['goal']) => {
  switch (goal) {
    case 'track': return 'Acompanhar ciclo';
    case 'conceive': return 'Engravidar';
    case 'avoid': return 'Evitar gravidez';
    default: return '';
  }
};

const App: React.FC = () => {
  const [entries, setEntries] = useState<PeriodEntry[]>([]);
  const [healthNotes, setHealthNotes] = useState<HealthNote[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [stats, setStats] = useState<CycleStats | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile'>('home');
  const [historySubTab, setHistorySubTab] = useState<'periods' | 'notes'>('periods');
  
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Period Entry Modal States
  const [newPeriodStart, setNewPeriodStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newPeriodEnd, setNewPeriodEnd] = useState(format(addDays(new Date(), 4), 'yyyy-MM-dd'));
  const [newPeriodDuration, setNewPeriodDuration] = useState(5);

  const [noteText, setNoteText] = useState("");
  const [selectedMood, setSelectedMood] = useState("😊");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [tempProfile, setTempProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // Persistence
  useEffect(() => {
    const savedEntries = localStorage.getItem('luna_entries');
    const savedNotes = localStorage.getItem('luna_notes');
    const savedProfile = localStorage.getItem('luna_profile');
    if (savedEntries) setEntries(JSON.parse(savedEntries));
    if (savedNotes) setHealthNotes(JSON.parse(savedNotes));
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfile(parsedProfile);
      setTempProfile(parsedProfile);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('luna_entries', JSON.stringify(entries));
    const newStats = calculateStats(entries, profile.defaultCycleLength, profile.defaultPeriodLength);
    setStats(newStats);
  }, [entries, profile]);

  useEffect(() => {
    localStorage.setItem('luna_notes', JSON.stringify(healthNotes));
  }, [healthNotes]);

  useEffect(() => {
    localStorage.setItem('luna_profile', JSON.stringify(profile));
  }, [profile]);

  // Sync Duration when Start/End changes in Modal
  useEffect(() => {
    if (newPeriodStart && newPeriodEnd) {
      const diff = differenceInDays(parseISO(newPeriodEnd), parseISO(newPeriodStart)) + 1;
      if (diff > 0 && diff !== newPeriodDuration) {
        setNewPeriodDuration(diff);
      }
    }
  }, [newPeriodStart, newPeriodEnd]);

  const handleDurationChange = (val: number) => {
    const safeVal = Math.max(1, isNaN(val) ? 1 : val);
    setNewPeriodDuration(safeVal);
    if (newPeriodStart) {
      const newEnd = addDays(parseISO(newPeriodStart), safeVal - 1);
      setNewPeriodEnd(format(newEnd, 'yyyy-MM-dd'));
    }
  };

  const addEntry = () => {
    if (!newPeriodStart) return;
    const duration = Math.max(1, newPeriodDuration);
    const newEntry: PeriodEntry = {
      id: Math.random().toString(36).substr(2, 9),
      startDate: newPeriodStart,
      endDate: newPeriodEnd,
      duration: duration,
    };
    if (entries.some(e => e.startDate === newPeriodStart)) {
      alert("Já existe um registro para esta data de início.");
      return;
    }
    setEntries(prev => [...prev, newEntry].sort((a, b) => b.startDate.localeCompare(a.startDate)));
    setShowPeriodModal(false);
  };

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const saveNote = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingIndex = healthNotes.findIndex(n => n.date === dateStr);
    
    const newNote: HealthNote = {
      id: existingIndex >= 0 ? healthNotes[existingIndex].id : Math.random().toString(36).substr(2, 9),
      date: dateStr,
      mood: selectedMood,
      symptoms: selectedSymptoms,
      notes: noteText
    };

    if (existingIndex >= 0) {
      const updated = [...healthNotes];
      updated[existingIndex] = newNote;
      setHealthNotes(updated);
    } else {
      setHealthNotes(prev => [...prev, newNote]);
    }
    setShowNoteModal(false);
  };

  const removeEntry = (id: string) => {
    if (window.confirm("Deseja excluir este registro de menstruação?")) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const removeNote = (id: string) => {
    if (window.confirm("Deseja excluir esta nota de saúde?")) {
      setHealthNotes(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleSaveProfile = () => {
    setProfile(tempProfile);
    setIsEditingProfile(false);
  };

  const daysInMonth = useMemo(() => eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  }), [currentMonth]);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    const existing = healthNotes.find(n => n.date === format(day, 'yyyy-MM-dd'));
    if (existing) {
      setNoteText(existing.notes);
      setSelectedMood(existing.mood);
      setSelectedSymptoms(existing.symptoms || []);
    } else {
      setNoteText("");
      setSelectedMood("😊");
      setSelectedSymptoms([]);
    }
    setShowNoteModal(true);
  };

  const getPhaseInfo = (phase: CyclePhase) => {
    switch(phase) {
      case CyclePhase.MENSTRUAL: return "Seu corpo está se renovando. Priorize descanso, chás quentes e hidratação.";
      case CyclePhase.FOLLICULAR: return "Energia subindo! Bom momento para novos projetos e atividades físicas.";
      case CyclePhase.OVULATORY: return "Pico de fertilidade e sociabilidade. Você pode se sentir mais radiante.";
      case CyclePhase.LUTEAL: return "Momento de introspecção e cuidado. Reduza o ritmo se sentir sensibilidade.";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto bg-pink-50/20 font-sans selection:bg-pink-100 selection:text-pink-600">
      <header className="gradient-pink p-8 rounded-b-[3.5rem] shadow-xl text-white transition-all relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
              <i className="fas fa-moon text-xl"></i>
            </div>
            <h1 className="text-2xl font-black tracking-tighter">Luna</h1>
          </div>
          <button 
            onClick={() => setShowPeriodModal(true)} 
            className="bg-white text-pink-500 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform hover:bg-pink-50"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>

        {stats ? (
          <div className="text-center py-2 animate-in fade-in slide-in-from-top-4 duration-700 relative z-10">
            <div className="flex justify-center mb-2">
               <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="64" cy="64" r="58" stroke="white" strokeWidth="8" fill="transparent"
                      strokeDasharray={364}
                      strokeDashoffset={364 - (364 * Math.min(stats.currentDayOfCycle, stats.averageCycleLength)) / stats.averageCycleLength}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black">{stats.currentDayOfCycle}</span>
                    <span className="text-[10px] uppercase font-bold opacity-80">Dia</span>
                  </div>
               </div>
            </div>
            <p className="text-xl font-bold bg-white/20 backdrop-blur-md py-1 px-6 rounded-full inline-block mb-2">{stats.phase}</p>
            <p className="text-[11px] opacity-90 max-w-[250px] mx-auto leading-relaxed italic">{getPhaseInfo(stats.phase)}</p>
          </div>
        ) : (
          <div className="text-center py-10 animate-pulse relative z-10">
            <p className="text-lg font-bold">Boas-vindas à Luna!</p>
            <p className="text-sm opacity-80 mt-1 px-8 leading-relaxed">Clique no "+" para registrar seu primeiro período e começar.</p>
          </div>
        )}
        <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </header>

      <main className="px-4 -mt-8 space-y-6 relative z-20">
        {activeTab === 'home' && (
          <>
            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-pink-100 flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center mb-2"><i className="fas fa-droplet"></i></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Próxima</p>
                  <p className={`text-xl font-black ${stats.daysToNextPeriod < 0 ? 'text-red-400' : 'text-gray-800'}`}>
                    {stats.daysToNextPeriod === 0 ? "Hoje" : stats.daysToNextPeriod < 0 ? `${Math.abs(stats.daysToNextPeriod)}d Atraso` : `Em ${stats.daysToNextPeriod} dias`}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 mt-1">{format(parseISO(stats.nextPeriodDate), 'dd/MM')}</p>
                </div>
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-pink-100 flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center mb-2"><i className="fas fa-sparkles"></i></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Fértil</p>
                  <p className="text-xl font-black text-gray-800">{stats.daysToFertileWindow === 0 ? "Janela Aberta" : `Em ${stats.daysToFertileWindow} dias`}</p>
                  <p className="text-[9px] font-bold text-gray-400 mt-1">Pico: {format(parseISO(stats.ovulationDay), 'dd/MM')}</p>
                </div>
              </div>
            )}

            <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-pink-100">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-8 h-8 rounded-full bg-pink-50 text-pink-400 flex items-center justify-center"><i className="fas fa-chevron-left text-xs"></i></button>
                <h3 className="font-black text-gray-700 capitalize tracking-tight text-lg">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-8 h-8 rounded-full bg-pink-50 text-pink-400 flex items-center justify-center"><i className="fas fa-chevron-right text-xs"></i></button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center mb-4">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (<span key={d} className="text-[10px] font-black text-gray-400 uppercase">{d}</span>))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {daysInMonth.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const hasNote = healthNotes.some(n => n.date === dateStr);
                  const isToday = isSameDay(day, new Date());
                  const isPeriod = entries.some(e => {
                    const start = parseISO(e.startDate);
                    const diff = differenceInDays(day, start);
                    return diff >= 0 && diff < e.duration;
                  });
                  const isPredicted = stats && !isPeriod && (() => {
                    const next = parseISO(stats.nextPeriodDate);
                    const diff = differenceInDays(day, next);
                    return diff >= 0 && diff < stats.averagePeriodLength;
                  })();
                  const isFertile = stats && (() => {
                    const start = parseISO(stats.fertileWindowStart);
                    const end = parseISO(stats.fertileWindowEnd);
                    return day >= start && day <= end;
                  })();
                  const isOvulation = stats && isSameDay(day, parseISO(stats.ovulationDay));

                  return (
                    <button key={dateStr} onClick={() => handleDayClick(day)} className={`aspect-square flex flex-col items-center justify-center rounded-2xl relative transition-all active:scale-90
                        ${isPeriod ? 'bg-pink-400 text-white shadow-md' : ''}
                        ${isPredicted ? 'bg-pink-100 text-pink-600' : ''}
                        ${isFertile && !isPeriod ? 'ring-2 ring-blue-100 bg-blue-50/40' : ''}
                        ${isToday && !isPeriod ? 'ring-2 ring-pink-500 ring-offset-2' : ''}
                        ${!isPeriod && !isPredicted && !isFertile ? 'hover:bg-gray-50' : ''}
                      `}>
                      <span className="text-sm font-bold">{format(day, 'd')}</span>
                      {isOvulation && <div className="absolute -top-1 -right-1 text-[10px] text-purple-500"><i className="fas fa-heart"></i></div>}
                      {hasNote && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isPeriod ? 'bg-white' : 'bg-pink-300'}`}></div>}
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black text-gray-800 tracking-tight">Histórico</h2>
              <div className="flex bg-pink-50 rounded-2xl p-1">
                <button onClick={() => setHistorySubTab('periods')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${historySubTab === 'periods' ? 'bg-white text-pink-500 shadow-sm' : 'text-pink-300'}`}>Ciclos</button>
                <button onClick={() => setHistorySubTab('notes')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${historySubTab === 'notes' ? 'bg-white text-pink-500 shadow-sm' : 'text-pink-300'}`}>Notas</button>
              </div>
            </div>

            {historySubTab === 'periods' ? (
              entries.length === 0 ? <p className="text-center text-gray-400 py-20">Nenhum registro ainda.</p> : (
                <div className="space-y-3">
                  {entries.map(e => (
                    <div key={e.id} className="bg-white p-5 rounded-3xl shadow-sm border border-pink-50 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800">{format(parseISO(e.startDate), "dd 'de' MMMM", { locale: ptBR })}</p>
                        <p className="text-xs text-gray-400 font-bold uppercase">{e.duration} dias de fluxo</p>
                      </div>
                      <button onClick={() => removeEntry(e.id)} className="text-gray-200 hover:text-red-400"><i className="far fa-trash-alt"></i></button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              healthNotes.length === 0 ? <p className="text-center text-gray-400 py-20">Nenhuma nota registrada.</p> : (
                <div className="space-y-3">
                  {healthNotes.sort((a,b) => b.date.localeCompare(a.date)).map(n => (
                    <div key={n.id} className="bg-white p-5 rounded-3xl shadow-sm border border-pink-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{n.mood}</span>
                          <div>
                            <p className="font-bold text-gray-800">{format(parseISO(n.date), "dd/MM")}</p>
                            <p className="text-[10px] font-black uppercase text-pink-400">{n.symptoms.length} sintomas</p>
                          </div>
                        </div>
                        <button onClick={() => removeNote(n.id)} className="text-gray-200 hover:text-red-400"><i className="far fa-trash-alt"></i></button>
                      </div>
                      {n.notes && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl italic">"{n.notes}"</p>}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black text-gray-800 tracking-tight">Seu Perfil</h2>
              {!isEditingProfile && <button onClick={() => setIsEditingProfile(true)} className="text-pink-500 text-sm font-bold bg-pink-50 px-4 py-2 rounded-xl">Editar</button>}
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-pink-100 space-y-8">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <input type="text" placeholder="Seu nome" value={tempProfile.name} onChange={e => setTempProfile({...tempProfile, name: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                  <select value={tempProfile.goal} onChange={e => setTempProfile({...tempProfile, goal: e.target.value as any})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold">
                    <option value="track">Acompanhar ciclo</option>
                    <option value="conceive">Engravidar</option>
                    <option value="avoid">Evitar gravidez</option>
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Ciclo Médio" value={tempProfile.defaultCycleLength} onChange={e => setTempProfile({...tempProfile, defaultCycleLength: parseInt(e.target.value) || 28})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                    <input type="number" placeholder="Período Médio" value={tempProfile.defaultPeriodLength} onChange={e => setTempProfile({...tempProfile, defaultPeriodLength: parseInt(e.target.value) || 5})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold">Cancelar</button>
                    <button onClick={handleSaveProfile} className="flex-1 py-4 gradient-pink text-white rounded-2xl font-black shadow-lg">Salvar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-tr from-pink-400 to-pink-200 rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-lg ring-4 ring-pink-50"><i className="fas fa-user"></i></div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-800">{profile.name || "Usuária Luna"}</h3>
                        <p className="text-sm font-bold text-pink-400 uppercase tracking-widest">{getGoalLabel(profile.goal)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-pink-50/50 p-4 rounded-3xl text-center"><p className="text-[10px] font-black uppercase text-gray-400">Ciclo Médio</p><p className="text-2xl font-black text-gray-800">{stats?.averageCycleLength || profile.defaultCycleLength}d</p></div>
                      <div className="bg-blue-50/50 p-4 rounded-3xl text-center"><p className="text-[10px] font-black uppercase text-gray-400">Fluxo Médio</p><p className="text-2xl font-black text-gray-800">{stats?.averagePeriodLength || profile.defaultPeriodLength}d</p></div>
                  </div>
                  <button onClick={() => { if(window.confirm("Limpar todos os dados locais?")) { localStorage.clear(); window.location.reload(); }}} className="w-full py-4 text-red-400 font-bold border-2 border-red-50 rounded-2xl">Resetar Aplicativo</button>
                  <div className="text-center"><p className="text-[10px] text-gray-300 uppercase font-black tracking-widest">Luna • 100% Local e Privado</p></div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-xl border-t border-gray-100 px-10 py-5 flex justify-between items-center rounded-t-[3rem] shadow-[0_-15px_40px_rgba(0,0,0,0.05)] z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-pink-500 scale-110' : 'text-gray-300'}`}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${activeTab === 'home' ? 'bg-pink-50' : ''}`}><i className="fas fa-house-user text-xl"></i></div>
          <span className="text-[9px] font-black uppercase">Início</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-pink-500 scale-110' : 'text-gray-300'}`}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${activeTab === 'history' ? 'bg-pink-50' : ''}`}><i className="fas fa-calendar-alt text-xl"></i></div>
          <span className="text-[9px] font-black uppercase">Histórico</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-pink-500 scale-110' : 'text-gray-300'}`}>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${activeTab === 'profile' ? 'bg-pink-50' : ''}`}><i className="fas fa-user text-xl"></i></div>
          <span className="text-[9px] font-black uppercase">Perfil</span>
        </button>
      </nav>

      {showPeriodModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-black text-gray-800 mb-6">Novo Registro</h2>
            <div className="space-y-5 mb-8">
              <input type="date" value={newPeriodStart} onChange={e => setNewPeriodStart(e.target.value)} className="w-full p-4 bg-pink-50/50 rounded-2xl border-2 border-transparent focus:border-pink-200 outline-none font-bold" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={newPeriodEnd} onChange={e => setNewPeriodEnd(e.target.value)} className="w-full p-4 bg-pink-50/50 rounded-2xl outline-none font-bold" />
                <div className="flex items-center bg-pink-50/50 rounded-2xl px-4 font-bold">
                   <input type="number" value={newPeriodDuration} onChange={e => handleDurationChange(parseInt(e.target.value))} className="w-full bg-transparent outline-none" min="1" />
                   <span className="text-[10px] text-pink-300">DIAS</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPeriodModal(false)} className="flex-1 py-5 bg-gray-100 rounded-3xl font-bold">Cancelar</button>
              <button onClick={addEntry} className="flex-1 py-5 gradient-pink text-white font-black rounded-3xl shadow-xl">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-t-[3.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-400 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800">Saúde & Bem-estar</h2>
              <button onClick={() => setShowNoteModal(false)} className="text-gray-300"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map(m => (
                  <button key={m.emoji} onClick={() => setSelectedMood(m.emoji)} className={`p-2 rounded-2xl transition-all ${selectedMood === m.emoji ? 'bg-pink-100 ring-2 ring-pink-200' : 'opacity-40'}`}>
                    <span className="text-2xl">{m.emoji}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SYMPTOMS_LIST.map(s => (
                  <button key={s.id} onClick={() => toggleSymptom(s.id)} className={`p-3 rounded-2xl border-2 text-xs font-bold flex items-center gap-2 ${selectedSymptoms.includes(s.id) ? 'bg-pink-50 border-pink-200 text-pink-500' : 'border-gray-50'}`}>
                    <i className={`fas ${s.icon}`}></i>{s.label}
                  </button>
                ))}
              </div>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Notas adicionais..." className="w-full p-4 bg-gray-50 rounded-2xl h-24 outline-none font-medium" />
              <button onClick={saveNote} className="w-full py-5 gradient-pink text-white rounded-3xl font-black shadow-lg">Salvar Notas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
