import { c, useContext, useRef, type Host } from "atomico";
import { cal, reset, vh } from "../utils/styles.js";
import { useCalendarMonth } from "./useCalendarMonth.js";
import { CalendarContext } from "./CalendarMonthContext.js";
import { CalendarHeading } from "../calendar-heading/calendar-heading.js";
import { getWeekNumber } from "../utils/date.js";

const mapToDayNumber = (firstDayOfWeek: number, i: number) =>
  (i + firstDayOfWeek) % 7;

export const CalendarMonth = c(
  (
    props
  ): Host<{
    onSelectDay: CustomEvent<string>;
    onFocusDay: CustomEvent<string>;
    onHoverDay: CustomEvent<string>;
  }> => {
    const context = useContext(CalendarContext);
    const table = useRef<HTMLTableElement>();
    const calendar = useCalendarMonth({ props, context });

    function focus() {
      table.current.querySelector<HTMLElement>("button[tabindex='0']")?.focus();
    }

    return (
      <host shadowDom focus={focus}>
        <CalendarHeading month="long" id="h" class="vh" />

        <slot name="heading" part="heading">
          <CalendarHeading month="long" aria-hidden="true" />
        </slot>

        <table ref={table} aria-labelledby="h" part="table">
          <colgroup>
            {context.showWeekNumbers && <col part="col-weeknumber" />}
            <col part="col-1" />
            <col part="col-2" />
            <col part="col-3" />
            <col part="col-4" />
            <col part="col-5" />
            <col part="col-6" />
            <col part="col-7" />
          </colgroup>
          <thead>
            <tr part="tr head">
              {context.showWeekNumbers && (
                <th part="th weeknumber">
                  <slot name="weeknumber">
                    <span class="vh">Week</span>
                    <span aria-hidden="true">#</span>
                  </slot>
                </th>
              )}
              {calendar.daysLong.map((dayName, i) => (
                <th
                  part={`th day day-${mapToDayNumber(context.firstDayOfWeek, i)}`}
                  scope="col"
                >
                  <span class="vh">{dayName}</span>
                  <span aria-hidden="true">{calendar.daysVisible[i]}</span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {calendar.weeks.map((week, i) => (
              <tr key={i} part="tr week">
                {context.showWeekNumbers && (
                  <th class="num" part="th weeknumber" scope="row">
                    {getWeekNumber(week[0])}
                  </th>
                )}

                {week.map((date, j) => {
                  const props = calendar.getDayProps(date);

                  return (
                    <td part="td" key={j}>
                      {props && (
                        <button class="num" {...props}>
                          {date.day}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </host>
    );
  },

  {
    props: {
      offset: {
        type: Number,
        value: 0,
      },
    },

    styles: [
      reset,
      vh,
      cal,
    ],
  }
);
customElements.define("calendar-month", CalendarMonth);
