
import React, { useEffect, useState, useMemo } from 'react';
import { Workout } from '../types';
import { getDetailedProgressAnalysis } from '../services/geminiService';
import { TrendingUp, Award, Zap, Loader2 } from 'lucide-react';

interface AnalysisViewProps {
  workouts: Workout[];
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ workouts }) => {
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState("");

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

  useEffect(() => {
    if (workouts.length > 0) {
      const fetchAnalysis = async () => {
        setLoading(true);
        const text = await getDetailedProgressAnalysis(workouts);
        setAnalysisText(text);
        setLoading(false);
      };
      fetchAnalysis();
    }
  }, [workouts]);

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
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold text-lg">深度進度分析</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-sm">正在分析你的數據...</p>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-zinc-300 space-y-2 whitespace-pre-wrap">
            {analysisText}
          </div>
        )}
      </div>

      <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl">
        <p className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">教練建議</p>
        <p className="text-sm text-blue-100">持續維持「胸、背、腿」循環。每兩週嘗試將動作重量提升 2.5kg 以觸發漸進式超負荷。</p>
      </div>
    </div>
  );
};

export default AnalysisView;
