import {
  formatCalendarDateString,
  isCalendarDatePast,
} from '../app/dateUtils';

describe('calendar date helpers', () => {
  it('converts ISO calendar days without drifting into the previous date', () => {
    expect(formatCalendarDateString('2026-04-20')).toBe('04/20/2026');
    expect(formatCalendarDateString('2026-12-01')).toBe('12/01/2026');
  });

  it('treats the selected date as the same calendar day even in negative UTC offsets', () => {
    const pastDate = '2026-04-19';
    const todayDate = '2026-04-20';

    expect(isCalendarDatePast(pastDate, new Date(Date.UTC(2026, 3, 20)))).toBe(true);
    expect(isCalendarDatePast(todayDate, new Date(Date.UTC(2026, 3, 20)))).toBe(false);
  });
});
