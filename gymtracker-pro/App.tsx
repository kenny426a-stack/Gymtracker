
import React, { useState, useEffect, useMemo } from 'react';
import { MuscleGroup, Workout, TRAINING_ORDER } from './types';
import { getStoredWorkouts, saveWorkout, deleteWorkout } from './services/storage';
import { getWorkoutAnalysis } from './services/geminiService';
import WorkoutForm from './components/WorkoutForm';
import WorkoutCalendar from './components/WorkoutCalendar';
import AnalysisView from './components/AnalysisView';
import { Dumbbell, History, TrendingUp, Calendar as CalendarIcon, PlusCircle, Trash2, BarChart3 } from 'lucide-react';

const App: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("正在生成今日健身語錄...");
  const [activeTab, setActiveTab] = useState<'dash' | 'calendar' | 'history' | 'analysis'>('dash');

  useEffect(() => {
    const data = getStoredWorkouts();
    setWorkouts(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (workouts.length > 0) {
        const text = await getWorkoutAnalysis(workouts);
        setAiAnalysis(text);
      } else {
        setAiAnalysis("準備好開始你嘅第一場訓練未？");
      }
    };
    fetchAnalysis();
  }, [workouts]);

  const nextMuscleGroup = useMemo(() => {
    if (workouts.length === 0) return MuscleGroup.CHEST;
    
    // Find the latest workout
    const latest = workouts[0]; // Already sorted by date desc
    const currentIndex = TRAINING_ORDER.indexOf(latest.muscleGroup);
    const nextIndex = (currentIndex + 1) % TRAINING_ORDER.length;
    return TRAINING_ORDER[nextIndex];
  }, [workouts]);

  const handleSaveWorkout = (workout: Workout) => {
    saveWorkout(workout);
    const newData = getStoredWorkouts();
    setWorkouts(newData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setShowForm(false);
    setActiveTab('dash');
  };

  const handleDelete = (id: string) => {
    if (confirm("確定要刪除此訓練紀錄？")) {
      deleteWorkout(id);
      setWorkouts(getStoredWorkouts().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };

  const totalWorkoutsMonth = useMemo(() => {
    const now = new Date();
    return workouts.filter(w => {
      const d = new Date(w.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [workouts]);

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col px-4 pt-8 pb-32">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-black italic tracking-tighter mb-2">GYMTRACKER PRO</h1>
        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
          <p className="text-zinc-400 text-sm mb-1 font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" /> AI 語錄
          </p>
          <p className="text-sm font-semibold text-white">"{aiAnalysis}"</p>
        </div>
      </header>

      {/* Main Action Bar */}
      {!showForm && activeTab === 'dash' && (
        <div className="mb-8">
          <div className="bg-white text-black p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Dumbbell logo removed as requested for a cleaner UI */}
            <p className="text-sm font-bold opacity-60 mb-1">今日訓練目標</p>
            <h2 className="text-4xl font-black mb-4">{nextMuscleGroup} 部位</h2>
            <p className="text-xs font-medium bg-black/5 inline-block px-2 py-1 rounded">次序：胸 → 背 → 腿</p>
            
            <button 
              onClick={() => setShowForm(true)}
              className="mt-6 w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <PlusCircle className="w-5 h-5" /> 開始訓練
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
              <p className="text-zinc-500 text-xs font-bold mb-1">本月訓練次數</p>
              <p className="text-2xl font-black">{totalWorkoutsMonth}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
              <p className="text-zinc-500 text-xs font-bold mb-1">總訓練次數</p>
              <p className="text-2xl font-black">{workouts.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Content */}
      <main className="flex-1">
        {showForm ? (
          <WorkoutForm 
            suggestedMuscle={nextMuscleGroup} 
            history={workouts}
            onSave={handleSaveWorkout} 
            onCancel={() => setShowForm(false)} 
          />
        ) : (
          <>
            {activeTab === 'calendar' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-bold mb-4 px-2">訓練月曆</h2>
                <WorkoutCalendar workouts={workouts} />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-bold mb-4 px-2">歷史紀錄</h2>
                {workouts.length === 0 ? (
                  <div className="text-center py-20 text-zinc-600">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>仲未有紀錄喎，加油！</p>
                  </div>
                ) : (
                  workouts.map(w => (
                    <div key={w.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs text-zinc-500 font-medium">{new Date(w.date).toLocaleDateString('zh-HK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          <h3 className="text-xl font-bold">{w.muscleGroup}部訓練</h3>
                        </div>
                        <button onClick={() => handleDelete(w.id)} className="text-zinc-600 hover:text-red-500 transition">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {w.exercises.map(ex => (
                          <div key={ex.id} className="text-sm">
                            <p className="font-bold text-zinc-300 mb-1">{ex.name}</p>
                            <div className="flex flex-wrap gap-2">
                              {ex.sets.map((s, idx) => (
                                <span key={s.id} className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-400">
                                  {s.weight}kg x {s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'analysis' && (
              <AnalysisView workouts={workouts} />
            )}
            
            {activeTab === 'dash' && (
              <div className="mt-4">
                 <h2 className="text-xl font-bold mb-4 px-2">最近動向</h2>
                 {workouts.slice(0, 3).map(w => (
                    <div key={w.id} className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl mb-3">
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          w.muscleGroup === MuscleGroup.CHEST ? 'bg-blue-600/20 text-blue-500' :
                          w.muscleGroup === MuscleGroup.BACK ? 'bg-emerald-600/20 text-emerald-500' : 'bg-purple-600/20 text-purple-500'
                       }`}>
                          {w.muscleGroup}
                       </div>
                       <div>
                          <p className="text-sm font-bold">{w.exercises.length} 個動作</p>
                          <p className="text-xs text-zinc-500">{new Date(w.date).toLocaleDateString()}</p>
                       </div>
                    </div>
                 ))}
                 
                 <button 
                  onClick={() => setActiveTab('analysis')}
                  className="w-full mt-4 bg-zinc-900 border border-zinc-800 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition group"
                 >
                   <BarChart3 className="w-5 h-5 text-blue-500 group-hover:scale-110 transition" />
                   <span className="font-bold text-zinc-300">查看深度進度分析</span>
                 </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Tab Bar */}
      {!showForm && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-md bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-3xl h-20 flex items-center justify-around px-2 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.5)] z-50">
          <button 
            onClick={() => setActiveTab('dash')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'dash' ? 'text-white scale-110' : 'text-zinc-600'}`}
          >
            <Dumbbell className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest">訓練</span>
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'calendar' ? 'text-white scale-110' : 'text-zinc-600'}`}
          >
            <CalendarIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest">月曆</span>
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'analysis' ? 'text-white scale-110' : 'text-zinc-600'}`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest">分析</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'history' ? 'text-white scale-110' : 'text-zinc-600'}`}
          >
            <History className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest">歷史</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
