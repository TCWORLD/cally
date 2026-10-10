import { useEvent, useMemo, useProvider } from "atomico";
import { CalendarHeadingContext } from "../calendar-heading/CalendarHeadingContext.js";
import { useDateFormatter, useMonthNames } from "../utils/hooks.js";
import {
  clamp,
  toDate,
  getToday,
  getViewOfYear,
  endOfYear,
  startOfYear,
} from "../utils/date.js";
import type { PlainDate, PlainYearMonth } from "../utils/temporal.js";
import type { CalendarYearContextValue } from "./CalendarYearContext.js";

const inRange = (date: PlainYearMonth, min?: PlainYearMonth, max?: PlainYearMonth) =>
  clamp(date, min, max) === date;

const isLTR = (e: Event) => (e.target as HTMLElement).matches(":dir(ltr)");

const monthOptions = { month: "long", year: "numeric" } as const;
const longMonthOptions = { month: "long" } as const;
const dispatchOptions = { bubbles: true };

type UseCalendarYearOptions = {
  props: { offset: number };
  context: CalendarYearContextValue;
};

export function useCalendarYear({ props, context }: UseCalendarYearOptions) {
  const { offset } = props;
  const {
    isDateDisallowed,
    min,
    max,
    today,
    page,
    locale,
    focusedDate,
    formatMonth,
  } = context;

  const todaysDate = today ?? getToday();
  const monthsLong = useMonthNames(longMonthOptions, locale);
  const visibleMonthOptions = useMemo(
    () => ({ month: formatMonth ?? "short" }),
    [formatMonth]
  );
  const monthsVisible = useMonthNames(visibleMonthOptions, locale);
  const monthFormatter = useDateFormatter(monthOptions, locale);

  const year = useMemo(
    () => page.start.add({ years: offset }),
    [page, offset]
  );

  useProvider(CalendarHeadingContext, { type: "date", value: year.toPlainYearMonth(), locale });

  const quarters = useMemo(
    () => getViewOfYear(year, 1),
    [year]
  );

  const dispatchFocusMonth = useEvent<PlainYearMonth>("focusmonth", dispatchOptions);
  const dispatchSelectMonth = useEvent<PlainYearMonth>("selectmonth", dispatchOptions);
  const dispatchHoverMonth = useEvent<PlainYearMonth>("hovermonth", dispatchOptions);

  function focusDay(date: PlainYearMonth) {
    dispatchFocusMonth(clamp(date, min, max));
  }

  function onKeyDown(e: KeyboardEvent) {
    let date: PlainYearMonth;

    switch (e.key) {
      case "ArrowRight":
        date = focusedDate.add({ months: isLTR(e) ? 1 : -1 });
        break;
      case "ArrowLeft":
        date = focusedDate.add({ months: isLTR(e) ? -1 : 1 });
        break;
      case "ArrowDown":
        date = focusedDate.add({ years: 1 });
        break;
      case "ArrowUp":
        date = focusedDate.add({ years: -1 });
        break;
      case "PageUp":
        date = focusedDate.add({ years: -5 });
        break;
      case "PageDown":
        date = focusedDate.add({ years: 5 });
        break;
      case "Home":
        date = startOfYear(focusedDate).toPlainYearMonth();
        break;
      case "End":
        date = endOfYear(focusedDate).toPlainYearMonth();
        break;
      default:
        return;
    }

    focusDay(date);
    e.preventDefault();
  }

  function getMonthProps(date: PlainYearMonth) {
    const isInYear = year.equals(date);

    const isFocusedMonth = date.equals(focusedDate);
    const isThisMonth = date.equals(todaysDate);
    const asDate = toDate(date);
    const isDisallowed = isDateDisallowed?.(asDate);
    const isDisabled = !inRange(date, min, max);

    let parts = "";
    let isSelected: boolean | undefined;

    if (context.type === "range") {
      const [start, end] = context.value;
      const isRangeStart = start?.equals(date);
      const isRangeEnd = end?.equals(date);
      isSelected = start && end && inRange(date, start, end);

      // prettier-ignore
      parts = `${
        isRangeStart ? "range-start" : ""
      } ${
        isRangeEnd ? "range-end" : ""
      } ${
        isSelected && !isRangeStart && !isRangeEnd ? "range-inner" : ""
      }`;
    } else if (context.type === "multi") {
      isSelected = context.value.some((d) => d.equals(date));
    } else {
      isSelected = context.value?.equals(date);
    }

    // prettier-ignore
    const commonParts = `button month month-${asDate.getUTCMonth()} ${
      // we don't want outside days to ever be shown as selected
      isInYear ? (isSelected ? "selected" : "") : "outside"
    } ${
      isDisallowed ? "disallowed" : ""
    } ${
      isThisMonth ? "today" : ""
    } ${
      context.getMonthParts?.(asDate) ?? ""
    }`;

    return {
      part: `${commonParts} ${parts}`,
      tabindex: isInYear && isFocusedMonth ? 0 : -1,
      disabled: isDisabled,
      "aria-disabled": isDisallowed ? "true" : undefined,
      "aria-pressed": isInYear && isSelected,
      "aria-current": isThisMonth ? "date" : undefined,
      "aria-label": monthFormatter.format(asDate),
      onkeydown: onKeyDown,
      onclick() {
        if (!isDisallowed) {
          dispatchSelectMonth(date);
        }
        focusDay(date);
      },
      onmouseover() {
        if (!isDisallowed && !isDisabled) {
          dispatchHoverMonth(date);
        }
      },
    };
  }

  return {
    quarters,
    year,
    monthsLong,
    monthsVisible,
    getMonthProps,
  };
}
