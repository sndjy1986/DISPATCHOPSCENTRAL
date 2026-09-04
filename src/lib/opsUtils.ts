import { 
  differenceInDays, 
  addDays, 
  format, 
  isSameDay, 
  startOfDay,
  differenceInWeeks
} from 'date-fns';

// Reference payday (Assume Jan 5, 2024 was a payday - Friday)
const PAYDAY_REF_DATE = new Date(2024, 0, 5);

// Pitman 14-day shift schedule mapping starting on Saturday, June 27, 2026 (C-Day, D-Night)
const PITMAN_REF_DATE = new Date(2026, 5, 27); // June 27, 2026 is Saturday
const PITMAN_SCHEDULE = [
  { day: 'C', night: 'D' }, // 0: Saturday
  { day: 'C', night: 'D' }, // 1: Sunday
  { day: 'A', night: 'B' }, // 2: Monday
  { day: 'A', night: 'B' }, // 3: Tuesday
  { day: 'C', night: 'D' }, // 4: Wednesday
  { day: 'C', night: 'D' }, // 5: Thursday
  { day: 'A', night: 'B' }, // 6: Friday
  { day: 'A', night: 'B' }, // 7: Saturday
  { day: 'A', night: 'B' }, // 8: Sunday
  { day: 'C', night: 'D' }, // 9: Monday
  { day: 'C', night: 'D' }, // 10: Tuesday
  { day: 'A', night: 'B' }, // 11: Wednesday
  { day: 'A', night: 'B' }, // 12: Thursday
  { day: 'C', night: 'D' }, // 13: Friday
];

export function getShiftForDate(date: Date): string {
  const diff = differenceInDays(startOfDay(date), startOfDay(PITMAN_REF_DATE));
  const index = ((diff % 14) + 14) % 14;
  const shiftInfo = PITMAN_SCHEDULE[index];
  
  const hour = date.getHours();
  // Return Day shift for calendar (midnight 0) or if in 07:00-19:00, otherwise Night shift
  if (hour === 0) {
    return shiftInfo.day;
  }
  
  if (hour >= 7 && hour < 19) {
    return shiftInfo.day;
  } else {
    return shiftInfo.night;
  }
}

export function getShiftDetailForDate(date: Date): { day: string; night: string } {
  const diff = differenceInDays(startOfDay(date), startOfDay(PITMAN_REF_DATE));
  const index = ((diff % 14) + 14) % 14;
  return PITMAN_SCHEDULE[index];
}

export function isPayday(date: Date): boolean {
  const dayOfWeek = date.getDay();
  if (dayOfWeek !== 5) return false; // Must be Friday
  
  const diffWeeks = differenceInWeeks(startOfDay(date), startOfDay(PAYDAY_REF_DATE));
  return diffWeeks % 2 === 0;
}

export function getUpcomingShifts(startDate: Date, count: number = 5) {
  const shifts = [];
  for (let i = 0; i < count; i++) {
    const d = addDays(startDate, i);
    shifts.push({
      date: d,
      shift: getShiftForDate(d),
      isPayday: isPayday(d)
    });
  }
  return shifts;
}
