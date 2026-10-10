import { createContext } from "atomico";
import type { PlainDate, PlainYear, PlainYearMonth } from "../utils/temporal.js";
import { getToday } from "../utils/date.js";

interface CalendarYearContextBase {
  min?: PlainYearMonth;
  max?: PlainYearMonth;
  today?: PlainYearMonth;
  isDateDisallowed?: (date: Date) => boolean;
  getMonthParts?: (date: Date) => string;
  page: { start: PlainYear; end: PlainYear };
  focusedDate: PlainYearMonth;
  showQuarterNumbers?: boolean;
  locale?: string;
  formatMonth: "long" | "short" | "numeric" | "narrow";
  group: "year";
}

export interface CalendarYearDateContext extends CalendarYearContextBase {
  type: "date";
  value?: PlainDate;
}

export interface CalendarYearRangeContext extends CalendarYearContextBase {
  type: "range";
  value: [PlainDate, PlainDate] | [];
}

export interface CalendarYearMultiContext extends CalendarYearContextBase {
  type: "multi";
  value: PlainDate[];
}

export type CalendarYearContextValue =
  | CalendarYearDateContext
  | CalendarYearRangeContext
  | CalendarYearMultiContext;

const t = getToday();

export const CalendarYearContext = createContext<CalendarYearContextValue>({
  type: "date",
  focusedDate: t.toPlainYearMonth(),
  page: { start: t.toPlainYear(), end: t.toPlainYear() },
} as CalendarYearContextValue);

customElements.define("calendar-year-ctx", CalendarYearContext);
