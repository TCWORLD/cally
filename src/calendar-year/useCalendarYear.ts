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
import { PlainYearMonth } from "../utils/temporal.js";
import type { PlainDate } from "../utils/temporal.js";
import type { CalendarContextValue } from "../calendar-base/CalendarBaseContext.js";

const inRange = (date: PlainYearMonth, min?: PlainDate, max?: PlainDate) =>
  date.equals(clamp(date.toPlainDate(), min, max));

const isLTR = (e: Event) => (e.target as HTMLElement).matches(":dir(ltr)");

const monthOptions = { month: "long", year: "numeric" } as const;
const longMonthOptions = { month: "long" } as const;
const dispatchOptions = { bubbles: true };

type UseCalendarYearOptions = {
  props: { offset: number };
  context: CalendarContextValue;
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
    formatMonth,
  } = context;
  const focusedDate = context.focusedDate.toPlainYearMonth();

  const todaysDate = today ?? getToday();
  const monthsLong = useMonthNames(longMonthOptions, locale);
  const visibleMonthOptions = useMemo(
    () => ({ month: formatMonth ?? "short" }),
    [formatMonth]
  );
  const monthsVisible = useMonthNames(visibleMonthOptions, locale);
  const monthFormatter = useDateFormatter(monthOptions, locale);

  const yearMonth = useMemo(
    () => page.start.add({ years: offset }),
    [page, offset]
  );

  useProvider(CalendarHeadingContext, { type: "date", value: yearMonth, locale });

  const quarters = useMemo(
    () => getViewOfYear(yearMonth),
    [yearMonth]
  );

  const dispatchFocusDay = useEvent<PlainDate>("focusday", dispatchOptions);
  const dispatchSelectDay = useEvent<PlainDate>("selectday", dispatchOptions);
  const dispatchHoverDay = useEvent<PlainDate>("hoverday", dispatchOptions);

  function focusDay(date: PlainYearMonth) {
    dispatchFocusDay(clamp(date.toPlainDate(), min, max));
  }

  function onKeyDown(e: KeyboardEvent) {
    let date;

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
    const isInYear = yearMonth.year === date.year;

    const isFocusedMonth = date.equals(focusedDate);
    const isThisMonth = date.equals(todaysDate);
    const asDate = toDate(date);
    const isDisallowed = isDateDisallowed?.(asDate);
    const isDisabled = !inRange(date, min, max);

    let parts = "";
    let isSelected: boolean | undefined;

    if (context.type === "range") {
      const [start, end] = context.value;
      const isRangeStart = start && date.equals(start);
      const isRangeEnd = end && date.equals(end);
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
      isSelected = context.value.some((d) => date.equals(d));
    } else {
      isSelected = context.value && date.equals(context.value);
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
      context.getDayParts?.(asDate) ?? ""
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
          dispatchSelectDay(date.toPlainDate());
        }
        focusDay(date);
      },
      onmouseover() {
        if (!isDisallowed && !isDisabled) {
          dispatchHoverDay(date.toPlainDate());
        }
      },
    };
  }

  return {
    quarters,
    year: yearMonth.year,
    monthsLong,
    monthsVisible,
    getMonthProps,
  };
}
