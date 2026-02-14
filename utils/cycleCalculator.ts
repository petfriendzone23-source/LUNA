
import { addDays, differenceInDays, format, parseISO, startOfDay, isBefore, isAfter } from 'date-fns';
import { PeriodEntry, CyclePhase, CycleStats } from '../types';

export const calculateStats = (entries: PeriodEntry[], cycleLengthPref: number = 28, periodLengthPref: number = 5): CycleStats | null => {
  if (entries.length === 0) return null;

  const sortedEntries = [...entries].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const lastEntry = sortedEntries[0];
  const lastStartDate = startOfDay(parseISO(lastEntry.startDate));
  const today = startOfDay(new Date());

  // Média do Ciclo
  let avgCycle = cycleLengthPref;
  if (sortedEntries.length >= 2) {
    const intervals: number[] = [];
    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const start = parseISO(sortedEntries[i+1].startDate);
      const end = parseISO(sortedEntries[i].startDate);
      const diff = differenceInDays(end, start);
      if (diff >= 15 && diff <= 50) intervals.push(diff);
    }
    if (intervals.length > 0) {
      let totalWeight = 0;
      let weightedSum = 0;
      intervals.forEach((interval, index) => {
        const weight = index === 0 ? 3 : index === 1 ? 2 : 1;
        weightedSum += interval * weight;
        totalWeight += weight;
      });
      avgCycle = Math.round(weightedSum / totalWeight);
    }
  }

  // Média do Período
  let avgPeriod = periodLengthPref;
  if (entries.length > 0) {
    let totalWeight = 0;
    let weightedSum = 0;
    sortedEntries.forEach((entry, index) => {
      const weight = index === 0 ? 3 : index === 1 ? 2 : 1;
      weightedSum += entry.duration * weight;
      totalWeight += weight;
    });
    avgPeriod = Math.round(weightedSum / totalWeight);
  }

  const currentDayOfCycle = differenceInDays(today, lastStartDate) + 1;
  const nextPeriodDate = addDays(lastStartDate, avgCycle);
  const daysToNextPeriod = differenceInDays(nextPeriodDate, today);
  
  const ovulationDay = addDays(nextPeriodDate, -14);
  const fertileWindowStart = addDays(ovulationDay, -5);
  const fertileWindowEnd = addDays(ovulationDay, 1);

  let phase: CyclePhase = CyclePhase.FOLLICULAR;
  if (currentDayOfCycle > 0 && currentDayOfCycle <= avgPeriod) {
    phase = CyclePhase.MENSTRUAL;
  } else if (isAfter(today, addDays(fertileWindowStart, -1)) && isBefore(today, addDays(fertileWindowEnd, 1))) {
    phase = CyclePhase.OVULATORY;
  } else if (currentDayOfCycle > avgCycle - 14) {
    phase = CyclePhase.LUTEAL;
  }

  let daysToFertile = differenceInDays(fertileWindowStart, today);
  if (isAfter(today, fertileWindowEnd)) {
    const nextCycleStart = addDays(lastStartDate, avgCycle);
    const nextFertileStart = addDays(nextCycleStart, avgCycle - 14 - 5);
    daysToFertile = differenceInDays(nextFertileStart, today);
  }

  return {
    averageCycleLength: avgCycle,
    averagePeriodLength: avgPeriod,
    currentDayOfCycle,
    nextPeriodDate: format(nextPeriodDate, 'yyyy-MM-dd'),
    fertileWindowStart: format(fertileWindowStart, 'yyyy-MM-dd'),
    fertileWindowEnd: format(fertileWindowEnd, 'yyyy-MM-dd'),
    ovulationDay: format(ovulationDay, 'yyyy-MM-dd'),
    phase,
    daysToNextPeriod,
    daysToFertileWindow: Math.max(0, daysToFertile)
  };
};
