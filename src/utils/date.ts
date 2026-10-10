import { PlainDate, PlainYear, PlainYearMonth } from "./temporal.js";

export type DaysOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function getToday() {
  const d = new Date();
  return new PlainDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

const DAY_MS = 86400000;

// slightly modified from https://weeknumber.co.uk/how-to/javascript
export function getWeekNumber(plainDate: PlainDate) {
  const date = toDate(plainDate);
  // Thursday in current week decides the year.
  date.setUTCDate(date.getUTCDate() + 3 - ((date.getUTCDay() + 6) % 7));
  // January 4 is always in week 1.
  const week1 = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));

  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / DAY_MS -
        3 +
        ((week1.getUTCDay() + 6) % 7)) /
        7
    )
  );
}

export function getQuarterNumber(plainDate: PlainDate) {
  const date = toDate(plainDate);
  return (
    Math.floor(date.getUTCMonth() / 3)
  );
}

export function startOfWeek(
  date: PlainDate,
  firstDayOfWeek: DaysOfWeek = 0
): PlainDate {
  const d = toDate(date);
  const day = d.getUTCDay();
  const diff = (day < firstDayOfWeek ? 7 : 0) + day - firstDayOfWeek;

  d.setUTCDate(d.getUTCDate() - diff);
  return PlainDate.from(d);
}

export function startOfYear(date: { year: number }): PlainDate {
  return PlainDate.from(new Date(Date.UTC(date.year, 0, 1)));
}

export function endOfWeek(
  date: PlainDate,
  firstDayOfWeek: DaysOfWeek = 0
): PlainDate {
  return startOfWeek(date, firstDayOfWeek).add({ days: 6 });
}

export function endOfMonth(date: { year: number; month: number }): PlainDate {
  return PlainDate.from(new Date(Date.UTC(date.year, date.month, 0)));
}

export function endOfYear(date: { year: number }): PlainDate {
  return PlainDate.from(new Date(Date.UTC(date.year, 12, 0)));
}

/**
 * Ensures date is within range, returns min or max if out of bounds
 */
export function clamp(
  date: PlainDate,
  min?: PlainDate,
  max?: PlainDate
): PlainDate;
export function clamp(
  date: PlainYearMonth,
  min?: PlainYearMonth,
  max?: PlainYearMonth
): PlainYearMonth;
export function clamp(
  date: PlainYearMonth | PlainDate,
  min?: PlainYearMonth | PlainDate,
  max?: PlainYearMonth | PlainDate
): PlainYearMonth | PlainDate {
  let compFn : CallableFunction;
  if (date instanceof PlainYearMonth) {
    compFn = PlainYearMonth.compare;
  } else {
    compFn = PlainDate.compare;
  }
  if (min && compFn(date, min) < 0) return min;
  if (max && compFn(date, max) > 0) return max;
  return date;
}

const oneDay = { days: 1 };

type Week = [
  PlainDate,
  PlainDate,
  PlainDate,
  PlainDate,
  PlainDate,
  PlainDate,
  PlainDate,
];

const oneMonth = { months: 1 };

type Quarter = [
  PlainYearMonth,
  PlainYearMonth,
  PlainYearMonth,
];

/**
 * given a date, return an array of dates from a calendar perspective
 */
export function getViewOfMonth(
  yearMonth: PlainYearMonth,
  firstDayOfWeek: DaysOfWeek = 0
): Week[] {
  let start = startOfWeek(yearMonth.toPlainDate(), firstDayOfWeek);
  const end = endOfWeek(endOfMonth(yearMonth), firstDayOfWeek);

  const weeks = [];

  // get all days in range
  while (PlainDate.compare(start, end) < 0) {
    const week = [];

    // chunk into weeks
    for (let i = 0; i < 7; i++) {
      week.push(start);
      start = start.add(oneDay);
    }

    weeks.push(week as Week);
  }

  return weeks;
}

/**
 * Given a date, return an array of quarters from a calendar perspective
 * Optionally expand to include the specified number of quarters before 
 * and after the selected year.
 */
export function getViewOfYear(
  year: PlainYear,
  expand = 0
): Quarter[] {
  let start = year.toPlainYearMonth().add({"months": -3*expand});
  const end = endOfYear(year).add({"months": 3*expand});

  const quarters = [];

  // get all days in range
  while (PlainYearMonth.compare(start, end) < 0) {
    const quarter = [];

    // chunk into quarters
    for (let i = 0; i < 3; i++) {
      quarter.push(start);
      start = start.add(oneMonth);
    }

    quarters.push(quarter as Quarter);
  }

  return quarters;
}

interface DateLike {
  year: number;
  month?: number;
  day?: number;
}

export function toDate(date: DateLike): Date {
  return new Date(Date.UTC(date.year, (date.month ?? 1) - 1, date.day ?? 1));
}
