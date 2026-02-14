
import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PeriodEntry, CycleStats, CyclePhase, HealthNote, UserProfile } from './types';
import { calculateStats } from './utils/cycleCalculator';

const SYMPTOMS = [
  { id: 'cramp', label: 'Cólica', icon: 'fa-bolt' },
  { id: 'headache', label: 'Cefaleia', icon: 'fa-head-side-virus' },
  { id: 'bloating', label: 'Inchaço', icon: 'fa-cloud' },
  { id: 'acne', label: 'Acne', icon: 'fa-circle-dot' },
  { id: 'tender_breasts', label: 'Seios', icon: 'fa-person-breastfeeding' },
  { id: 'mood_swings', label: 'Humor', icon: 'fa-masks-theater' },
];

const MOODS = [
  { emoji: "😊", label: "Feliz" }, { emoji: "🥰", label: "Amada" }, { emoji: "🤩", label: "Radiante" },
  { emoji: "🧘", label: "Calma" }, { emoji: "😐", label: "Ok" }, { emoji: "😔", label: "Triste" },
  { emoji: "😠", label: "Brava" }, { emoji: "😴", label: "Exausta" }, { emoji: "😰", label: "Ansiosa" },
];

const DEFAULT_PROFILE: UserProfile = {
  name: '', age: '', goal: 'track', defaultCycleLength: 28, defaultPeriodLength: 5, notificationsEnabled: false
};

const App: React.FC = () => {
  const [entries, setEntries] = useState<PeriodEntry[]>([]);
  const [healthNotes, setHealthNotes] = useState<HealthNote[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile'>('home');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Form states
  const [newPeriodStart, setNewPeriodStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newPeriodDuration, setNewPeriodDuration] = useState(5);
  const [noteText, setNoteText] = useState("");
  const [selectedMood, setSelectedMood] = useState("😊");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Carregar dados
  useEffect(() => {
    const e = localStorage.getItem('luna_entries');
    const n = localStorage.getItem('luna_notes');
    const p = localStorage.getItem('luna_profile');
    if (e) setEntries(JSON.parse(e));
    if (n) setHealthNotes(JSON.parse(n));
    if (p) setProfile(JSON.parse(p));
  }, []);

  // Salvar dados
  useEffect(() => { localStorage.setItem('luna_entries', JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem('luna_notes', JSON.stringify(healthNotes)); }, [healthNotes]);
  useEffect(() => { localStorage.setItem('luna_profile', JSON.stringify(profile)); }, [profile]);

  const stats = useMemo(() => 
    calculateStats(entries, profile.defaultCycleLength, profile.defaultPeriodLength), 
    [entries, profile]
  );

  const daysInMonth = useMemo(() => eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  }), [currentMonth]);

  const handleAddPeriod = () => {
    const end = addDays(parseISO(newPeriodStart), newPeriodDuration - 1);
    const newEntry: PeriodEntry = {
      id: Math.random().toString(36).substr(2, 9),
      startDate: newPeriodStart,
      endDate: format(end, 'yyyy-MM-dd'),
      duration: newPeriodDuration
    };
    setEntries(prev => [...prev, newEntry].sort((a,b) => b.startDate.localeCompare(a.startDate)));
    setShowPeriodModal(false);
  };

  const handleSaveNote = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const newNote: HealthNote = {
      id: Math.random().toString(36).substr(2, 9),
      date: dateStr,
      mood: selectedMood,
      symptoms: selectedSymptoms,
      notes: noteText
    };
    setHealthNotes(prev => {
      const filtered = prev.filter(n => n.date !== dateStr);
      return [...filtered, newNote];
    });
    setShowNoteModal(false);
  };

  const removeEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));
  const removeNote = (id: string) => setHealthNotes(prev => prev.filter(n => n.id !== id));

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto bg-pink-50/20 shadow-2xl relative">
      {/* Header */}
      <header className="gradient-pink p-8 rounded-b-[3.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center relative z-10 mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <i className="fas fa-moon text-lg"></i>
            </div>
            <h1 className="text-2xl font-black tracking-tighter">Luna</h1>
          </div>
          <button onClick={() => setShowPeriodModal(true)} className="bg-white text-pink-500 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
            <i className="fas fa-plus"></i>
          </button>
        </div>

        {stats ? (
          <div className="text-center relative z-10 py-4 animate-in fade-in zoom-in duration-500">
            <div className="inline-block relative mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="transparent" />
                <circle cx="64" cy="64" r="58" stroke="white" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * Math.min(stats.currentDayOfCycle, stats.averageCycleLength)) / stats.averageCycleLength} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black">{stats.currentDayOfCycle}</span>
                <span className="text-[10px] font-bold uppercase opacity-80">Dia</span>
              </div>
            </div>
            <p className="text-xl font-bold glass py-1 px-6 rounded-full inline-block mb-2">{stats.phase}</p>
          </div>
        ) : (
          <div className="text-center py-12 relative z-10 opacity-90">
            <p className="text-lg font-bold">Olá!</p>
            <p className="text-sm">Registre sua última menstruação para começar.</p>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 -mt-8 space-y-6 relative z-20">
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-pink-50 text-center">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Próxima</p>
                  <p className="text-xl font-black text-gray-800">{stats.daysToNextPeriod} dias</p>
                  <p className="text-[10px] font-bold text-pink-300 mt-1">{format(parseISO(stats.nextPeriodDate), 'dd/MM')}</p>
                </div>
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-pink-50 text-center">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Fertilidade</p>
                  <p className="text-xl font-black text-gray-800">{stats.daysToFertileWindow === 0 ? 'Pico' : `Em ${stats.daysToFertileWindow}d`}</p>
                  <p className="text-[10px] font-bold text-blue-300 mt-1">{format(parseISO(stats.ovulationDay), 'dd/MM')}</p>
                </div>
              </div>
            )}

            {/* Calendário */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-pink-50">
              <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-8 h-8 rounded-full bg-pink-50 text-pink-400 flex items-center justify-center"><i className="fas fa-chevron-left text-xs"></i></button>
                <h3 className="font-black text-gray-700 capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-8 h-8 rounded-full bg-pink-50 text-pink-400 flex items-center justify-center"><i className="fas fa-chevron-right text-xs"></i></button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <span key={d} className="text-[10px] font-black text-gray-300 text-center p-2 uppercase">{d}</span>)}
                {daysInMonth.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isToday = isSameDay(day, new Date());
                  const isPeriod = entries.some(e => day >= parseISO(e.startDate) && day <= parseISO(e.endDate));
                  const isPredicted = stats && !isPeriod && (day >= parseISO(stats.nextPeriodDate) && day < addDays(parseISO(stats.nextPeriodDate), stats.averagePeriodLength));
                  const isFertile = stats && (day >= parseISO(stats.fertileWindowStart) && day <= parseISO(stats.fertileWindowEnd));
                  const hasNote = healthNotes.some(n => n.date === dateStr);

                  return (
                    <button key={dateStr} onClick={() => { setSelectedDate(day); setShowNoteModal(true); }} className={`aspect-square flex flex-col items-center justify-center rounded-2xl relative transition-all active:scale-90
                      ${isPeriod ? 'bg-pink-400 text-white shadow-md' : ''}
                      ${isPredicted ? 'bg-pink-100 text-pink-500' : ''}
                      ${isFertile && !isPeriod ? 'bg-blue-50 ring-1 ring-blue-100' : ''}
                      ${isToday && !isPeriod ? 'ring-2 ring-pink-300' : ''}
                    `}>
                      <span className="text-sm font-bold">{format(day, 'd')}</span>
                      {hasNote && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isPeriod ? 'bg-white' : 'bg-pink-300'}`}></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
            <h2 className="text-xl font-black text-gray-800 px-2">Registros</h2>
            {entries.map(e => (
              <div key={e.id} className="bg-white p-5 rounded-3xl shadow-sm border border-pink-50 flex justify-between items-center group">
                <div>
                  <p className="font-bold text-gray-800">{format(parseISO(e.startDate), "dd 'de' MMMM", { locale: ptBR })}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{e.duration} dias de fluxo</p>
                </div>
                <button onClick={() => removeEntry(e.id)} className="w-10 h-10 rounded-xl text-gray-200 hover:text-red-400 hover:bg-red-50 transition-colors">
                  <i className="far fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-pink-50 text-center">
              <div className="w-20 h-20 bg-pink-100 rounded-[2rem] flex items-center justify-center text-pink-500 text-3xl mx-auto mb-4">
                <i className="fas fa-user"></i>
              </div>
              <h3 className="text-xl font-black text-gray-800">{profile.name || 'Usuária'}</h3>
              <p className="text-sm font-bold text-pink-400 uppercase tracking-widest mb-6">{profile.goal === 'conceive' ? 'Engravidar' : profile.goal === 'avoid' ? 'Evitar' : 'Acompanhar'}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-pink-50/50 p-4 rounded-3xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Média Ciclo</p>
                  <p className="text-2xl font-black text-gray-800">{stats?.averageCycleLength || profile.defaultCycleLength}d</p>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-3xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Média Fluxo</p>
                  <p className="text-2xl font-black text-gray-800">{stats?.averagePeriodLength || profile.defaultPeriodLength}d</p>
                </div>
              </div>

              <button onClick={() => { if(confirm('Apagar todos os dados?')) { localStorage.clear(); window.location.reload(); } }} className="text-red-400 font-bold text-sm hover:underline">Resetar Aplicativo</button>
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-gray-100 p-5 flex justify-around items-center rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-pink-500 scale-110' : 'text-gray-300'}`}>
          <i className="fas fa-house-user text-xl"></i>
          <span className="text-[9px] font-black uppercase">Home</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-pink-500 scale-110' : 'text-gray-300'}`}>
          <i className="fas fa-calendar-alt text-xl"></i>
          <span className="text-[9px] font-black uppercase">Dados</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-pink-500 scale-110' : 'text-gray-300'}`}>
          <i className="fas fa-user text-xl"></i>
          <span className="text-[9px] font-black uppercase">Perfil</span>
        </button>
      </nav>

      {/* Modals */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xs rounded-[3rem] p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-gray-800 mb-6 text-center">Registrar Fluxo</h2>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Início</label>
                <input type="date" value={newPeriodStart} onChange={e => setNewPeriodStart(e.target.value)} className="w-full p-4 bg-pink-50/50 rounded-2xl outline-none font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase block mb-1">Duração (Dias)</label>
                <input type="number" value={newPeriodDuration} onChange={e => setNewPeriodDuration(parseInt(e.target.value) || 1)} className="w-full p-4 bg-pink-50/50 rounded-2xl outline-none font-bold" min="1" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPeriodModal(false)} className="flex-1 py-4 bg-gray-50 rounded-3xl font-bold">Voltar</button>
              <button onClick={handleAddPeriod} className="flex-1 py-4 gradient-pink text-white font-black rounded-3xl shadow-lg">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in slide-in-from-bottom duration-400">
          <div className="bg-white w-full max-w-md rounded-t-[3rem] p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800 tracking-tighter">Diário de Saúde</h2>
              <button onClick={() => setShowNoteModal(false)} className="text-gray-300 hover:text-gray-500"><i className="fas fa-times"></i></button>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between bg-pink-50/50 p-4 rounded-3xl overflow-x-auto gap-3">
                {MOODS.map(m => (
                  <button key={m.emoji} onClick={() => setSelectedMood(m.emoji)} className={`text-2xl p-2 rounded-2xl transition-all ${selectedMood === m.emoji ? 'bg-white shadow-md scale-110' : 'opacity-40'}`}>{m.emoji}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SYMPTOMS.map(s => (
                  <button key={s.id} onClick={() => setSelectedSymptoms(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id])} className={`p-4 rounded-2xl border-2 text-xs font-bold flex items-center gap-2 ${selectedSymptoms.includes(s.id) ? 'bg-pink-50 border-pink-200 text-pink-500' : 'border-transparent bg-gray-50'}`}>
                    <i className={`fas ${s.icon}`}></i> {s.label}
                  </button>
                ))}
              </div>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Como você se sente?" className="w-full p-4 bg-gray-50 rounded-3xl h-32 outline-none font-medium text-sm" />
              <button onClick={handleSaveNote} className="w-full py-5 gradient-pink text-white font-black rounded-3xl shadow-lg">Salvar Notas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
