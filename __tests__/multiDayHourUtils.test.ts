import { buildMultiDayHourString } from '../app/multiDayHourUtils';

describe('buildMultiDayHourString', () => {
  it('serializes the latest day-hour map without blank or zero values', () => {
    const result = buildMultiDayHourString({
      1: '4',
      2: '5.25',
      3: '',
      4: '0.00',
      5: '7.50',
      6: '0',
      9: '3.00',
    });

    expect(result).toBe('1-4.00|2-5.25|5-7.50|9-3.00');
  });

  it('ignores invalid values and keeps only valid pairs', () => {
    const result = buildMultiDayHourString({
      1: 'abc',
      2: ' 6.50 ',
      5: '0',
      7: '8.125',
    });

    expect(result).toBe('2-6.50|7-8.13');
  });

  it('drops cleared day entries so they stay deleted', () => {
    const result = buildMultiDayHourString({
      1: '4.00',
      2: '',
      3: '0.00',
      5: '7.50',
    });

    expect(result).toBe('1-4.00|5-7.50');
  });
});
