
import { Workout } from '../types';

const STORAGE_KEY = 'gym_tracker_data_v1';

export const getStoredWorkouts = (): Workout[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const saveWorkout = (workout: Workout) => {
  const workouts = getStoredWorkouts();
  workouts.push(workout);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
};

export const deleteWorkout = (id: string) => {
  const workouts = getStoredWorkouts();
  const filtered = workouts.filter(w => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
