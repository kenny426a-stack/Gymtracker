
import React, { useState, useEffect } from 'react';
import { MuscleGroup, Workout, Exercise, SetEntry } from '../types';
import { Plus, Trash2, Save, X, RotateCcw } from 'lucide-react';

interface WorkoutFormProps {
  suggestedMuscle: MuscleGroup;
  history: Workout[];
  onSave: (workout: Workout) => void;
  onCancel: () => void;
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ suggestedMuscle, history, onSave, onCancel }) => {
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(suggestedMuscle);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Memory feature: When muscleGroup changes, find the last workout of that type
  useEffect(() => {
    const lastMatchingWorkout = history.find(w => w.muscleGroup === muscleGroup);
    if (lastMatchingWorkout && exercises.length === 0) {
      const templateExercises: Exercise[] = lastMatchingWorkout.exercises.map(ex => ({
        id: crypto.randomUUID(),
        name: ex.name,
        // We populate with the same number of sets, but reset weight/reps to placeholders or defaults
        // Or keep reps from last time as a target
        sets: ex.sets.map(s => ({
          id: crypto.randomUUID(),
          reps: s.reps,
          weight: 0 // Reset weight so user has to enter it, or keep it as 0 to avoid false data
        }))
      }));
      setExercises(templateExercises);
    } else if (!lastMatchingWorkout && exercises.length === 0) {
      // If no history, just add one empty exercise to start
      addExercise();
    }
  }, [muscleGroup]);

  const addExercise = () => {
    const newEx: Exercise = {
      id: crypto.randomUUID(),
      name: '',
      sets: [{ id: crypto.randomUUID(), reps: 10, weight: 0 }]
    };
    setExercises([...exercises, newEx]);
  };

  const updateExerciseName = (exId: string, name: string) => {
    setExercises(exercises.map(ex => ex.id === exId ? { ...ex, name } : ex));
  };

  const addSet = (exId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: [...ex.sets, { id: crypto.randomUUID(), reps: 10, weight: 0 }]
        };
      }
      return ex;
    }));
  };

  const updateSet = (exId: string, setId: string, field: 'reps' | 'weight', value: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return ex;
    }));
  };

  const removeExercise = (exId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exId));
  };

  const handleSave = () => {
    if (exercises.length === 0 || exercises.some(ex => !ex.name)) {
      alert("請輸入動作名稱！");
      return;
    }
    const workout: Workout = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      muscleGroup,
      exercises
    };
    onSave(workout);
  };

  const resetExercises = () => {
    if (confirm("確定要清空並重新載入上次動作？")) {
      setExercises([]);
      // The useEffect will trigger and reload the template
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">新訓練紀錄</h2>
        <button onClick={onCancel} className="text-zinc-500 hover:text-white transition">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-zinc-400 mb-2">訓練部位</label>
          <div className="flex gap-2">
            {[MuscleGroup.CHEST, MuscleGroup.BACK, MuscleGroup.LEGS].map(m => (
              <button
                key={m}
                onClick={() => {
                  if (m !== muscleGroup) {
                    if (exercises.length > 0 && exercises.some(ex => ex.name)) {
                      if (confirm("切換部位會重置已輸入的動作，是否繼續？")) {
                        setExercises([]);
                        setMuscleGroup(m);
                      }
                    } else {
                      setExercises([]);
                      setMuscleGroup(m);
                    }
                  }
                }}
                className={`flex-1 py-3 rounded-xl border transition ${
                  muscleGroup === m 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {muscleGroup !== suggestedMuscle && (
            <p className="mt-2 text-xs text-yellow-500/80">提示：今日原本應該練「{suggestedMuscle}」</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">訓練動作</h3>
            <div className="flex gap-2">
              <button 
                onClick={resetExercises}
                className="flex items-center gap-1 text-xs bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition"
                title="重置並載入上次動作"
              >
                <RotateCcw className="w-3.5 h-3.5" /> 記憶重載
              </button>
              <button 
                onClick={addExercise}
                className="flex items-center gap-1 text-sm bg-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition"
              >
                <Plus className="w-4 h-4" /> 加入動作
              </button>
            </div>
          </div>

          {exercises.length === 0 && (
             <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-600 text-sm">
               未有動作，請點擊上方按鈕加入。
             </div>
          )}

          {exercises.map((ex) => (
            <div key={ex.id} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="例如: 臥推 / 引體上升"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  value={ex.name}
                  onChange={(e) => updateExerciseName(ex.id, e.target.value)}
                />
                <button onClick={() => removeExercise(ex.id)} className="text-zinc-500 hover:text-red-500 transition">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {ex.sets.map((set, idx) => (
                  <div key={set.id} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-zinc-500">{idx + 1}</span>
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1 flex items-center bg-zinc-900 rounded-lg border border-zinc-700 px-2">
                        <input
                          type="number"
                          className="w-full bg-transparent p-1 focus:outline-none text-center"
                          value={set.weight || ''}
                          placeholder="0"
                          onChange={(e) => updateSet(ex.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-zinc-600 px-1">kg</span>
                      </div>
                      <div className="flex-1 flex items-center bg-zinc-900 rounded-lg border border-zinc-700 px-2">
                        <input
                          type="number"
                          className="w-full bg-transparent p-1 focus:outline-none text-center"
                          value={set.reps || ''}
                          placeholder="10"
                          onChange={(e) => updateSet(ex.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                        />
                        <span className="text-zinc-600 px-1">次</span>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => addSet(ex.id)}
                  className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 transition"
                >
                  + 新增組數
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-200 transition"
        >
          <Save className="w-5 h-5" /> 儲存訓練
        </button>
      </div>
    </div>
  );
};

export default WorkoutForm;
