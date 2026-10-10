import { describe, it, expect } from "vitest";
import { userEvent, page } from "vitest/browser";
import type { VNodeAny } from "atomico/types/vnode";
import {
  clickMonth,
  createSpy,
  getGrid,
  getYearHeading,
  getMonthButton,
  sendShiftPress,
  getTodayButton,
  getSelectedMonths,
  type YearInstance,
  getYear,
} from "../utils/test.js";
import {
  CalendarYearContext,
  type CalendarYearDateContext,
  type CalendarYearMultiContext,
  type CalendarYearRangeContext,
} from "./CalendarYearContext.js";
import { CalendarYear } from "../calendar-year/calendar-year.js";
import { fixture } from "atomico/test-dom";
import { PlainDate, PlainYearMonth } from "../utils/temporal.js";
import { toDate, getToday } from "../utils/date.js";

async function nextFrame() {
  return new Promise((resolve) =>
    requestAnimationFrame(() => resolve(undefined)),
  );
}

type YearContextInstance = InstanceType<typeof CalendarYearContext>;

interface TestPropsBase {
  onselectmonth?: (e: CustomEvent<PlainYearMonth>) => void;
  onfocusmonth?: (e: CustomEvent<PlainYearMonth>) => void;
  dir?: "rtl" | "ltr";
}

interface DateTestProps extends TestPropsBase, CalendarYearDateContext {}
interface RangeTestProps extends TestPropsBase, CalendarYearRangeContext {}
interface MultiTestProps extends TestPropsBase, CalendarYearMultiContext {}

function getQuarterNumbers(year: YearInstance) {
  const grid = getGrid(year);
  return grid.querySelectorAll("tbody tr th");
}

function Fixture({
  onselectmonth,
  onfocusmonth,
  focusedDate = getToday().toPlainYearMonth(),
  dir,
  type = "date",
  formatMonth = "narrow",
  ...props
}: Partial<DateTestProps | RangeTestProps | MultiTestProps>): VNodeAny {
  return (
    <CalendarYearContext
      onselectmonth={onselectmonth}
      onfocusmonth={onfocusmonth}
      dir={dir}
      value={{
        firstDayOfWeek: 1,
        locale: "en-GB",
        page: {
          start: focusedDate.toPlainYear(),
          end: focusedDate.toPlainYear(),
        },
        focusedDate,
        formatMonth,
        // @ts-expect-error - not sure why this is a problem
        type,
        ...props,
      }}
    >
      <CalendarYear />
    </CalendarYearContext>
  );
}

export async function mount(node: VNodeAny) {
  const context = fixture<YearContextInstance>(node);
  const month = getYear(context);
  await nextFrame();

  return month;
}

describe("CalendarYear", () => {
  it("is defined", async () => {
    const calendar = await mount(<Fixture />);
    expect(calendar).toBeInstanceOf(CalendarYear);
  });

  describe("value types", () => {
    describe("range", () => {
      it("handles an empty value", async () => {
        const year = await mount(
          <Fixture
            type="range"
            value={[]}
            focusedDate={PlainYearMonth.from("2024-01-01")}
          />,
        );

        const selected = getSelectedMonths(year);
        expect(selected.length).toBe(0);
      });

      it("marks a range as selected", async () => {
        const year = await mount(
          <Fixture
            focusedDate={PlainYearMonth.from("2020-01-01")}
            type="range"
            value={[PlainYearMonth.from("2020-01-01"), PlainYearMonth.from("2020-04-03")]}
          />,
        );

        const selected = getSelectedMonths(year);
        expect(selected.length).toBe(3);

        await expect
          .element(page.elementLocator(selected[0]!))
          .toHaveAttribute("aria-label", "1 January");
        expect(selected[0]!).toHavePart("selected");
        expect(selected[0]!).toHavePart("range-start");

        await expect
          .element(page.elementLocator(selected[1]!))
          .toHaveAttribute("aria-label", "2 January");
        expect(selected[1]!).toHavePart("selected");
        expect(selected[1]!).toHavePart("range-inner");

        await expect
          .element(page.elementLocator(selected[2]!))
          .toHaveAttribute("aria-label", "3 January");
        expect(selected[2]!).toHavePart("selected");
        expect(selected[2]!).toHavePart("range-end");
      });
    });

    describe("single date", () => {
      it("handles an empty value", async () => {
        const month = await mount(
          <Fixture focusedDate={PlainYearMonth.from("2024-01-01")} />,
        );

        const selected = getSelectedMonths(month);
        expect(selected.length).toBe(0);
      });

      it("marks a single date as selected", async () => {
        const month = await mount(
          <Fixture
            focusedDate={PlainYearMonth.from("2020-01-01")}
            value={PlainYearMonth.from("2020-01-01")}
          />,
        );

        const selected = getSelectedMonths(month);
        expect(selected.length).toBe(1);
        await expect
          .element(page.elementLocator(selected[0]!))
          .toHaveAttribute("aria-label", "1 January");
        expect(selected[0]!).toHavePart("selected");
      });
    });

    describe("multi date", () => {
      it("handles an empty value", async () => {
        const month = await mount(
          <Fixture
            type="multi"
            value={[]}
            focusedDate={PlainYearMonth.from("2024-01-01")}
          />,
        );

        const selected = getSelectedMonths(month);
        expect(selected.length).toBe(0);
      });

      it("marks multiple dates as selected", async () => {
        const month = await mount(
          <Fixture
            focusedDate={PlainYearMonth.from("2020-01-01")}
            type="multi"
            value={[
              PlainYearMonth.from("2020-01-01"),
              PlainYearMonth.from("2020-01-02"),
              PlainYearMonth.from("2020-01-03"),
            ]}
          />,
        );

        const selected = getSelectedMonths(month);
        expect(selected.length).toBe(3);
        await expect
          .element(page.elementLocator(selected[0]!))
          .toHaveAttribute("aria-label", "1 January");
        await expect
          .element(page.elementLocator(selected[1]!))
          .toHaveAttribute("aria-label", "2 January");
        await expect
          .element(page.elementLocator(selected[2]!))
          .toHaveAttribute("aria-label", "3 January");
      });
    });
  });

  describe("a11y/ARIA requirements", () => {
    describe("grid", () => {
      it("is labelled", async () => {
        const year = await mount(<Fixture />);

        // has accessible label
        const title = getYearHeading(year);
        expect(title).not.toBe(undefined);
      });

      it("marks today", async () => {
        const year = await mount(<Fixture />);

        const todaysDate = toDate(getToday()).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        });
        const button = getMonthButton(year, todaysDate)!;

        expect(button).toHavePart("today");
        await expect
          .element(page.elementLocator(button))
          .toHaveAttribute("aria-current", "date");
      });

      it("uses a roving tab index", async () => {
        const month = await mount(
          <Fixture focusedDate={PlainYearMonth.from("2020-01-01")} />,
        );
        const grid = getGrid(month);
        const buttons = [...grid.querySelectorAll("button")];

        // all buttons have a tabindex
        expect(buttons.every((button) => button.hasAttribute("tabindex"))).toBe(
          true,
        );

        // only one button has tabindex 0
        const focusable =
          grid.querySelectorAll<HTMLButtonElement>(`[tabindex="0"]`);
        expect(focusable.length).toBe(1);
        await expect
          .element(page.elementLocator(focusable[0]!))
          .toHaveTextContent("1");
        await expect
          .element(page.elementLocator(focusable[0]!))
          .toHaveAttribute("aria-label", "1 January");
      });
    });
  });

  describe("mouse interaction", () => {
    it("can select a date", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      const calendar = await mount(
        <Fixture
          focusedDate={PlainYearMonth.from("2020-04-01")}
          onselectmonth={spy}
        />,
      );

      await clickMonth(calendar, "19 April");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-04-19");
    });

    it("cannot select a disallowed date", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      const calendar = await mount(
        <Fixture
          focusedDate={PlainYearMonth.from("2020-01-03")}
          onselectmonth={spy}
        />,
      );

      const day = getMonthButton(calendar, "4 January")!;
      expect(day).toHavePart("disallowed");
      await expect
        .element(page.elementLocator(day))
        .toHaveAttribute("aria-disabled", "true");

      await page.elementLocator(day).click({ force: true });
      expect(spy.called).toBe(false);
    });
  });

  describe("keyboard interaction", () => {
    it("can select a date", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-04-19")} onfocusmonth={spy} />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{Enter}");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-04-19");
    });

    it("cannot select a disabled date", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture
          focusedDate={PlainYearMonth.from("2020-01-04")}
          onselectmonth={spy}
        />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{Enter}");

      expect(spy.called).toBe(false);
    });

    it("can move focus to previous day", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-04-19")} onfocusmonth={spy} />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{ArrowLeft}");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-04-18");
    });

    it("can move focus to next day ", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-04-19")} onfocusmonth={spy} />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{ArrowRight}");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-04-20");
    });

    it("can move focus to previous week", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-04-19")} onfocusmonth={spy} />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{ArrowUp}");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-04-12");
    });

    it("can move focus to next week", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-04-19")} onfocusmonth={spy} />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{ArrowDown}");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-04-26");
    });

    it("can move focus to start of week", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-04-16")} onfocusmonth={spy} />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{Home}");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-04-13");
    });

    it("can move focus to end of week", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-04-16")} onfocusmonth={spy} />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{End}");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-04-19");
    });

    it("can move focus to previous month", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-04-19")} onfocusmonth={spy} />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{PageUp}");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-03-19");
    });

    it("can move focus to next month", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-04-19")} onfocusmonth={spy} />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{PageDown}");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-05-19");
    });

    it("can move focus to previous year", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-04-19")} onfocusmonth={spy} />,
      );

      await userEvent.keyboard("{Tab}");
      await sendShiftPress("PageUp");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2019-04-19");
    });

    it("can move focus to next year", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-04-19")} onfocusmonth={spy} />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{Shift>}");
      await userEvent.keyboard("{PageDown}");
      await userEvent.keyboard("{/Shift}");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2021-04-19");
    });

    it("can move focus to disabled dates", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture
          focusedDate={PlainYearMonth.from("2020-01-03")}
          onfocusmonth={spy}
        />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{ArrowRight}");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-01-04");
    });

    it("cannot move focus outside of min/max range", async () => {
      const focused = "2020-01-03";
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      await mount(
        <Fixture
          min={PlainYearMonth.from(focused)}
          max={PlainYearMonth.from(focused)}
          focusedDate={PlainYearMonth.from(focused)}
          onfocusmonth={spy}
        />,
      );

      await userEvent.keyboard("{Tab}");
      await userEvent.keyboard("{ArrowLeft}");
      expect(spy.last[0].detail.toString()).toBe(focused);

      await userEvent.keyboard("{ArrowRight}");
      expect(spy.last[0].detail.toString()).toBe(focused);
    });

    describe("RTL", () => {
      it("treats left arrow as next day", async () => {
        const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
        await mount(
          <Fixture
            focusedDate={PlainYearMonth.from("2020-04-19")}
            onfocusmonth={spy}
            dir="rtl"
          />,
        );

        await userEvent.keyboard("{Tab}");
        await userEvent.keyboard("{ArrowLeft}");

        expect(spy.count).toBe(1);
        expect(spy.last[0].detail.toString()).toBe("2020-04-20");
      });

      it("treats right arrow as previous day", async () => {
        const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
        await mount(
          <Fixture
            focusedDate={PlainYearMonth.from("2020-04-19")}
            onfocusmonth={spy}
            dir="rtl"
          />,
        );

        await userEvent.keyboard("{Tab}");
        await userEvent.keyboard("{ArrowRight}");

        expect(spy.count).toBe(1);
        expect(spy.last[0].detail.toString()).toBe("2020-04-18");
      });
    });
  });

  describe("min/max support", () => {
    it("supports a min date", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      const month = await mount(
        <Fixture
          focusedDate={PlainYearMonth.from("2020-01-15")}
          min={PlainYearMonth.from("2020-01-02")}
          onselectmonth={spy}
        />,
      );

      // try clicking a month outside the range
      await clickMonth(month, "1 January", { force: true });
      expect(spy.called).toBe(false);

      // click a month inside the range
      await clickMonth(month, "2 January");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-01-02");
    });

    it("supports a max date", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      const month = await mount(
        <Fixture
          focusedDate={PlainYearMonth.from("2020-01-15")}
          max={PlainYearMonth.from("2020-01-30")}
          onselectmonth={spy}
        />,
      );

      // try clicking a month outside the range
      await clickMonth(month, "31 January", { force: true });
      expect(spy.called).toBe(false);

      // click a month inside the range
      await clickMonth(month, "30 January");

      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-01-30");
    });

    it("supports min and max dates", async () => {
      const spy = createSpy<(e: CustomEvent<PlainYearMonth>) => void>();
      const month = await mount(
        <Fixture
          focusedDate={PlainYearMonth.from("2020-01-15")}
          min={PlainYearMonth.from("2020-01-02")}
          max={PlainYearMonth.from("2020-01-30")}
          onselectmonth={spy}
        />,
      );

      // try clicking a month less than min
      await clickMonth(month, "1 January", { force: true });
      expect(spy.called).toBe(false);

      // try clicking a month greater than max
      await clickMonth(month, "31 January", { force: true });
      expect(spy.called).toBe(false);

      // click a month inside the range
      await clickMonth(month, "30 January");
      expect(spy.count).toBe(1);
      expect(spy.last[0].detail.toString()).toBe("2020-01-30");
    });
  });

  describe("today support", () => {
    it("supports today date", async () => {
      const month = await mount(
        <Fixture
          focusedDate={PlainYearMonth.from("2020-01-01")}
          today={PlainYearMonth.from("2020-01-02")}
        />,
      );

      const todayButton = getTodayButton(month);
      await expect
        .element(todayButton)
        .toHaveAttribute("aria-label", "2 January");
    });
  });

  describe("localization", async () => {
    it("localizes months", async () => {
      const year = await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-01-15")} locale="fr-FR" />,
      );
      const grid = getGrid(year);

      expect(getYearHeading(year)).toEqual("janvier");

      const button = getMonthButton(year, "15 janvier");
      expect(button).toBeTruthy();
    });
  });

  describe("quarter numbers", () => {
    it("supports quarter numbering", async () => {
      const year = await mount(
        <Fixture focusedDate={PlainYearMonth.from("2020-04-01")} showQuarterNumbers />,
      );

      const quarterNumbers = getQuarterNumbers(year);

      // 3 quarters remaining in a year
      expect(quarterNumbers.length).toBe(4);

      let current = 1;
      for (const quarterNumber of quarterNumbers) {
        expect(quarterNumber).toHavePart("th");
        expect(quarterNumber).toHavePart("quarternumber");
        await expect
          .element(page.elementLocator(quarterNumber))
          .toHaveAttribute("scope", "row");
        await expect
          .element(page.elementLocator(quarterNumber))
          .toHaveTextContent(current.toString());
        current++;
      }
    });

  });
});
