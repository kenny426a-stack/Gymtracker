
export enum MuscleGroup {
  CHEST = '胸',
  BACK = '背',
  LEGS = '腿'
}

export interface SetEntry {
  id: string;
  reps: number;
  weight: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  date: string; // ISO format
  muscleGroup: MuscleGroup;
  exercises: Exercise[];
}

export const TRAINING_ORDER = [MuscleGroup.CHEST, MuscleGroup.BACK, MuscleGroup.LEGS];
