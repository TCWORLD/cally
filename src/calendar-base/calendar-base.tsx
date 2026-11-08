import { css } from "atomico";
import { CalendarContext } from "./CalendarBaseContext.js";
import type {
   CalendarDateContext,
   CalendarMultiContext,
   CalendarRangeContext,
} from "./CalendarBaseContext.js";
import { CalendarHeading } from "../calendar-heading/calendar-heading.js";
import { reset, vh } from "../utils/styles.js";
import { type DaysOfWeek } from "../utils/date.js";
import type { PlainDate } from "../utils/temporal.js";
import type { Pagination } from "./useCalendarBase.js";

interface CalendarBaseProps {
  pageBy: Pagination;
  previous?: () => void;
  next?: () => void;
  onSelect: (e: CustomEvent<PlainDate>) => void;
  onFocus: (e: CustomEvent<PlainDate>) => void;
  onHover?: (e: CustomEvent<PlainDate>) => void;
}

interface CalendarRangeProps extends CalendarBaseProps, CalendarRangeContext {}
interface CalendarDateProps extends CalendarBaseProps, CalendarDateContext {}
interface CalendarMultiProps extends CalendarBaseProps, CalendarMultiContext {}

function Button(props: {
  name: string;
  onclick: (() => void) | undefined;
  children?: unknown;
}) {
  return (
    <button
      part={`button ${props.name} ${!props.onclick ? "disabled" : ""}`}
      onclick={props.onclick}
      aria-disabled={!props.onclick ? "true" : null}
    >
      <slot name={props.name}>{props.children}</slot>
    </button>
  );
}

export function CalendarBase(
  props: CalendarDateProps | CalendarRangeProps | CalendarMultiProps
) {
  return (
    <CalendarContext
      value={props}
      onselectday={props.onSelect}
      onfocusday={props.onFocus}
      onhoverday={props.onHover}
    >
      <div role="group" aria-labelledby="h" part="container">
        <CalendarHeading
          month="long"
          year="numeric"
          id="h"
          class="vh"
          aria-live="polite"
          aria-atomic="true"
        />

        <div part="header">
          <Button name="previous" onclick={props.previous}>
            Previous
          </Button>

          <slot part="heading" name="heading">
            <CalendarHeading year="numeric" aria-hidden="true" />
          </slot>

          <Button name="next" onclick={props.next}>
            Next
          </Button>
        </div>

        <slot part="months"></slot>
      </div>
    </CalendarContext>
  );
}

export const props = {
  value: {
    type: String,
    value: "",
  },
  min: {
    type: String,
    value: "",
  },
  max: {
    type: String,
    value: "",
  },
  today: {
    type: String,
    value: "",
  },
  focusedDate: {
    type: String,
    value: (): string | undefined => undefined,
  },
  isDateDisallowed: {
    type: Function,
    value: (date: Date) => false,
  },
  getDayParts: {
    type: Function,
    value: (date: Date): string => "",
  },
  locale: {
    type: String,
    value: (): string | undefined => undefined,
  },
  firstDayOfWeek: {
    type: Number,
    value: (): DaysOfWeek => 1,
  },
  showOutsideDays: {
    type: Boolean,
    value: false,
  },
  showWeekNumbers: {
    type: Boolean,
    value: false,
  },
  formatWeekday: {
    type: String,
    value: (): "narrow" | "short" => "narrow",
  },
  showQuarterNumbers: {
    type: Boolean,
    value: false,
  },
  formatMonth: {
    type: String,
    value: (): "long" | "short" | "numeric" | "narrow" | "2-digit" => "long",
  },
  months: {
    type: Number,
    value: 1,
  },
  pageBy: {
    type: String,
    value: (): Pagination => "months",
  },
};

export const styles = [
  reset,
  vh,
  css`
    :host {
      display: block;
      inline-size: fit-content;
    }

    :host::part(container) {
      display: flex;
      flex-direction: column;
      gap: 1em;
    }

    :host::part(header) {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    :host::part(heading) {
      font-weight: bold;
      font-size: 1.25em;
    }

    :host::part(button) {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :host::part(button disabled) {
      cursor: default;
      opacity: 0.5;
    }
  `,
];
