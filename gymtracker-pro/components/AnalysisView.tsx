
import React, { useEffect, useState, useMemo } from 'react';
import { Workout, MuscleGroup } from '../types';
import { getDetailedProgressAnalysis } from '../services/geminiService';
import { TrendingUp, Award, Zap, Loader2, RefreshCw, AlertCircle, LineChart as ChartIcon, Calendar } from 'lucide-react';

interface AnalysisViewProps {
  workouts: Workout[];
}

interface AnalysisCache {
  workoutCount: number;
  lastWorkoutId: string | null;
  text: string;
  timestamp: number;
}

const CACHE_KEY = 'gym_tracker_analysis_cache';

type MetricType = 'weight' | 'volume';

const AnalysisView: React.FC<AnalysisViewProps> = ({ workouts }) => {
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [metric, setMetric] = useState<MetricType>('weight');

  // Process data for the chart
  const chartData = useMemo(() => {
    if (workouts.length < 2) return null;

    // Sort by date ascending for the chart
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const groups = {
      [MuscleGroup.CHEST]: [] as { date: Date, weight: number, volume: number }[],
      [MuscleGroup.BACK]: [] as { date: Date, weight: number, volume: number }[],
      [MuscleGroup.LEGS]: [] as { date: Date, weight: number, volume: number }[],
    };

    sortedWorkouts.forEach(w => {
      let volume = 0;
      let maxWeight = 0;
      w.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          volume += (s.weight * s.reps);
          if (s.weight > maxWeight) maxWeight = s.weight;
        });
      });
      groups[w.muscleGroup].push({ date: new Date(w.date), weight: maxWeight, volume });
    });

    // Get max value for Y scaling based on selected metric
    let maxValue = 0;
    Object.values(groups).forEach(g => {
      g.forEach(d => { 
        const val = metric === 'weight' ? d.weight : d.volume;
        if (val > maxValue) maxValue = val; 
      });
    });

    return { groups, maxValue: maxValue * 1.2 }; // 20% padding
  }, [workouts, metric]);

  const stats = useMemo(() => {
    if (workouts.length === 0) return null;

    let totalVolume = 0;
    let maxWeight = 0;
    
    workouts.forEach(w => {
      w.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          totalVolume += (s.weight * s.reps);
          if (s.weight > maxWeight) maxWeight = s.weight;
        });
      });
    });

    const lastWorkout = workouts[0];
    let lastVolume = 0;
    lastWorkout.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        lastVolume += (s.weight * s.reps);
      });
    });

    return { totalVolume, maxWeight, lastVolume };
  }, [workouts]);

  const fetchAnalysis = async (force = false) => {
    if (workouts.length === 0) return;

    const cached = localStorage.getItem(CACHE_KEY);
    const lastWorkoutId = workouts[0]?.id || null;
    
    if (!force && cached) {
      const cacheData: AnalysisCache = JSON.parse(cached);
      if (cacheData.workoutCount === workouts.length && cacheData.lastWorkoutId === lastWorkoutId) {
        setAnalysisText(cacheData.text);
        setLastUpdated(cacheData.timestamp);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const text = await getDetailedProgressAnalysis(workouts);
      if (text.includes("RESOURCE_EXHAUSTED") || text.includes("quota")) {
        throw new Error("API 配額已用完，請稍後再試。");
      }
      setAnalysisText(text);
      const now = Date.now();
      setLastUpdated(now);
      const newCache: AnalysisCache = {
        workoutCount: workouts.length,
        lastWorkoutId: lastWorkoutId,
        text: text,
        timestamp: now
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
    } catch (err: any) {
      setError(err.message || "分析過程中出現錯誤。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [workouts]);

  // Chart Component Render Helper
  const renderLineChart = () => {
    if (!chartData) return (
      <div className="h-48 flex items-center justify-center text-zinc-600 text-xs italic border border-dashed border-zinc-800 rounded-2xl">
        需要至少兩次訓練紀錄來產生趨勢圖表
      </div>
    );

    const width = 340;
    const height = 200;
    const paddingLeft = 45;
    const paddingBottom = 35;
    const paddingTop = 10;
    const paddingRight = 10;

    const getX = (index: number, total: number) => paddingLeft + (index * (width - paddingLeft - paddingRight) / Math.max(total - 1, 1));
    const getY = (value: number) => height - paddingBottom - (value * (height - paddingBottom - paddingTop) / (chartData.maxValue || 1));

    return (
      <div className="relative mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* X & Y Axis */}
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#27272a" strokeWidth="1" />
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="#27272a" strokeWidth="1" />
          
          {/* Y Axis Labels (Value) */}
          {[0, 0.5, 1].map((tick) => {
            const val = Math.round(chartData.maxValue * tick);
            const yPos = getY(val);
            return (
              <g key={tick}>
                <line x1={paddingLeft - 3} y1={yPos} x2={paddingLeft} y2={yPos} stroke="#3f3f46" strokeWidth="1" />
                <text x={paddingLeft - 8} y={yPos + 4} textAnchor="end" className="fill-zinc-600 text-[10px] font-medium">
                  {val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}
                </text>
              </g>
            );
          })}

          {/* Render Lines */}
          {Object.entries(chartData.groups).map(([muscle, data]) => {
            if (data.length < 1) return null;
            
            const color = muscle === MuscleGroup.CHEST ? '#3b82f6' : muscle === MuscleGroup.BACK ? '#10b981' : '#a855f7';
            const points = data.map((d, i) => {
              const val = metric === 'weight' ? d.weight : d.volume;
              return `${getX(i, data.length)},${getY(val)}`;
            }).join(' ');
            
            return (
              <g key={muscle}>
                {/* Area fill */}
                <polyline
                  points={`${getX(0, data.length)},${height - paddingBottom} ${points} ${getX(data.length - 1, data.length)},${height - paddingBottom}`}
                  fill={color}
                  fillOpacity="0.05"
                  stroke="none"
                />
                {/* Main line */}
                <polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm transition-all duration-500"
                />
                {/* Dots & Date Labels */}
                {data.map((d, i) => {
                  const val = metric === 'weight' ? d.weight : d.volume;
                  const x = getX(i, data.length);
                  const y = getY(val);
                  const dateStr = `${d.date.getMonth() + 1}/${d.date.getDate()}`;
                  
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="3" fill="#000" stroke={color} strokeWidth="1.5" />
                      {/* Date label - show for first, last, and every 2nd if many */}
                      {(i === 0 || i === data.length - 1 || data.length < 6) && (
                        <text 
                          x={x} 
                          y={height - paddingBottom + 18} 
                          textAnchor="middle" 
                          className="fill-zinc-500 text-[9px] font-bold"
                        >
                          {dateStr}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
        
        <div className="flex justify-between mt-6 px-2">
          {Object.values(MuscleGroup).map(m => (
            <div key={m} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                m === MuscleGroup.CHEST ? 'bg-blue-500' : m === MuscleGroup.BACK ? 'bg-emerald-500' : 'bg-purple-500'
              }`}></div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                {m}部{metric === 'weight' ? '最高重量' : '總容量'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (workouts.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-600">
        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p>需要更多紀錄才能分析你的進度。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
      {/* Chart Section */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-zinc-400" />
            <h3 className="font-bold text-lg">進度趨勢圖表</h3>
          </div>
          
          {/* Metric Toggle */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button 
              onClick={() => setMetric('weight')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${metric === 'weight' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}
            >
              重量
            </button>
            <button 
              onClick={() => setMetric('volume')}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${metric === 'volume' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}
            >
              容量
            </button>
          </div>
        </div>
        
        {renderLineChart()}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl">
          <Zap className="w-5 h-5 text-yellow-500 mb-2" />
          <p className="text-zinc-500 text-xs font-bold mb-1">上場訓練容量</p>
          <p className="text-2xl font-black">{stats?.lastVolume.toLocaleString()} <span className="text-xs font-normal text-zinc-500">kg</span></p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-2xl">
          <Award className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-zinc-500 text-xs font-bold mb-1">歷史最高重量</p>
          <p className="text-2xl font-black">{stats?.maxWeight} <span className="text-xs font-normal text-zinc-500">kg</span></p>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-lg">深度進度分析</h3>
          </div>
          <button 
            onClick={() => fetchAnalysis(true)} 
            disabled={loading}
            className="p-2 hover:bg-zinc-900 rounded-full transition text-zinc-500 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold">分析失敗</p>
              <p className="text-xs opacity-80">{error}</p>
              <button onClick={() => fetchAnalysis(true)} className="mt-2 text-xs font-bold underline">重試</button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-sm">教練正在細閱數據...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="prose prose-invert prose-sm max-w-none text-zinc-300 space-y-2 whitespace-pre-wrap">
              {analysisText}
            </div>
            {lastUpdated && (
              <p className="text-[10px] text-zinc-600 text-right italic">
                最後更新: {new Date(lastUpdated).toLocaleTimeString('zh-HK')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl">
        <p className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">教練建議</p>
        <p className="text-sm text-blue-100">持續維持「胸、背、腿」循環。點擊上方切換「重量」可追蹤純力量增長。</p>
      </div>
    </div>
  );
};

export default AnalysisView;
