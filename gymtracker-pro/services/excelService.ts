
import * as XLSX from 'xlsx';
import { Workout, Exercise, SetEntry, MuscleGroup } from '../types';

export const exportToExcel = (workouts: Workout[]) => {
  const flattenedData = [];

  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set, index) => {
        flattenedData.push({
          '日期': new Date(workout.date).toLocaleDateString('zh-HK'),
          '訓練部位': workout.muscleGroup,
          '動作名稱': exercise.name,
          '組數': index + 1,
          '重量 (kg)': set.weight,
          '次數': set.reps,
          '_workoutId': workout.id, // Hidden fields for potential re-import matching
          '_isoDate': workout.date
        });
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(flattenedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'GymWorkouts');
  XLSX.writeFile(wb, `GymTracker_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const importFromExcel = async (file: File): Promise<Workout[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Group rows back into Workouts
        const workoutMap: Record<string, Workout> = {};

        jsonData.forEach((row) => {
          // Use _workoutId if exists, or combine Date + MuscleGroup to identify a workout session
          const dateStr = row['_isoDate'] || new Date(row['日期']).toISOString();
          const muscleGroup = row['訓練部位'] as MuscleGroup;
          const workoutId = row['_workoutId'] || `${dateStr}-${muscleGroup}`;

          if (!workoutMap[workoutId]) {
            workoutMap[workoutId] = {
              id: workoutId,
              date: dateStr,
              muscleGroup: muscleGroup,
              exercises: []
            };
          }

          const exerciseName = row['動作名稱'];
          let exercise = workoutMap[workoutId].exercises.find(ex => ex.name === exerciseName);

          if (!exercise) {
            exercise = {
              id: crypto.randomUUID(),
              name: exerciseName,
              sets: []
            };
            workoutMap[workoutId].exercises.push(exercise);
          }

          exercise.sets.push({
            id: crypto.randomUUID(),
            weight: Number(row['重量 (kg)']) || 0,
            reps: Number(row['次數']) || 0
          });
        });

        resolve(Object.values(workoutMap));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
