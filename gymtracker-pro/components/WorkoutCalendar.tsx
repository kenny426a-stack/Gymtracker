
import React from 'react';
import { Workout, MuscleGroup } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WorkoutCalendarProps {
  workouts: Workout[];
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ workouts }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  const getWorkoutOnDay = (day: number) => {
    return workouts.find(w => {
      const d = new Date(w.date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const getMuscleColor = (mg: MuscleGroup) => {
    switch (mg) {
      case MuscleGroup.CHEST: return 'bg-blue-500';
      case MuscleGroup.BACK: return 'bg-emerald-500';
      case MuscleGroup.LEGS: return 'bg-purple-500';
      default: return 'bg-zinc-600';
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">{year}年 {monthNames[month]}</h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-zinc-900 rounded-lg border border-zinc-800"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-zinc-900 rounded-lg border border-zinc-800"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
          <span key={d} className="text-xs text-zinc-500 font-medium">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const workout = getWorkoutOnDay(day);
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

          return (
            <div 
              key={day} 
              className={`aspect-square relative flex flex-col items-center justify-center rounded-lg border ${
                isToday ? 'border-white' : 'border-zinc-900'
              } ${workout ? 'bg-zinc-900' : 'hover:bg-zinc-900/50'}`}
            >
              <span className={`text-xs ${isToday ? 'font-bold text-white' : 'text-zinc-400'}`}>{day}</span>
              {workout && (
                <div className={`mt-1 w-1.5 h-1.5 rounded-full ${getMuscleColor(workout.muscleGroup)}`}></div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-zinc-400">胸部訓練</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-zinc-400">背部訓練</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
          <span className="text-zinc-400">腿部訓練</span>
        </div>
      </div>
    </div>
  );
};

export default WorkoutCalendar;
