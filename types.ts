
export interface PeriodEntry {
  id: string;
  startDate: string; // ISO string
  endDate?: string;  // ISO string
  duration: number;
}

export enum CyclePhase {
  MENSTRUAL = 'Menstrual',
  FOLLICULAR = 'Folicular',
  OVULATORY = 'Ovulatório',
  LUTEAL = 'Lúteo'
}

export interface CycleStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  currentDayOfCycle: number;
  nextPeriodDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  ovulationDay: string;
  phase: CyclePhase;
  daysToNextPeriod: number;
  daysToFertileWindow: number;
}

export interface HealthNote {
  id: string;
  date: string;
  mood: string;
  symptoms: string[];
  notes: string;
}

export interface UserProfile {
  name: string;
  age: string;
  goal: 'track' | 'conceive' | 'avoid';
  defaultCycleLength: number;
  defaultPeriodLength: number;
  notificationsEnabled: boolean;
}
