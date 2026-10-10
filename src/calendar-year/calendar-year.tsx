import { c, useContext, useRef, type Host } from "atomico";
import { cal, reset, vh } from "../utils/styles.js";
import { useCalendarYear } from "./useCalendarYear.js";
import { CalendarYearContext } from "./CalendarYearContext.js";
import { CalendarHeading } from "../calendar-heading/calendar-heading.js";
import { getQuarterNumber } from "../utils/date.js";

export const CalendarYear = c(
  (
    props
  ): Host<{
    onSelectMonth: CustomEvent<string>;
    onFocusMonth: CustomEvent<string>;
    onHoverMonth: CustomEvent<string>;
  }> => {
    const context = useContext(CalendarYearContext);
    const table = useRef<HTMLTableElement>();
    const calendar = useCalendarYear({ props, context });

    function focus() {
      table.current.querySelector<HTMLElement>("button[tabindex='0']")?.focus();
    }

    return (
      <host shadowDom focus={focus}>
        <CalendarHeading month="long" id="h" class="vh" />

        <slot name="heading" part="heading">
          <CalendarHeading month="long" aria-hidden="true" />
        </slot>

        <table ref={table} aria-labelledby="h" part="table" role="presentation">
          <colgroup>
            {context.showQuarterNumbers && <col part="col-quarternumber" />}
            <col part="col-1" />
            <col part="col-2" />
            <col part="col-3" />
          </colgroup>
          <tbody>
            {calendar.quarters.map((quarter, i) => (
              
              <tr key={i} part="tr quarter">
                {context.showQuarterNumbers && (
                  <th class="num" part="th quarternumber" scope="row">
                    {"Q"+getQuarterNumber(quarter[0].toPlainDate())}
                  </th>
                )}

                {quarter.map((date, j) => {
                  const props = calendar.getMonthProps(date);

                  return (
                    <td part="td" key={j}>
                      {props && (
                        <button class="num" {...props}>
                          <span class="vh">{calendar.monthsLong[date.month]}</span>
                          <span aria-hidden="true">{calendar.monthsVisible[date.month]}</span>
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
customElements.define("calendar-year", CalendarYear);
