import { parse, parseDateRange } from "../src/index";
import {
  ParseResult,
  Event,
  DateRange,
  Block,
  Image,
  toDateRange,
  RangeType,
  RelativeDate,
  Eventy,
  flat,
  toArray,
  iter,
  isEvent,
  get,
  EventGroup,
} from "../src/Types";
import { DateTime } from "luxon";
import {
  currentYear,
  firstEvent,
  nthEvent,
  sameParse,
  sp,
  checkDateTime,
  getDateRanges,
} from "./testUtilities";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("parsing", () => {
  test.each(sameParse(DateTime.fromISO("2022-05-01T12:13:14.00Z")))(
    "ISO dates",
    async (p, expected) => {
      const markwhen = p("2022-05-01T12:13:14.00Z: some event");

      const { fromDateTime } = toDateRange(
        firstEvent(markwhen).dateRangeIso
      ) as DateRange;
      expect(+fromDateTime).toBe(+expected);
    }
  );

  test.each(
    sameParse([
      DateTime.fromISO("2022-05-01T12:13:14.00Z"),
      DateTime.fromISO("2024-01-27T18:13:59.00Z"),
    ])
  )("ISO date range", async (p, [fromDateTime, toDateTime]) => {
    const markwhen = p(
      "2022-05-01T12:13:14.00Z-2024-01-27T18:13:59.00Z: some event"
    );

    const dateRange = toDateRange(
      firstEvent(markwhen).dateRangeIso
    ) as DateRange;

    expect(+dateRange.fromDateTime).toBe(+fromDateTime);
    expect(+dateRange.toDateTime).toBe(+toDateTime);
  });

  test.each(
    sameParse([
      DateTime.fromISO("2022-05-01T12:13:14.00Z"),
      DateTime.fromISO("2024-01-27T18:13:59.00Z"),
    ])
  )("ISO date range with space", async (p, [fromDateTime, toDateTime]) => {
    const markwhen = p(
      "2022-05-01T12:13:14.00Z - 2024-01-27T18:13:59.00Z: some event"
    );

    const dateRange = toDateRange(
      firstEvent(markwhen).dateRangeIso
    ) as DateRange;

    expect(+dateRange.fromDateTime).toBe(+fromDateTime);
    expect(+dateRange.toDateTime).toBe(+toDateTime);
  });

  test.each(sameParse([]))("year by itself", async (p) => {
    const markwhen = p("1999: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(1999);
    expect(from.month).toBe(1);
    expect(from.day).toBe(1);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2000);
    expect(to.month).toBe(1);
    expect(to.day).toBe(1);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);
  });

  test.each(sameParse([]))("year to year", async (p) => {
    const markwhen = p("1999 - 2099: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(1999);
    expect(from.month).toBe(1);
    expect(from.day).toBe(1);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2100);
    expect(to.month).toBe(1);
    expect(to.day).toBe(1);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);
  });

  test.each(sameParse([]))("slash month 1", async (p) => {
    const markwhen = p("04/2010: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(2010);
    expect(from.month).toBe(4);
    expect(from.day).toBe(1);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2010);
    expect(to.month).toBe(5);
    expect(to.day).toBe(1);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);
  });

  test.each(sameParse([]))("slash month 2", async (p) => {
    const markwhen = p("04/2010 - 2010: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(2010);
    expect(from.month).toBe(4);
    expect(from.day).toBe(1);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2011);
    expect(to.month).toBe(1);
    expect(to.day).toBe(1);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);
  });

  test.each(sameParse([]))("slash month 3", async (p) => {
    const markwhen = p("04/2010 - 08/2012: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(2010);
    expect(from.month).toBe(4);
    expect(from.day).toBe(1);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2012);
    expect(to.month).toBe(9);
    expect(to.day).toBe(1);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);
  });

  test.each(sameParse([]))("slash month 4", async (p) => {
    const markwhen = p("1945- 7/2010: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(1945);
    expect(from.month).toBe(1);
    expect(from.day).toBe(1);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2010);
    expect(to.month).toBe(8);
    expect(to.day).toBe(1);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);
  });

  test.each(sameParse([]))("american slash day 1", async (p) => {
    const markwhen = p("04/25/1945- 7/2010: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(1945);
    expect(from.month).toBe(4);
    expect(from.day).toBe(25);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2010);
    expect(to.month).toBe(8);
    expect(to.day).toBe(1);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);
  });

  test.each(sameParse([]))("american slash day 2", async (p) => {
    const markwhen = p("12/3/1945 -04/7/2010: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(1945);
    expect(from.month).toBe(12);
    expect(from.day).toBe(3);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2010);
    expect(to.month).toBe(4);
    expect(to.day).toBe(8);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);
  });

  test.each(sameParse([]))("american slash day 3", async (p) => {
    const markwhen = p("2000 - 09/22/2010: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(2000);
    expect(from.month).toBe(1);
    expect(from.day).toBe(1);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2010);
    expect(to.month).toBe(9);
    expect(to.day).toBe(23);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);
  });

  test.each(sameParse([]))("european slash day 1", async (p) => {
    const markwhen = p("dateFormat: d/M/y\n2000 - 09/12/2010: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(2000);
    expect(from.month).toBe(1);
    expect(from.day).toBe(1);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2010);
    expect(to.month).toBe(12);
    expect(to.day).toBe(10);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);
  });

  test.each(sameParse([]))("european slash day 2", async (p) => {
    const markwhen = p("dateFormat: d/M/y\n5/9/2009 - 09/2010: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(2009);
    expect(from.month).toBe(9);
    expect(from.day).toBe(5);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2010);
    expect(to.month).toBe(10);
    expect(to.day).toBe(1);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);
  });

  test.each(sameParse([]))("european slash day 3", async (p) => {
    const markwhen = p(
      "dateFormat: d/M/y\n5/9/2009 - 2024-01-27T18:13:59.00Z: event"
    );

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(2009);
    expect(from.month).toBe(9);
    expect(from.day).toBe(5);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2024);
    expect(to.month).toBe(1);
    expect(to.day).toBe(27);

    // we're going to ignore the hour here due to the result
    // being dependent on the tester's current time zone
    // expect(to.hour).toBe(18)
    expect(to.minute).toBe(13);
    expect(to.second).toBe(59);
  });

  test.each(sameParse([]))("european slash day 4", async (p) => {
    const markwhen = p(
      "dateFormat: d/M/y\n2024-01-27T18:13:59.00Z - 5/9/2009: event"
    );

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;
    const to = dateRange.toDateTime;

    expect(to.year).toBe(2009);
    expect(to.month).toBe(9);
    expect(to.day).toBe(6);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);

    expect(from.year).toBe(2024);
    expect(from.month).toBe(1);
    expect(from.day).toBe(27);

    // we're going to ignore the hour here due to the result
    // being dependent on the tester's current time zone
    // expect(to.hour).toBe(18)
    expect(from.minute).toBe(13);
    expect(from.second).toBe(59);
  });

  test.each(sameParse([]))("european slash day 5", async (p) => {
    const markwhen = p("dateFormat: d/M/y\n5/9/2009: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;

    expect(from.year).toBe(2009);
    expect(from.month).toBe(9);
    expect(from.day).toBe(5);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    const to = dateRange.toDateTime;
    expect(to.year).toBe(2009);
    expect(to.month).toBe(9);
    expect(to.day).toBe(6);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);
  });

  test.each(sameParse([]))("relative dates 1", async (p) => {
    const markwhen = p(
      "dateFormat: d/M/y\n5/9/2009: event\n1 week: next event"
    );

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    let from = dateRange.fromDateTime;

    expect(from.year).toBe(2009);
    expect(from.month).toBe(9);
    expect(from.day).toBe(5);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    let to = dateRange.toDateTime;
    expect(to.year).toBe(2009);
    expect(to.month).toBe(9);
    expect(to.day).toBe(6);
    expect(to.hour).toBe(0);
    expect(to.minute).toBe(0);
    expect(to.second).toBe(0);

    const secondRange = toDateRange(nthEvent(markwhen, 1).dateRangeIso);

    // Should start at the end of the last event
    from = secondRange.fromDateTime;
    expect(from.year).toBe(2009);
    expect(from.month).toBe(9);
    expect(from.day).toBe(6);
    expect(from.hour).toBe(0);
    expect(from.minute).toBe(0);
    expect(from.second).toBe(0);

    // to should be the beginning date plus a week
    expect(secondRange.toDateTime.equals(from.plus({ weeks: 1 }))).toBe(true);
  });

  test.each(sameParse([]))("relative dates 2", async (p) => {
    const markwhen = p(
      "dateFormat: d/M/y\n5/9/2009: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event"
    );

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    let from = dateRange.fromDateTime;
    checkDate(from, 2009, 9, 5, 0, 0, 0);

    let to = dateRange.toDateTime;
    checkDate(to, 2009, 9, 6, 0, 0, 0);

    const secondRange = toDateRange(nthEvent(markwhen, 1).dateRangeIso);

    // Should start at the end of the last event
    from = secondRange.fromDateTime;
    checkDate(from, 2009, 9, 6, 0, 0, 0);

    // to should be the beginning date plus a week
    checkDateTime(secondRange.toDateTime, from.plus({ months: 1, days: 1 }));

    const thirdRange = toDateRange(nthEvent(markwhen, 2).dateRangeIso);
    to = secondRange.toDateTime;
    from = thirdRange.fromDateTime;
    // Should start when the last one ends
    checkDate(from, to.year, to.month, to.day, to.hour, to.minute);

    to = thirdRange.toDateTime;
    checkDateTime(to, from.plus({ years: 3, months: 1, days: 8 }));
  });

  test.each(sameParse([]))("relative dates 3", async (p) => {
    const markwhen = p(
      "dateFormat: d/M/y\n5/9/2009: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event"
    );

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    let from = dateRange.fromDateTime;
    checkDate(from, 2009, 9, 5, 0, 0, 0);

    let to = dateRange.toDateTime;
    checkDate(to, 2009, 9, 6, 0, 0, 0);

    const secondRange = toDateRange(nthEvent(markwhen, 1).dateRangeIso);

    // Should start at the end of the last event
    from = secondRange.fromDateTime;
    checkDate(from, 2009, 9, 6, 0, 0, 0);

    // to should be the beginning date plus a week
    expect(
      secondRange.toDateTime.equals(from.plus({ months: 1, days: 1 }))
    ).toBe(true);

    const thirdRange = toDateRange(nthEvent(markwhen, 2).dateRangeIso);
    to = secondRange.toDateTime;
    from = thirdRange.fromDateTime;
    // Should start when the last one ends
    checkDate(from, to.year, to.month, to.day, to.hour, to.minute);

    to = thirdRange.toDateTime;
    expect(to.equals(from.plus({ years: 3, months: 1, days: 8 }))).toBe(true);
  });

  test.each(sameParse([]))("relative by id", (p) => {
    const markwhen = p(`
5/9/2009: event !firstEvent
after !firstEvent 1 month 1 day: next event
after !firstEvent 3 years 8 days 1 month: third event

1 day: after the third event !fourth
!firstEvent 10 days: 5
!fourth 10 days: 6`);

    const [first, second, third, fourth, fifth, sixth] =
      getDateRanges(markwhen);

    checkDateTime(first.toDateTime, second.fromDateTime);
    checkDateTime(first.toDateTime, third.fromDateTime);
    checkDateTime(fourth.fromDateTime, third.toDateTime);
    checkDateTime(fifth.fromDateTime, first.toDateTime);
    checkDateTime(sixth.fromDateTime, fourth.toDateTime);
  });

  test.each(sameParse([]))("event title", (p) => {
    const markwhen = p(
      "dateFormat: d/M/y\n5/9/2009: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event"
    );
    const first = firstEvent(markwhen);
    expect(first.firstLine.restTrimmed).toBe("event");
    const second = nthEvent(markwhen, 1);
    expect(second.firstLine.restTrimmed).toBe("next event");
    const third = nthEvent(markwhen, 2);
    expect(third.firstLine.restTrimmed).toBe("third event");
  });

  test.each(sameParse([]))("event title", (p) => {
    const markwhen = p(
      "dateFormat: d/M/y\n5/9/2009: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event\ndec 1 1989 every day for 10 days: recurring event"
    );
    const first = firstEvent(markwhen);
    expect(first.firstLine.restTrimmed).toBe("event");
    const second = nthEvent(markwhen, 1);
    expect(second.firstLine.restTrimmed).toBe("next event");
    const third = nthEvent(markwhen, 2);
    expect(third.firstLine.restTrimmed).toBe("third event");
    const last = nthEvent(markwhen, 3);
    expect(last.firstLine.restTrimmed).toBe("recurring event");
  });

  test.each(sp())("event title 2", (p) => {
    const mw = p(`03/15/2013-04/2015 every 10 years: China  #Work`);

    expect(nthEvent(mw, 0).firstLine.restTrimmed).toBe("China ");
  });

  test.each(sameParse([]))("supplemental descriptions", (p) => {
    const markwhen = p(
      "dateFormat: d/M/y\n5/9/2009: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event\nmore text\neven more text"
    );
    const third = nthEvent(markwhen, 2);
    expect(third.firstLine.restTrimmed).toBe("third event");
    expect((third.supplemental[0] as Block).raw).toBe("more text");
    expect((third.supplemental[1] as Block).raw).toBe("even more text");
  });

  test.each(sameParse([]))("list items", (p) => {
    const markwhen = p(`dateFormat: d/M/y
5/9/2009: event
1 month 1 day: next event
- item 1
- item 2

3 years 8 days 1 month: third event

- item 3

- item 4`);

    const [first, second, third] = getEvents(markwhen);
    expect(second.supplemental.length).toBe(2);
    expect(second.supplemental[0].type).toBe("listItem");
    expect((second.supplemental[0] as Block).raw).toBe("item 1");
    expect(second.supplemental[1].type).toBe("listItem");
    expect((second.supplemental[1] as Block).raw).toBe("item 2");

    expect(third.supplemental.length).toBe(2);
    expect(third.supplemental[0].type).toBe("listItem");
    expect((third.supplemental[0] as Block).raw).toBe("item 3");
    expect(third.supplemental[1].type).toBe("listItem");
    expect((third.supplemental[1] as Block).raw).toBe("item 4");
  });

  test.each(sameParse([]))("checkbox items", (p) => {
    const markwhen = p(`dateFormat: d/M/y
5/9/2009: event
1 month 1 day: next event
- [] item 1
- [ ] item 2

3 years 8 days 1 month: third event

- [x] item 3

- [x] item 4`);

    const [first, second, third] = getEvents(markwhen);
    expect(second.supplemental.length).toBe(2);
    expect(second.supplemental[0].type).toBe("checkbox");
    expect((second.supplemental[0] as Block).raw).toBe("item 1");
    expect((second.supplemental[0] as Block).value).toBe(false);
    expect(second.supplemental[1].type).toBe("checkbox");
    expect((second.supplemental[1] as Block).raw).toBe("item 2");
    expect((second.supplemental[1] as Block).value).toBe(false);

    expect(third.supplemental.length).toBe(2);
    expect(third.supplemental[0].type).toBe("checkbox");
    expect((third.supplemental[0] as Block).raw).toBe("item 3");
    expect((third.supplemental[0] as Block).value).toBe(true);
    expect(third.supplemental[1].type).toBe("checkbox");
    expect((third.supplemental[1] as Block).raw).toBe("item 4");
    expect((third.supplemental[1] as Block).value).toBe(true);
  });

  test.each(sp())("to now", (p) => {
    const markwhen = p("June 4 1999 - now: event");

    const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
    const from = dateRange.fromDateTime;
    checkDate(from, 1999, 6, 4, 0, 0, 0);

    const to = dateRange.toDateTime;
    const now = DateTime.now();
    checkDate(to, now.year, now.month, now.day, now.hour, now.minute);
  });

  describe("casual dates", () => {
    test.each(sp())("casual dates via month words 1", (p) => {
      const markwhen = p("dateFormat: d/M/y\n5 June 2009: event");
      const first = firstEvent(markwhen);
      const startOfDay = DateTime.fromISO("2009-06-05");
      expect(+toDateRange(first.dateRangeIso).fromDateTime).toBe(+startOfDay);
      expect(+toDateRange(first.dateRangeIso).toDateTime).toBe(
        +startOfDay.plus({ day: 1 })
      );
    });

    test.each(sp())("casual dates via month words 2", (p) => {
      const markwhen = p("dateFormat: d/M/y\nJune 5 2009: event");
      const first = firstEvent(markwhen);
      const startOfDay = DateTime.fromISO("2009-06-05");
      expect(+toDateRange(first.dateRangeIso).fromDateTime).toBe(+startOfDay);
      expect(+toDateRange(first.dateRangeIso).toDateTime).toBe(
        +startOfDay.plus({ day: 1 })
      );
    });

    test.each(sp())("casual dates via month words 3", (p) => {
      const markwhen = p("dateFormat: d/M/y\nJun 5 2009: event");
      const first = firstEvent(markwhen);
      const startOfDay = DateTime.fromISO("2009-06-05");
      expect(+toDateRange(first.dateRangeIso).fromDateTime).toBe(+startOfDay);
      expect(+toDateRange(first.dateRangeIso).toDateTime).toBe(
        +startOfDay.plus({ day: 1 })
      );
    });

    test.each(sp())("casual dates via month words 4", (p) => {
      const markwhen = p("  5 Jun 2009: event");
      const first = firstEvent(markwhen);
      const startOfDay = DateTime.fromISO("2009-06-05");
      expect(+toDateRange(first.dateRangeIso).fromDateTime).toBe(+startOfDay);
      expect(+toDateRange(first.dateRangeIso).toDateTime).toBe(
        +startOfDay.plus({ day: 1 })
      );
    });

    test.each(sp())("casual dates via month words 5", (p) => {
      const markwhen = p("June   2009: event");
      const first = firstEvent(markwhen);
      const startOfMonth = DateTime.fromISO("2009-06-01");
      expect(+toDateRange(first.dateRangeIso).fromDateTime).toBe(+startOfMonth);
      expect(+toDateRange(first.dateRangeIso).toDateTime).toBe(
        +DateTime.fromISO("2009-07-01")
      );
    });

    test.each(sp())("casual dates via month words 6", (p) => {
      const markwhen = p(" Feb  2009: event");
      const first = firstEvent(markwhen);
      const startOfMonth = DateTime.fromISO("2009-02-01");
      expect(+toDateRange(first.dateRangeIso).fromDateTime).toBe(+startOfMonth);
      expect(+toDateRange(first.dateRangeIso).toDateTime).toBe(
        +DateTime.fromISO("2009-03-01")
      );
    });

    test.each(sp())("casual dates via month words 7", (p) => {
      const markwhen = p("Feb: event");
      const first = firstEvent(markwhen);
      const startOfMonth = DateTime.fromISO(`${currentYear}-02-01`);
      expect(+toDateRange(first.dateRangeIso).fromDateTime).toBe(+startOfMonth);
      expect(+toDateRange(first.dateRangeIso).toDateTime).toBe(
        +DateTime.fromISO(`${currentYear}-03-01`)
      );
    });
  });

  describe("casual times", () => {
    test.each(sp())("casual times 1", (p) => {
      const markwhen = p("June 4 8am: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      const from = dateRange.fromDateTime;
      checkDate(from, currentYear, 6, 4, 8, 0, 0);

      const to = dateRange.toDateTime;
      checkDate(to, currentYear, 6, 4, 8, 0, 0);
    });

    test.each(sp())("casual times 2", (p) => {
      const markwhen = p("June 4 8:00: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      const from = dateRange.fromDateTime;
      checkDate(from, currentYear, 6, 4, 8, 0, 0);

      const to = dateRange.toDateTime;
      checkDate(to, currentYear, 6, 4, 8, 0, 0);
    });

    test.each(sp())("casual times 3", (p) => {
      const markwhen = p("June 4 8:00 - 9:30: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      const from = dateRange.fromDateTime;
      checkDate(from, currentYear, 6, 4, 8, 0, 0);

      const to = dateRange.toDateTime;
      checkDate(to, currentYear, 6, 4, 9, 30, 0);
    });

    test.each(sp())("casual times 4", (p) => {
      const markwhen = p("June 4 8:00 - 19:30: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      const from = dateRange.fromDateTime;
      checkDate(from, currentYear, 6, 4, 8, 0, 0);

      const to = dateRange.toDateTime;
      checkDate(to, currentYear, 6, 4, 19, 30, 0);
    });

    test.each(sp())("casual times 5", (p) => {
      const markwhen = p("June 4 1990 8am - 9:30pm: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      const from = dateRange.fromDateTime;
      checkDate(from, 1990, 6, 4, 8, 0, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 1990, 6, 4, 21, 30, 0);
    });

    test.each(sp())("casual times 6", (p) => {
      const markwhen = p("June 4 08:00: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      const from = dateRange.fromDateTime;
      checkDate(from, currentYear, 6, 4, 8, 0, 0);

      const to = dateRange.toDateTime;
      checkDate(to, currentYear, 6, 4, 8, 0, 0);
    });

    test.each(sp())("casual times 7", (p) => {
      const markwhen = p("June 4 8:39: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      const from = dateRange.fromDateTime;
      checkDate(from, currentYear, 6, 4, 8, 39, 0);

      const to = dateRange.toDateTime;
      checkDate(to, currentYear, 6, 4, 8, 39, 0);
    });

    test.each(sp())("casual times 8", (p) => {
      const markwhen = p("June 4 8:39 - August 8 12:34: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      const from = dateRange.fromDateTime;
      checkDate(from, currentYear, 6, 4, 8, 39, 0);

      const to = dateRange.toDateTime;
      checkDate(to, currentYear, 8, 8, 12, 34, 0);
    });

    test.each(sp())("casual times 9", (p) => {
      const markwhen = p("June 4 2020 8:39 - 8 August 12:34: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      const from = dateRange.fromDateTime;
      checkDate(from, 2020, 6, 4, 8, 39, 0);

      const to = dateRange.toDateTime;
      checkDate(to, currentYear, 8, 8, 12, 34, 0);
    });

    test.each(sp())("casual times 10", (p) => {
      const markwhen = p("4 Jun 2020 8:39 - 8 aug 2022 12:34: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      const from = dateRange.fromDateTime;
      checkDate(from, 2020, 6, 4, 8, 39, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 2022, 8, 8, 12, 34, 0);
    });

    test.each(sp())("casual times with comma", (p) => {
      const markwhen = p("4 Jun 2020, 8:39 - 8 aug 2022, 12:34: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      const from = dateRange.fromDateTime;
      checkDate(from, 2020, 6, 4, 8, 39, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 2022, 8, 8, 12, 34, 0);
    });
  });

  describe("slash dates and times", () => {
    test.each(sp())("1", (p) => {
      const markwhen = p(
        "dateFormat: d/M/y\n5/9/2009 18:00: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event"
      );

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2009, 9, 5, 18, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2009, 9, 5, 18, 0, 0);
    });

    test.each(sp())("2", (p) => {
      const markwhen = p(
        "dateFormat: d/M/y\n5/9/2009 18:00 - May 12 2011 6pm: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event"
      );

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2009, 9, 5, 18, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2011, 5, 12, 18, 0, 0);
    });

    test.each(sp())("with commas", (p) => {
      const markwhen = p(`
dateFormat: d/M/y
5/9/2009, 18:00 - May 12 2011, 6pm: event
May 12 2011, 6pm - 5/9/2099, 18:00: event
5/12/2011, 6pm - 5/9/2099, 18:00: event
1 month 1 day: next event
3 years 8 days 1 month: third event`);

      let dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2009, 9, 5, 18, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2011, 5, 12, 18, 0, 0);

      let { fromDateTime, toDateTime } = toDateRange(
        nthEvent(markwhen, 1).dateRangeIso
      );
      checkDate(fromDateTime, 2011, 5, 12, 18, 0, 0);
      checkDate(toDateTime, 2099, 9, 5, 18, 0, 0);

      let { fromDateTime: fromDateTime1, toDateTime: toDateTime1 } =
        toDateRange(nthEvent(markwhen, 2).dateRangeIso);
      checkDate(fromDateTime1, 2011, 12, 5, 18, 0, 0);
      checkDate(toDateTime1, 2099, 9, 5, 18, 0, 0);
    });

    test.each(sp())("commas 2", (p) => {
      const markwhen = p(`
12/15/2022, 8:00AM - 12/15/2022, 9:30AM: Event`);

      let dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 12, 15, 8, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2022, 12, 15, 9, 30, 0);
    });
  });

  describe("etdf dates", () => {
    test.each(sp())("yyyy", (p) => {
      const markwhen = p("2022: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 1, 1, 0, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2023, 1, 1, 0, 0, 0);
    });

    test.each(sp())("yyyy-mm", (p) => {
      const markwhen = p("2022-06: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 1, 0, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2022, 7, 1, 0, 0, 0);
    });

    test.each(sp())("yyyy-mm-dd", (p) => {
      const markwhen = p("2022-06-07: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 7, 0, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2022, 6, 8, 0, 0, 0);
    });

    test.each(sp())("yyyy-mm-dd/yyyy", (p) => {
      const markwhen = p("2022-06-07/2023: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 7, 0, 0, 0);

      let to = dateRange.toDateTime;
      // to the end of 2023
      checkDate(to, 2024, 1, 1, 0, 0, 0);
    });

    test.each(sp())("yyyy-mm-dd/yyyy-mm", (p) => {
      const markwhen = p("2022-06-07/2023-11: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 7, 0, 0, 0);

      let to = dateRange.toDateTime;
      // to the end of november
      checkDate(to, 2023, 12, 1, 0, 0, 0);
    });

    test.each(sp())("yyyy-mm-dd/yyyy-mm-dd", (p) => {
      const markwhen = p("2022-06-07/2023-02-21: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 7, 0, 0, 0);

      let to = dateRange.toDateTime;
      // to the end of feb 21
      checkDate(to, 2023, 2, 22, 0, 0, 0);
    });

    test.each(sp())("yyyy-mm/yyyy-mm-dd", (p) => {
      const markwhen = p("2022-06/2023-09-09: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 1, 0, 0, 0);

      let to = dateRange.toDateTime;
      // to the end of 2023
      checkDate(to, 2023, 9, 10, 0, 0, 0);
    });

    test.each(sp())("yyyy-mm/relative", (p) => {
      const markwhen = p("2022-06/3 weeks: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 1, 0, 0, 0);

      let to = dateRange.toDateTime;
      checkDateTime(to, from.plus({ weeks: 3 }));
    });

    test.each(sp())("yyyy-mm/relative", (p) => {
      const markwhen = p(
        `2021: a thing
2022-06/3 weeks: am i stupid or what
8 days 6 minutes/2023: event`
      );

      const secondRange = toDateRange(nthEvent(markwhen, 1).dateRangeIso);
      let from = secondRange.fromDateTime;
      checkDate(from, 2022, 6, 1, 0, 0, 0);

      let to = secondRange.toDateTime;
      checkDateTime(to, from.plus({ weeks: 3 }));

      const thirdRange = toDateRange(nthEvent(markwhen, 2).dateRangeIso);
      checkDateTime(
        thirdRange.fromDateTime,
        secondRange.toDateTime.plus({ days: 8, minutes: 6 })
      );
    });

    test.each(sp())("yyyy-mm/relative", (p) => {
      const markwhen = p("2022-09/3 weeks: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 9, 1, 0, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2022, 9, 22);
    });

    test.each(sp())("yyyy-mm/week day", (p) => {
      const markwhen = p("2022-09/3 weekdays: event");

      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 9, 1, 0, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2022, 9, 6);
    });
  });

  describe("work/week days", () => {
    test.each(sp())("Less than a week", (p) => {
      const markwhen = p(`
July 10, 2022: Sunday
5 work days: til friday
`);

      const secondRange = toDateRange(nthEvent(markwhen, 1).dateRangeIso);
      // Til the end of Friday
      checkDate(secondRange.toDateTime, 2022, 7, 16, 0, 0, 0);
    });

    test.each(sp())("Less than a week (week)", (p) => {
      const markwhen = p(`
July 10, 2022: Sunday
5 week days: til friday
`);

      const secondRange = toDateRange(nthEvent(markwhen, 1).dateRangeIso);
      // Til the end of Friday
      checkDate(secondRange.toDateTime, 2022, 7, 16, 0, 0, 0);
    });

    test.each(sp())("Span over a weekend", (p) => {
      const markwhen = p(`
July 10, 2022: Sunday
10 work days: til next friday
`);

      const secondRange = toDateRange(nthEvent(markwhen, 1).dateRangeIso);
      // Til the end of Friday
      checkDate(secondRange.toDateTime, 2022, 7, 23, 0, 0, 0);
    });

    test.each(sp())("From middle of week", (p) => {
      const markwhen = p(`
July 13, 2022 - 10 workdays: til next friday
`);

      const firstRange = toDateRange(nthEvent(markwhen, 0).dateRangeIso);
      // Til the end of Friday
      checkDate(firstRange.toDateTime, 2022, 7, 27, 0, 0, 0);
    });

    test.each(sp())("As from and to times", (p) => {
      const markwhen = p(`
July 11, 2022: Monday

// This is 10 work days after July 10, lasting for 10 work days
10 work days - 10 work days: til next friday
`);

      const secondRange = toDateRange(nthEvent(markwhen, 1).dateRangeIso);
      checkDate(secondRange.fromDateTime, 2022, 7, 26);
      checkDate(secondRange.toDateTime, 2022, 8, 9);
    });

    test.each(sp())("As from and to times (week)", (p) => {
      const markwhen = p(`
July 11, 2022: Monday

// This is 10 work days after July 10, lasting for 10 work days
10 week days - 10 week days: til next friday
`);

      const secondRange = toDateRange(nthEvent(markwhen, 1).dateRangeIso);
      checkDate(secondRange.fromDateTime, 2022, 7, 26);
      checkDate(secondRange.toDateTime, 2022, 8, 9);
    });

    test.each(sp())("Business/week/work days", (p) => {
      const markwhen = p(`
July 11, 2022: Monday

// This is 10 work days after July 10, lasting for 10 work days
10 business days - 10 week days: til next friday

// beginning of the 13th til beginning of 20th
4 week days - 1 week: third event
`);

      const secondRange = toDateRange(nthEvent(markwhen, 1).dateRangeIso);
      checkDate(secondRange.fromDateTime, 2022, 7, 26);
      checkDate(secondRange.toDateTime, 2022, 8, 9);

      const thirdRange = toDateRange(nthEvent(markwhen, 2).dateRangeIso);
      checkDate(thirdRange.fromDateTime, 2022, 8, 13);
      checkDate(thirdRange.toDateTime, 2022, 8, 20);
    });

    test.each(sp())("Before 1", (p) => {
      const markwhen = p(`
July 11 2022: !monday Monday

by !monday 7 work days: event
`);

      const [first, second] = getDateRanges(markwhen);

      checkDate(second.fromDateTime, 2022, 6, 30);
      checkDateTime(second.toDateTime, first.fromDateTime);
    });

    test.each(sp())("Before 2", (p) => {
      const markwhen = p(`
July 11 2022: !monday Monday

August 18 2022: another event

by !monday 7 work days: event
`);

      const [first, , third] = getDateRanges(markwhen);

      checkDate(third.fromDateTime, 2022, 6, 30);
      checkDateTime(third.toDateTime, first.fromDateTime);
    });

    test.each(sp())("Before 3", (p) => {
      const markwhen = p(`
July 11 2022: !monday Monday

August 18 2022: another event

by 7 work days: event
`);

      const [, second, third] = getDateRanges(markwhen);

      checkDate(third.fromDateTime, 2022, 8, 9);
      checkDateTime(third.toDateTime, second.fromDateTime);
    });

    test.each(sp())("Before 4", (p) => {
      const markwhen = p(`
July 11 2022: !monday Monday

August 18 2022: another event

by !monday 7 work days: event
`);

      const [first, , third] = getDateRanges(markwhen);

      checkDate(third.fromDateTime, 2022, 6, 30);
      checkDateTime(third.toDateTime, first.fromDateTime);
    });

    test.each(sp())("Before 5", (p) => {
      const markwhen = p(`
group
July 11 2022: !monday Monday
endGroup
August 18 2022: another event
group
by !monday 7 work days: event
endGroup
`);

      const [first, , third] = getDateRanges(markwhen);

      checkDate(third.fromDateTime, 2022, 6, 30);
      checkDateTime(third.toDateTime, first.fromDateTime);
    });

    test.each(sp())("Before 6", (p) => {
      const markwhen = p(`dateFormat: d/M/y
#announcements: red
10/4/2023: ANNUAL CHURCH MEETING !ACM

10/2/2023: Event !event
before !event 10 week days: revise voting eligibility list
January 27 2023 - 10 week days: something`);

      const [, , third, fourth] = getDateRanges(markwhen);

      checkDateTime(fourth.fromDateTime, third.fromDateTime);
      checkDateTime(fourth.toDateTime, third.toDateTime);
    });

    test.each(sp())("Before with buffer", (p) => {
      const markwhen = p(`
group
July 11 2022: !monday Monday
endGroup
August 18 2022: another event
group

// 3 work days before !monday, for 7 business days
by !monday 3 week days - 7 business days: event
endGroup
`);

      const [first, , third] = getDateRanges(markwhen);

      checkDate(third.fromDateTime, 2022, 6, 27);
      checkDate(third.toDateTime, 2022, 7, 6);
    });

    test.each(sp())("Before with buffer", (p) => {
      const markwhen = p(`
group
July 11 2022: !monday Monday
endGroup
August 18 2022: another event
group

// 3 work days before !monday, for 7 business days
by !monday 3 week days - 7 business days: event
endGroup
`);

      const [first, , third] = getDateRanges(markwhen);

      checkDate(third.fromDateTime, 2022, 6, 27);
      checkDate(third.toDateTime, 2022, 7, 6);
    });
  });

  describe("tags", () => {
    test.each(sp())("skips number only", (p) => {
      const markwhen = p(`title: my timelines
description: my description
now - 10 years: an event #1
1 year: event #2
3 years: event #third`);

      const tagLiterals = nthEvent(markwhen, 0).tags.filter((k) =>
        k.startsWith(")")
      );
      expect(tagLiterals).toHaveLength(0);
      expect(nthEvent(markwhen, 2).tags).toContainEqual("third");
    });

    test.each(sp())(
      "tags are picked up when they're not on the first line",
      (p) => {
        const markwhen = p(`title: my timelines
description: my description
now - 10 years: an event #1 #3342 #098
1 year: event #2 
#another 
#tag with text after it
3 years: event #third #fourth 
#fifth #332334b #5
#other`);
        const second = nthEvent(markwhen, 1);
        expect(second.tags).toContain("another");
        expect(second.tags).toContain("tag");
        expect(nthEvent(markwhen, 2).tags).toContain("fifth");
        expect(nthEvent(markwhen, 2).tags).toContain("other");
      }
    );
  });

  describe.skip("due dates & relative dates", () => {
    test.each(sp())("to event 1", (p) => {
      const markwhen = p(`
2024: !event1 event
2022/!event1: from 2022 to !event1
      `);

      const [first, second] = getDateRanges(markwhen);

      checkDate(second.fromDateTime, 2022, 1, 1);
      checkDate(second.toDateTime, 2024, 1, 1);
    });

    test.each(sp())("to event 2", (p) => {
      const markwhen = p(`
2024: !event1 event
2022 - !event1: from 2022 to !event1
      `);

      const [first, second] = getDateRanges(markwhen);

      checkDate(second.fromDateTime, 2022, 1, 1);
      checkDate(second.toDateTime, 2024, 1, 1);
    });

    test.each(sp())("to event 3", (p) => {
      const markwhen = p(`
2024: !event1 event
!event1/2025: from 2024 to 2025
`);

      const [first, second] = getDateRanges(markwhen);

      checkDate(second.fromDateTime, 2022, 1, 1);
      checkDate(second.toDateTime, 2024, 1, 1);
    });

    test.each(sp())("to event 4", (p) => {
      const markwhen = p(`
2024: !event1 event
!event1 - 2025: from 2024 to 2025
`);

      const [first, second] = getDateRanges(markwhen);

      checkDate(second.fromDateTime, 2022, 1, 1);
      checkDate(second.toDateTime, 2024, 1, 1);
    });
  });

  describe("viewers and editors", () => {
    test.each(sp())("no viewers specified, none parsed", (p) => {
      const markwhen = p(`title: my timelines
description: my description
now - 10 years: an event`);

      expect(markwhen.header.view).toBeFalsy();
    });

    test.each(sp())("Single viewer", (p) => {
      const markwhen = p(`title: my timelines

view: example@example.com

description: my description
now - 10 years: an event`);

      const viewers = markwhen.header.view;
      expect(typeof viewers).toBe("object"); // array
      expect(viewers.length).toBe(1);
      expect(viewers).toContain("example@example.com");
    });

    test.each(sp())("Multiple viewers", (p) => {
      const markwhen = p(`title: my timelines

view: example@example.com, example2@example.com someoneelse@g.co

description: my description
now - 10 years: an event`);

      const viewers = markwhen.header.view;
      [
        "example@example.com",
        "example2@example.com",
        "someoneelse@g.co",
      ].forEach((e) => expect(viewers).toContain(e));
    });

    test.each(sp())("no editors specified, none parsed", (p) => {
      const markwhen = p(`title: my timelines
description: my description
now - 10 years: an event`);

      expect(markwhen.header.edit).toBeFalsy();
    });

    test.each(sp())("Single editor", (p) => {
      const markwhen = p(`title: my timelines

edit: example@example.com

description: my description
now - 10 years: an event`);

      const editors = markwhen.header.edit;
      expect(typeof editors).toBe("object");
      expect(editors.length).toBe(1);
      expect(editors).toContain("example@example.com");
    });

    test.each(sp())("Multiple editors", (p) => {
      const markwhen = p(`title: my timelines

edit: example@example.com, example2@example.com someoneelse@g.co

description: my description
now - 10 years: an event`);

      const editors = markwhen.header.edit;
      [
        "example@example.com",
        "example2@example.com",
        "someoneelse@g.co",
      ].forEach((e) => expect(editors).toContain(e));
    });

    test.each(sp())("Viewers and editors 1", (p) => {
      const markwhen = p(`title: my timelines

view: me@example.com, someone@google.com b@g.i
edit: example@example.com, example2@example.com someoneelse@g.co

description: my description
now - 10 years: an event`);

      const editors = markwhen.header.edit;
      [
        "example@example.com",
        "example2@example.com",
        "someoneelse@g.co",
      ].forEach((e) => expect(editors).toContain(e));
      const viewers = markwhen.header.view;
      ["me@example.com", "someone@google.com", "b@g.i"].forEach((e) =>
        expect(viewers).toContain(e)
      );
    });

    test.each(sp())("Viewers and editors 2", (p) => {
      const markwhen = p(`title: my timelines

edit: example@example.com, example2@example.com someoneelse@g.co
view: me@example.com, someone@google.com b@g.i

description: my description
now - 10 years: an event`);

      const editors = markwhen.header.edit;
      [
        "example@example.com",
        "example2@example.com",
        "someoneelse@g.co",
      ].forEach((e) => expect(editors).toContain(e));
      const viewers = markwhen.header.view;
      ["me@example.com", "someone@google.com", "b@g.i"].forEach((e) =>
        expect(viewers).toContain(e)
      );
    });
  });

  describe("Date range parsing", () => {
    test("parse now", () => {
      const range = parseDateRange("now:");
      expect(range).toBeTruthy();
      expect(range?.fromDateTime.day).toBe(range?.toDateTime.day);
    });

    test("parse month", () => {
      const range = parseDateRange("10/2022:");
      expect(range).toBeTruthy();
      checkDate(range!.fromDateTime, 2022, 10, 1);
      checkDate(range!.toDateTime, 2022, 11, 1);
    });

    test("parse range", () => {
      const range = parseDateRange("2000-02-21/2001-01-01:");
      expect(range).toBeTruthy();
      checkDate(range!.fromDateTime, 2000, 2, 21);
      checkDate(range!.toDateTime, 2001, 1, 2);
    });

    test("parse relative", () => {
      const range = parseDateRange("2000-02-21 / 3 years:");
      expect(range).toBeTruthy();
      checkDate(range!.fromDateTime, 2000, 2, 21);
      checkDate(range!.toDateTime, 2003, 2, 21);
    });
  });
});

describe("nested groups", () => {
  test.each(sp())("can nest groups", (p) => {
    const mw = p(`

now: 1

group 1
now: 2

group 2
now: 3
now: 4
now: 5

endGroup

now: 6
now: 7

endGroup

now: 8
now: 9

`);

    let head: Eventy = mw.events;
    const flt = flat(head);
    expect(flt).toHaveLength(9);
  });

  test.each(sp())("can iterate nodes", (p) => {
    const mw = p(`

now: 1

group 1
now: 2

group 2
now: 3
now: 4
now: 5

endGroup

now: 6
now: 7

group surprise
now: 8
endGroup

endGroup

group extra special
group
now: 9
endGroup
now: 10
endGroup
`);

    /**
     * [0]
     *     [1]
     *     [1, 0]
     *         [1, 1]
     *         [1, 1, 0]
     *             [1, 1, 1]
     *                [1, 1, 2]
     *                    [1, 2]
     *                       [1, 3]
     *                           [1, 4]
     *                           [1, 4, 0]
     *                                [2]
     *                                [2, 0]
     *                                [2, 0, 0]
     *                                      [2, 1]
     * [1, [2, [3, 4, 5], 6, 7, [8]], [[9], 10]]]
     */

    const numNodes = 16;
    let i = 0;
    let s = ``;
    const asArray = toArray(mw.events);
    for (const { path, eventy } of iter(mw.events)) {
      expect(JSON.stringify(asArray[i].path)).toEqual(JSON.stringify(path));
      expect(JSON.stringify(asArray[i].eventy)).toEqual(JSON.stringify(eventy));
      i++;
    }
    expect(i).toEqual(numNodes);
  });

  test.each(sp())("deeply nested path", (p) => {
    const mw = p(`
group 1
group 2
group 3
group 4
group 5
group 6
group 7
group 8
group 9
group 10
2021: an event
`);

    for (const { path, eventy } of iter(mw.events)) {
      if (isEvent(eventy)) {
        // The path of the node with an actual event
        expect(path).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      }
    }
  });
});

describe("mrakdown style image", () => {
  test.each(sp())("images are parsed", (p) => {
    const mw = p(`
now: hello ![](example.com/image)
![](https://example.com/image2.jpg)

    `);

    const supplemental = (get(mw.events, [0]) as Event)?.supplemental;
    expect(supplemental).toBeTruthy();
    expect(supplemental).toHaveLength(2);
    expect(supplemental?.[0].type).toBe("image");
    expect((supplemental?.[0] as Image).link).toBe("http://example.com/image");
  });

  test.each(sp())("image text is removed from first line", (p) => {
    const mw = p(`
now: hello ![](example.com/image)
![](https://example.com/image2.jpg)

    `);

    const firstEvent = get(mw.events, [0]) as Event;
    expect(firstEvent?.firstLine.restTrimmed).toBe("hello ");
  });

  test.each(sp())("images 3", (p) => {
    const mw = p(
      `10/2010: Barn built across the street ![](https://commons.wikimedia.org/wiki/File:Suzanna_Randall_at_ESO_Headquarters_in_Garching,_Germany.jpg#/media/File:Suzanna_Randall_at_ESO_Headquarters_in_Garching,_Germany.jpg)`
    );

    const firstEvent = get(mw.events, [0]) as Event;
    expect(firstEvent?.firstLine.restTrimmed).toBe(
      "Barn built across the street "
    );
  });

  test.each(sp())("supplemental items appear in order", (p) => {
    const mw =
      p(`10/2010: Barn built across the street ![](https://user-images.githubusercontent.com/10823320/199108323-99529603-fab1-485c-ae7f-23c8cbab6918.png)
some text in the middle

![](https://user-images.githubusercontent.com/10823320/199339494-310d9159-238c-4ba6-be8c-57906d77c08e.png)

other middle text

![](https://user-images.githubusercontent.com/10823320/199339494-310d9159-238c-4ba6-be8c-57906d77c08e.png)

- [] checkbox
some text after`);

    const firstEvent = get(mw.events, [0]) as Event;
    const supplemental = firstEvent?.supplemental;
    expect(supplemental).toBeTruthy();
    expect(supplemental).toHaveLength(7);
    expect(supplemental![0].type).toBe("image");
    expect(supplemental![1].type).toBe("text");
    expect(supplemental![2].type).toBe("image");
    expect(supplemental![3].type).toBe("text");
    expect(supplemental![4].type).toBe("image");
    expect(supplemental![5].type).toBe("checkbox");
    expect(supplemental![6].type).toBe("text");
  });
});

describe("ranges", () => {
  test("ranges that abut end of string", () => {
    const mw = parse(`
timezone: +5

#generalGrievous:
  timezone: +0

#t:
  timezone: -5

group #generalGrievous

group #t

2023-05-01: this is an event in asia or something

2023-05-01: this is an event in the  uk timezone
#generalGrievous

endGroup

endGroup

2023-05-01: this is an event in the UK timezone

#generalGrievous


2023-05-01: this`);

    expect(mw.events.children[2].textRanges.whole.to).toBe(325);
  });

  test("ranges that abut the end of the string 1", () => {
    const mw = parse("now: event!");
    expect(mw.events.children[0].textRanges.whole.to).toBe(
      "now: event!".length
    );
  });

  test("event range starts at beginning of line", () => {
    const mw = parse(`  now: this is an event
    
    1834: this is also an event`);

    expect(nthEvent(mw, 0).textRanges.whole.from).toBe(0);
    expect(nthEvent(mw, 1).textRanges.whole.from).toBe(29);
  });

  test("section ranges 1", () => {
    const s = `section Section
now: this is podracing 
endSection`;
    const mw = parse(s);

    expect(mw.events.children[0].textRanges.whole.from).toBe(0);
    expect(mw.events.children[0].textRanges.whole.to).toBe(s.length);
  });

  test("section ranges 2", () => {
    const s = `section Section
now: this is podracing 

group new group
2025-01-30: hello
endGroup

endSection`;
    const mw = parse(s);

    const section = mw.events.children[0] as EventGroup;
    expect(section.textRanges.whole.from).toBe(0);
    expect(section.textRanges.whole.to).toBe(s.length);

    const group = section.children[1] as EventGroup;
    expect(group.textRanges.whole.from).toBe(41);
    expect(group.textRanges.whole.to).toBe(83);
  });

  test("section ranges 2", () => {
    const s = `section Section
now: this is podracing 

group new group
2025-01-30: hello`;
    const mw = parse(s);

    const section = mw.events.children[0] as EventGroup;
    expect(section.textRanges.whole.from).toBe(0);
    expect(section.textRanges.whole.to).toBe(s.length);

    const group = section.children[1] as EventGroup;
    expect(group.textRanges.whole.from).toBe(41);
    expect(group.textRanges.whole.to).toBe(s.length);
  });

  test("section ranges 3", () => {
    const s = `:is this an event or is it no
this does not seem to be as much of an issue with other things going on excefdjksla fjeils a;fjl;eisa 
section Welcome #welcome
now: This example timeline showcases some of markwhen's features.

Feel free to delete everything to start making your own timeline #welcome

now: You can also view this example timeline at [markwhen.com/example](https://markwhen.com/example) #welcome

Or you can save this timeline so you can refer to it later, by going to Browser storage & files, and clicking Save current.
but now if i go over here it's all fucked up
now: For more information, view the documentation [here](https://docs.markwhen.com) or join the [discord](https://discord.gg/3rTpUD94ac)
#welcome
endSection

section All Projects
group Project 1 #Project1
// Supports ISO8601
2023-01/2023-03: Sub task #John
2023-03/2023-06: Sub task 2 #Michelle
More info about sub task 2

- [ ] We need to get this done
- [x] And this
- [ ] This one is extra

2023-07: Yearly planning
endGroup
 group Project 2 #Project2
2023-04/4 months: Larger sub task #Danielle

// Supports American date formats
03/2023 - 1 year: Longer ongoing task #Michelle

- [x] Sub task 1
- [x] Sub task 2
- [ ] Sub task 3
- [ ] Sub task 4
- [ ] so many checkboxes omg
`;
    const mw = parse(s);
    const midSection = get(mw.events, [2]) as EventGroup;
    expect(midSection.textRanges.whole.from).toBe(738);
    expect(midSection.textRanges.whole.to).toBe(s.length);
  });
});

describe("completion", () => {
  test.each(sp())(
    "checkbox in event description line indicates completion",
    () => {
      const mw = parse(`
now: [] some item

2 days: [] another item

4 days: third item

6 days: [x] last item`);
      let event = nthEvent(mw, 0);
      expect(event.completed).toBe(false);

      event = nthEvent(mw, 1);
      expect(event.completed).toBe(false);

      event = nthEvent(mw, 2);
      expect(event.completed).toBe(undefined);

      event = nthEvent(mw, 3);
      expect(event.completed).toBe(true);
    }
  );

  test.each(sp())("completion items have correct ranges", () => {
    const mw = parse(`
now:  [] some item

2 days: [] another item

4 days: third item

6 days: [x] last item`);
    let event = nthEvent(mw, 0);
    const ranges = mw.ranges.filter(
      (r) => r.type === RangeType.CheckboxItemIndicator
    );
    expect(ranges.length).toBe(3);

    expect(ranges[0].from).toBe(5);
    expect(ranges[0].to).toBe(9);
    expect(ranges[0].content).toBe(false);

    expect(ranges[1].from).toBe(28);
    expect(ranges[1].to).toBe(31);
    expect(ranges[1].content).toBe(false);

    expect(ranges[2].from).toBe(73);
    expect(ranges[2].to).toBe(77);
    expect(ranges[2].content).toBe(true);
  });

  // test.each(sp())("checklist item range", () => {
  //   const mw = `1999-09: birthday
  // - [] checklist item
  // - list item`;
  //   const parsed = parse(mw);
  //   let visited = false;
  //   for (const range of parsed.ranges) {
  //     if (range.type === RangeType.CheckboxItemIndicator) {
  //       visited = true;
  //       expect(range.from).toBe(22);
  //       expect(range.to).toBe(23);
  //     }
  //     if (range.type === RangeType.listItemIndicator) {
  //       // expect(range.from).toBe()
  //     }
  //   }
  //   expect(visited).toBe(true);
  // });
});

describe("recurrence", () => {
  test.each(sp())("edtf recurrence 1", (p) => {
    const mw = p(
      `2019-01-01 / 2022-08-07 every 3 days for 3 days: event title`
    );

    const first = nthEvent(mw, 0);
    expect(first.recurrence).toBeTruthy();
    expect(first.recurrence?.count).toBe(3);
    expect(first.recurrence?.freq).toBe(3);
    // expect(first.recurrence?.every.days).toBe(3);
    // expect(first.recurrence?.for?.days).toBe(3);
  });

  test.each(sp())("edtf recurrence 2", (p) => {
    const mw = p(`2022-08-07 every 12 months x30: event title`);

    const first = nthEvent(mw, 0);
    expect(first.recurrence).toBeTruthy();
    expect(first.recurrence?.interval).toBe(12);
    expect(first.recurrence?.freq).toBe(1);
    expect(first.recurrence?.count).toBe(30);
  });

  test.each(sp())("edtf recurrence 3", (p) => {
    const mw = p(`2022-08-07 every 2 years for 10 times: event title`);

    const first = nthEvent(mw, 0);
    expect(first.recurrence).toBeTruthy();
    expect(first.recurrence?.interval).toBe(2);
    expect(first.recurrence?.count).toBe(10);
    // expect(first.recurrence?.every.years).toBe(2);
    // expect(first.recurrence?.for?.times).toBe(10);
  });

  test.each(sp())("recurrence 1", (p) => {
    const mw = p(`Dec 1 2022 every 2 years: event title`);

    const first = nthEvent(mw, 0);
    expect(first.recurrence).toBeTruthy();
    // expect(first.recurrence?.every.years).toBe(2);
    // expect(first.recurrence?.for).toBeFalsy();
  });

  test.each(sp())("recurrence 2", (p) => {
    const mw = p(`Dec 1 every day for 10 years: event title`);

    const first = nthEvent(mw, 0);
    expect(first.recurrence).toBeTruthy();
    // expect(first.recurrence?.every.days).toBe(1);
    // expect(first.recurrence?.for?.years).toBe(10);
  });

  test.each(sp())("recurrence 3", (p) => {
    const mw = p(`Dec 1 every 40 days for 1 second: event title`);

    const first = nthEvent(mw, 0);
    expect(first.recurrence).toBeTruthy();
    // expect(first.recurrence?.every.days).toBe(40);
    // expect(first.recurrence?.for?.seconds).toBe(1);
  });

  test.each(sp())("recurrence range 1", (p) => {
    const mw = p(`Dec 1 every 40 days for 1 second: event title`);

    const first = nthEvent(mw, 0);
    expect(first.textRanges.recurrence?.from).toBe(6);
    expect(first.textRanges.recurrence?.to).toBe(32);
  });

  test.each(sp())("recurrence range 2", (p) => {
    const mw = p(`2022-08-07 every 12 months x30: event title`);

    const first = nthEvent(mw, 0);
    expect(first.textRanges.recurrence?.from).toBe(11);
    expect(first.textRanges.recurrence?.to).toBe(30);
  });

  test.each(sp())("recurrence with space between colon", (p) => {
    const string = `2022-08-07 every 12 months x30  : event title`;
    const mw = p(string);

    const first = nthEvent(mw, 0);
    expect(first.recurrence).toBeTruthy();
    expect(first.textRanges.recurrence?.from).toBe(11);
    expect(first.textRanges.recurrence?.to).toBe(30);
    expect(first.firstLine.restTrimmed).toBe("event title");

    const colonRange = mw.ranges.find((range) => range.to - range.from === 1);
    expect(colonRange).toBeTruthy();
    expect(colonRange?.from).toBe(32);
    expect(colonRange?.type).toBe(RangeType.DateRangeColon);
  });
});

describe("premature year parsing", () => {
  test.each(sp())("two digits aren't parsed as a year", (p) => {
    const string = "12: this should be noon";
    const mw = p(string);
    const first = nthEvent(mw, 0);
    const fromDt = DateTime.fromISO(first.dateRangeIso.fromDateTimeIso);
    expect(fromDt.hour).toBe(12);
    expect(fromDt.year).toBe(DateTime.now().year);
  });

  test.each(sp())("two digits > 24 aren't parsed as a year", (p) => {
    const string = "20: this should be 8pm";
    const mw = p(string);
    const first = nthEvent(mw, 0);
    const fromDt = DateTime.fromISO(first.dateRangeIso.fromDateTimeIso);
    expect(fromDt.hour).toBe(20);
    expect(fromDt.year).toBe(DateTime.now().year);
  });

  test.each(sp())("standalone digits aren't parsed as date", (p) => {
    const s = "9";
    const mw = p(s);
    expect(mw.events.children.length).toBe(0);
  });

  test.each(sp())("standalone digits aren't parsed as date", (p) => {
    const s = "12 this doesn't work";
    const mw = p(s);
    expect(mw.events.children.length).toBe(0);
  });

  test.each(sp())("standalone digits aren't parsed as date", (p) => {
    const s = "1988 this doesn't work";
    const mw = p(s);
    expect(mw.events.children.length).toBe(0);
  });
});

describe("version", () => {
  test("outputs the right version", () => {
    const pack = readFileSync(resolve("./", "package.json"), "utf-8");
    const version = JSON.parse(pack).version;
    expect(parse("").parser.version).toBe(version);
  });
});

describe("relative dates", () => {
  test("diff obj matches diff string 1", () => {
    const diffOb = RelativeDate.diffFromString("1 day 6 hours");
    expect(diffOb.days).toBe(1);
    expect(diffOb.hours).toBe(6);
  });
  test("diff obj matches diff string 2", () => {
    const diffOb = RelativeDate.diffFromString("now - 3 months 12 seconds");
    expect(diffOb.months).toBe(3);
    expect(diffOb.seconds).toBe(12);
  });
});

describe("edtf casual times", () => {
  test.each(sp())("no range", (p) => {
    const mw = p(`2023-10-30 9am: yes of course`);
    expect(
      DateTime.fromISO(firstEvent(mw).dateRangeIso.fromDateTimeIso).hour
    ).toBe(9);
  });

  test.each(sp())("range", (p) => {
    const mw = p(`2023-10-30 9pm / 2023-11-11 13:00: yes of course`);
    const e = firstEvent(mw);
    const from = DateTime.fromISO(e.dateRangeIso.fromDateTimeIso);
    const to = DateTime.fromISO(e.dateRangeIso.toDateTimeIso);
    expect(from.hour).toBe(21);
    expect(to.hour).toBe(13);
  });

  test.each(sp())("minute", (p) => {
    const mw = p(`2023-10-30 9:19pm / 2023-11-11 13:00: yes of course`);
    const e = firstEvent(mw);
    const from = DateTime.fromISO(e.dateRangeIso.fromDateTimeIso);
    const to = DateTime.fromISO(e.dateRangeIso.toDateTimeIso);
    expect(from.hour).toBe(21);
    expect(from.minute).toBe(19);
    expect(to.hour).toBe(13);
  });
});

function getEvents(m: ParseResult) {
  return flat(m.events);
}

function checkDate(
  dateTime: DateTime,
  year?: number | DateTime,
  month?: number,
  day?: number,
  hour?: number,
  minute?: number,
  second?: number
) {
  if (year instanceof DateTime) {
    checkDateTime(dateTime, year);
  }
  if (year !== undefined) {
    expect(dateTime.year).toBe(year);
  }
  if (month !== undefined) {
    expect(dateTime.month).toBe(month);
  }
  if (day !== undefined) {
    expect(dateTime.day).toBe(day);
  }
  if (hour !== undefined) {
    expect(dateTime.hour).toBe(hour);
  }
  if (minute !== undefined) {
    expect(dateTime.minute).toBe(minute);
  }
  if (second !== undefined) {
    expect(dateTime.second).toBe(second);
  }
}
