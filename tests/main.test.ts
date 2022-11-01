import { parse, parseDateRange } from "../src/index";
import { Timelines, Event, DateRange } from "../src/Types";
import { DateTime } from "luxon";
import { DAY_AMOUNT_REGEX } from "../src/regex";

const firstEvent = (markwhen: Timelines) =>
  markwhen.timelines[0].events[0] as Event;

describe("parsing", () => {
  test("ISO dates", async () => {
    const markwhen = parse("2022-05-01T12:13:14.00Z: some event");

    const { fromDateTime } = firstEvent(markwhen).ranges.date as DateRange;
    const asIso = DateTime.fromISO("2022-05-01T12:13:14.00Z");
    expect(fromDateTime.equals(asIso)).toBe(true);
  });

  test("ISO date range", async () => {
    const markwhen = parse(
      "2022-05-01T12:13:14.00Z-2024-01-27T18:13:59.00Z: some event"
    );

    const dateRange = firstEvent(markwhen).ranges.date as DateRange;

    expect(
      dateRange.fromDateTime.equals(DateTime.fromISO("2022-05-01T12:13:14.00Z"))
    ).toBe(true);
    expect(
      dateRange.toDateTime.equals(DateTime.fromISO("2024-01-27T18:13:59.00Z"))
    ).toBe(true);
  });

  test("ISO date range with space", async () => {
    const markwhen = parse(
      "2022-05-01T12:13:14.00Z - 2024-01-27T18:13:59.00Z: some event"
    );

    const dateRange = firstEvent(markwhen).ranges.date as DateRange;

    expect(
      dateRange.fromDateTime.equals(DateTime.fromISO("2022-05-01T12:13:14.00Z"))
    ).toBe(true);
    expect(
      dateRange.toDateTime.equals(DateTime.fromISO("2024-01-27T18:13:59.00Z"))
    ).toBe(true);
  });

  test("year by itself", async () => {
    const markwhen = parse("1999: event");

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("year to year", async () => {
    const markwhen = parse("1999 - 2099: event");

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("slash month 1", async () => {
    const markwhen = parse("04/2010: event");

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("slash month 2", async () => {
    const markwhen = parse("04/2010 - 2010: event");

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("slash month 3", async () => {
    const markwhen = parse("04/2010 - 08/2012: event");

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("slash month 4", async () => {
    const markwhen = parse("1945- 7/2010: event");

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("american slash day 1", async () => {
    const markwhen = parse("04/25/1945- 7/2010: event");

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("american slash day 2", async () => {
    const markwhen = parse("12/3/1945 -04/7/2010: event");

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("american slash day 3", async () => {
    const markwhen = parse("2000 - 09/22/2010: event");

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("european slash day 1", async () => {
    const markwhen = parse("dateFormat: d/M/y\n2000 - 09/12/2010: event");

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("european slash day 2", async () => {
    const markwhen = parse("dateFormat: d/M/y\n5/9/2009 - 09/2010: event");

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("european slash day 3", async () => {
    const markwhen = parse(
      "dateFormat: d/M/y\n5/9/2009 - 2024-01-27T18:13:59.00Z: event"
    );

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("european slash day 4", async () => {
    const markwhen = parse(
      "dateFormat: d/M/y\n2024-01-27T18:13:59.00Z - 5/9/2009: event"
    );

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("european slash day 5", async () => {
    const markwhen = parse("dateFormat: d/M/y\n5/9/2009: event");

    const dateRange = firstEvent(markwhen).ranges.date;
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

  test("relative dates 1", async () => {
    const markwhen = parse(
      "dateFormat: d/M/y\n5/9/2009: event\n1 week: next event"
    );

    const dateRange = firstEvent(markwhen).ranges.date;
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

    const secondRange = (markwhen.timelines[0].events[1] as Event).ranges.date;

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

  test("relative dates 2", async () => {
    const markwhen = parse(
      "dateFormat: d/M/y\n5/9/2009: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event"
    );

    const dateRange = firstEvent(markwhen).ranges.date;
    let from = dateRange.fromDateTime;
    checkDate(from, 2009, 9, 5, 0, 0, 0);

    let to = dateRange.toDateTime;
    checkDate(to, 2009, 9, 6, 0, 0, 0);

    const secondRange = (markwhen.timelines[0].events[1] as Event).ranges.date;

    // Should start at the end of the last event
    from = secondRange.fromDateTime;
    checkDate(from, 2009, 9, 6, 0, 0, 0);

    // to should be the beginning date plus a week
    checkDateTime(secondRange.toDateTime, from.plus({ months: 1, days: 1 }));

    const thirdRange = (markwhen.timelines[0].events[2] as Event).ranges.date;
    to = secondRange.toDateTime;
    from = thirdRange.fromDateTime;
    // Should start when the last one ends
    checkDate(from, to.year, to.month, to.day, to.hour, to.minute);

    to = thirdRange.toDateTime;
    checkDateTime(to, from.plus({ years: 3, months: 1, days: 8 }));
  });

  test("relative dates 3", async () => {
    const markwhen = parse(
      "dateFormat: d/M/y\n5/9/2009: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event"
    );

    const dateRange = firstEvent(markwhen).ranges.date;
    let from = dateRange.fromDateTime;
    checkDate(from, 2009, 9, 5, 0, 0, 0);

    let to = dateRange.toDateTime;
    checkDate(to, 2009, 9, 6, 0, 0, 0);

    const secondRange = (markwhen.timelines[0].events[1] as Event).ranges.date;

    // Should start at the end of the last event
    from = secondRange.fromDateTime;
    checkDate(from, 2009, 9, 6, 0, 0, 0);

    // to should be the beginning date plus a week
    expect(
      secondRange.toDateTime.equals(from.plus({ months: 1, days: 1 }))
    ).toBe(true);

    const thirdRange = (markwhen.timelines[0].events[2] as Event).ranges.date;
    to = secondRange.toDateTime;
    from = thirdRange.fromDateTime;
    // Should start when the last one ends
    checkDate(from, to.year, to.month, to.day, to.hour, to.minute);

    to = thirdRange.toDateTime;
    expect(to.equals(from.plus({ years: 3, months: 1, days: 8 }))).toBe(true);
  });

  test("relative by id", () => {
    const markwhen = parse(`
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

  test("event title", () => {
    const markwhen = parse(
      "dateFormat: d/M/y\n5/9/2009: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event"
    );
    const first = firstEvent(markwhen);
    expect(first.event.eventDescription).toBe("event");
    const second = markwhen.timelines[0].events[1] as Event;
    expect(second.event.eventDescription).toBe("next event");
    const third = markwhen.timelines[0].events[2] as Event;
    expect(third.event.eventDescription).toBe("third event");
  });

  test("supplemental descriptions", () => {
    const markwhen = parse(
      "dateFormat: d/M/y\n5/9/2009: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event\nmore text\neven more text"
    );
    const third = markwhen.timelines[0].events[2] as Event;
    expect(third.event.eventDescription).toBe("third event");
    expect(third.event.supplemental[0].raw).toBe("more text");
    expect(third.event.supplemental[1].raw).toBe("even more text");
  });

  test("list items", () => {
    const markwhen = parse(
      `dateFormat: d/M/y
      5/9/2009: event
      1 month 1 day: next event
      - item 1
      - item 2

      3 years 8 days 1 month: third event

      - item 3

      - item 4`
    );

    const [first, second, third] = getEvents(markwhen);
    expect(second.event.supplemental.length).toBe(2);
    expect(second.event.supplemental[0].type).toBe("listItem");
    expect(second.event.supplemental[0].raw).toBe("item 1");
    expect(second.event.supplemental[1].type).toBe("listItem");
    expect(second.event.supplemental[1].raw).toBe("item 2");

    expect(third.event.supplemental.length).toBe(2);
    expect(third.event.supplemental[0].type).toBe("listItem");
    expect(third.event.supplemental[0].raw).toBe("item 3");
    expect(third.event.supplemental[1].type).toBe("listItem");
    expect(third.event.supplemental[1].raw).toBe("item 4");
  });

  test("checkbox items", () => {
    const markwhen = parse(
      `dateFormat: d/M/y
      5/9/2009: event
      1 month 1 day: next event
      - [] item 1
      - [ ] item 2

      3 years 8 days 1 month: third event

      - [x] item 3

      - [x] item 4`
    );

    const [first, second, third] = getEvents(markwhen);
    expect(second.event.supplemental.length).toBe(2);
    expect(second.event.supplemental[0].type).toBe("checkbox");
    expect(second.event.supplemental[0].raw).toBe("item 1");
    expect(second.event.supplemental[0].value).toBe(false);
    expect(second.event.supplemental[1].type).toBe("checkbox");
    expect(second.event.supplemental[1].raw).toBe("item 2");
    expect(second.event.supplemental[1].value).toBe(false);

    expect(third.event.supplemental.length).toBe(2);
    expect(third.event.supplemental[0].type).toBe("checkbox");
    expect(third.event.supplemental[0].raw).toBe("item 3");
    expect(third.event.supplemental[0].value).toBe(true);
    expect(third.event.supplemental[1].type).toBe("checkbox");
    expect(third.event.supplemental[1].raw).toBe("item 4");
    expect(third.event.supplemental[1].value).toBe(true);
  });

  test("to now", () => {
    const markwhen = parse("June 4 1999 - now: event");

    const dateRange = firstEvent(markwhen).ranges.date;
    const from = dateRange.fromDateTime;
    checkDate(from, 1999, 6, 4, 0, 0, 0);

    const to = dateRange.toDateTime;
    const now = DateTime.now();
    checkDate(to, now.year, now.month, now.day, now.hour, now.minute);
  });

  describe("casual dates", () => {
    test("casual dates via month words 1", () => {
      const markwhen = parse("dateFormat: d/M/y\n5 June 2009: event");
      const first = firstEvent(markwhen);
      const startOfDay = DateTime.fromISO("2009-06-05");
      expect(first.ranges.date.fromDateTime.equals(startOfDay)).toBe(true);
      expect(
        first.ranges.date.toDateTime.equals(startOfDay.plus({ day: 1 }))
      ).toBe(true);
    });

    test("casual dates via month words 2", () => {
      const markwhen = parse("dateFormat: d/M/y\nJune 5 2009: event");
      const first = firstEvent(markwhen);
      const startOfDay = DateTime.fromISO("2009-06-05");
      expect(first.ranges.date.fromDateTime.equals(startOfDay)).toBe(true);
      expect(
        first.ranges.date.toDateTime.equals(startOfDay.plus({ day: 1 }))
      ).toBe(true);
    });

    test("casual dates via month words 3", () => {
      const markwhen = parse("dateFormat: d/M/y\nJun 5 2009: event");
      const first = firstEvent(markwhen);
      const startOfDay = DateTime.fromISO("2009-06-05");
      expect(first.ranges.date.fromDateTime.equals(startOfDay)).toBe(true);
      expect(
        first.ranges.date.toDateTime.equals(startOfDay.plus({ day: 1 }))
      ).toBe(true);
    });

    test("casual dates via month words 4", () => {
      const markwhen = parse("  5 Jun 2009: event");
      const first = firstEvent(markwhen);
      const startOfDay = DateTime.fromISO("2009-06-05");
      expect(first.ranges.date.fromDateTime.equals(startOfDay)).toBe(true);
      expect(
        first.ranges.date.toDateTime.equals(startOfDay.plus({ day: 1 }))
      ).toBe(true);
    });

    test("casual dates via month words 5", () => {
      const markwhen = parse("June   2009: event");
      const first = firstEvent(markwhen);
      const startOfMonth = DateTime.fromISO("2009-06-01");
      expect(first.ranges.date.fromDateTime.equals(startOfMonth)).toBe(true);
      expect(
        first.ranges.date.toDateTime.equals(DateTime.fromISO("2009-07-01"))
      ).toBe(true);
    });

    test("casual dates via month words 6", () => {
      const markwhen = parse(" Feb  2009: event");
      const first = firstEvent(markwhen);
      const startOfMonth = DateTime.fromISO("2009-02-01");
      expect(first.ranges.date.fromDateTime.equals(startOfMonth)).toBe(true);
      expect(
        first.ranges.date.toDateTime.equals(DateTime.fromISO("2009-03-01"))
      ).toBe(true);
    });

    test("casual dates via month words 7", () => {
      const markwhen = parse("Feb: event");
      const first = firstEvent(markwhen);
      const startOfMonth = DateTime.fromISO("2022-02-01");
      expect(first.ranges.date.fromDateTime.equals(startOfMonth)).toBe(true);
      expect(
        first.ranges.date.toDateTime.equals(DateTime.fromISO("2022-03-01"))
      ).toBe(true);
    });
  });

  describe("casual times", () => {
    test("casual times 1", () => {
      const markwhen = parse("June 4 8am: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      const from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 4, 8, 0, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 2022, 6, 4, 8, 0, 0);
    });

    test("casual times 2", () => {
      const markwhen = parse("June 4 8:00: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      const from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 4, 8, 0, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 2022, 6, 4, 8, 0, 0);
    });

    test("casual times 3", () => {
      const markwhen = parse("June 4 8:00 - 9:30: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      const from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 4, 8, 0, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 2022, 6, 4, 9, 30, 0);
    });

    test("casual times 4", () => {
      const markwhen = parse("June 4 8:00 - 19:30: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      const from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 4, 8, 0, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 2022, 6, 4, 19, 30, 0);
    });

    test("casual times 5", () => {
      const markwhen = parse("June 4 1990 8am - 9:30pm: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      const from = dateRange.fromDateTime;
      checkDate(from, 1990, 6, 4, 8, 0, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 1990, 6, 4, 21, 30, 0);
    });

    test("casual times 6", () => {
      const markwhen = parse("June 4 08:00: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      const from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 4, 8, 0, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 2022, 6, 4, 8, 0, 0);
    });

    test("casual times 7", () => {
      const markwhen = parse("June 4 8:39: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      const from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 4, 8, 39, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 2022, 6, 4, 8, 39, 0);
    });

    test("casual times 8", () => {
      const markwhen = parse("June 4 8:39 - August 8 12:34: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      const from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 4, 8, 39, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 2022, 8, 8, 12, 34, 0);
    });

    test("casual times 9", () => {
      const markwhen = parse("June 4 2020 8:39 - 8 August 12:34: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      const from = dateRange.fromDateTime;
      checkDate(from, 2020, 6, 4, 8, 39, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 2022, 8, 8, 12, 34, 0);
    });

    test("casual times 10", () => {
      const markwhen = parse("4 Jun 2020 8:39 - 8 aug 2022 12:34: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      const from = dateRange.fromDateTime;
      checkDate(from, 2020, 6, 4, 8, 39, 0);

      const to = dateRange.toDateTime;
      checkDate(to, 2022, 8, 8, 12, 34, 0);
    });
  });

  describe("slash dates and times", () => {
    test("1", () => {
      const markwhen = parse(
        "dateFormat: d/M/y\n5/9/2009 18:00: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event"
      );

      const dateRange = firstEvent(markwhen).ranges.date;
      let from = dateRange.fromDateTime;
      checkDate(from, 2009, 9, 5, 18, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2009, 9, 5, 18, 0, 0);
    });

    test("2", () => {
      const markwhen = parse(
        "dateFormat: d/M/y\n5/9/2009 18:00 - May 12 2011 6pm: event\n1 month 1 day: next event\n3 years 8 days 1 month: third event"
      );

      const dateRange = firstEvent(markwhen).ranges.date;
      let from = dateRange.fromDateTime;
      checkDate(from, 2009, 9, 5, 18, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2011, 5, 12, 18, 0, 0);
    });
  });

  describe("etdf dates", () => {
    test("yyyy", () => {
      const markwhen = parse("2022: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 1, 1, 0, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2023, 1, 1, 0, 0, 0);
    });

    test("yyyy-mm", () => {
      const markwhen = parse("2022-06: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 1, 0, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2022, 7, 1, 0, 0, 0);
    });

    test("yyyy-mm-dd", () => {
      const markwhen = parse("2022-06-07: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 7, 0, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2022, 6, 8, 0, 0, 0);
    });

    test("yyyy-mm-dd/yyyy", () => {
      const markwhen = parse("2022-06-07/2023: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 7, 0, 0, 0);

      let to = dateRange.toDateTime;
      // to the end of 2023
      checkDate(to, 2024, 1, 1, 0, 0, 0);
    });

    test("yyyy-mm-dd/yyyy-mm", () => {
      const markwhen = parse("2022-06-07/2023-11: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 7, 0, 0, 0);

      let to = dateRange.toDateTime;
      // to the end of november
      checkDate(to, 2023, 12, 1, 0, 0, 0);
    });

    test("yyyy-mm-dd/yyyy-mm-dd", () => {
      const markwhen = parse("2022-06-07/2023-02-21: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 7, 0, 0, 0);

      let to = dateRange.toDateTime;
      // to the end of feb 21
      checkDate(to, 2023, 2, 22, 0, 0, 0);
    });

    test("yyyy-mm/yyyy-mm-dd", () => {
      const markwhen = parse("2022-06/2023-09-09: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 1, 0, 0, 0);

      let to = dateRange.toDateTime;
      // to the end of 2023
      checkDate(to, 2023, 9, 10, 0, 0, 0);
    });

    test("yyyy-mm/relative", () => {
      const markwhen = parse("2022-06/3 weeks: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 6, 1, 0, 0, 0);

      let to = dateRange.toDateTime;
      checkDateTime(to, from.plus({ weeks: 3 }));
    });

    test("yyyy-mm/relative", () => {
      const markwhen = parse(
        `2021: a thing
        2022-06/3 weeks: am i stupid or what
        8 days 6 minutes/2023: event`
      );

      const secondRange = (markwhen.timelines[0].events[1] as Event).ranges
        .date;
      let from = secondRange.fromDateTime;
      checkDate(from, 2022, 6, 1, 0, 0, 0);

      let to = secondRange.toDateTime;
      checkDateTime(to, from.plus({ weeks: 3 }));

      const thirdRange = (markwhen.timelines[0].events[2] as Event).ranges.date;
      checkDateTime(
        thirdRange.fromDateTime,
        secondRange.toDateTime.plus({ days: 8, minutes: 6 })
      );
    });

    test("yyyy-mm/relative", () => {
      const markwhen = parse("2022-09/3 weeks: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 9, 1, 0, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2022, 9, 22);
    });

    test("yyyy-mm/week day", () => {
      const markwhen = parse("2022-09/3 weekdays: event");

      const dateRange = firstEvent(markwhen).ranges.date;
      let from = dateRange.fromDateTime;
      checkDate(from, 2022, 9, 1, 0, 0, 0);

      let to = dateRange.toDateTime;
      checkDate(to, 2022, 9, 6);
    });
  });

  describe("work/week days", () => {
    test("Less than a week", () => {
      const markwhen = parse(`
      July 10, 2022: Sunday
      5 work days: til friday
      `);

      const secondRange = (markwhen.timelines[0].events[1] as Event).ranges
        .date;
      // Til the end of Friday
      checkDate(secondRange.toDateTime, 2022, 7, 16, 0, 0, 0);
    });

    test("Less than a week (week)", () => {
      const markwhen = parse(`
      July 10, 2022: Sunday
      5 week days: til friday
      `);

      const secondRange = (markwhen.timelines[0].events[1] as Event).ranges
        .date;
      // Til the end of Friday
      checkDate(secondRange.toDateTime, 2022, 7, 16, 0, 0, 0);
    });

    test("Span over a weekend", () => {
      const markwhen = parse(`
      July 10, 2022: Sunday
      10 work days: til next friday
      `);

      const secondRange = (markwhen.timelines[0].events[1] as Event).ranges
        .date;
      // Til the end of Friday
      checkDate(secondRange.toDateTime, 2022, 7, 23, 0, 0, 0);
    });

    test("From middle of week", () => {
      const markwhen = parse(`
      July 13, 2022 - 10 workdays: til next friday
      `);

      const firstRange = (markwhen.timelines[0].events[0] as Event).ranges.date;
      // Til the end of Friday
      checkDate(firstRange.toDateTime, 2022, 7, 27, 0, 0, 0);
    });

    test("As from and to times", () => {
      const markwhen = parse(`
      July 11, 2022: Monday

      // This is 10 work days after July 10, lasting for 10 work days
      10 work days - 10 work days: til next friday
      `);

      const secondRange = (markwhen.timelines[0].events[1] as Event).ranges
        .date;
      checkDate(secondRange.fromDateTime, 2022, 7, 26);
      checkDate(secondRange.toDateTime, 2022, 8, 9);
    });

    test("As from and to times (week)", () => {
      const markwhen = parse(`
      July 11, 2022: Monday

      // This is 10 work days after July 10, lasting for 10 work days
      10 week days - 10 week days: til next friday
      `);

      const secondRange = (markwhen.timelines[0].events[1] as Event).ranges
        .date;
      checkDate(secondRange.fromDateTime, 2022, 7, 26);
      checkDate(secondRange.toDateTime, 2022, 8, 9);
    });

    test("Business/week/work days", () => {
      const markwhen = parse(`
      July 11, 2022: Monday

      // This is 10 work days after July 10, lasting for 10 work days
      10 business days - 10 week days: til next friday

      // beginning of the 13th til beginning of 20th
      4 week days - 1 week: third event
      `);

      const secondRange = (markwhen.timelines[0].events[1] as Event).ranges
        .date;
      checkDate(secondRange.fromDateTime, 2022, 7, 26);
      checkDate(secondRange.toDateTime, 2022, 8, 9);

      const thirdRange = (markwhen.timelines[0].events[2] as Event).ranges.date;
      checkDate(thirdRange.fromDateTime, 2022, 8, 13);
      checkDate(thirdRange.toDateTime, 2022, 8, 20);
    });

    test("Before 1", () => {
      const markwhen = parse(`
      July 11 2022: !monday Monday
      
      by !monday 7 work days: event
      `);

      const [first, second] = getDateRanges(markwhen);

      checkDate(second.fromDateTime, 2022, 6, 30);
      checkDateTime(second.toDateTime, first.fromDateTime);
    });

    test("Before 2", () => {
      const markwhen = parse(`
      July 11 2022: !monday Monday

      August 18 2022: another event
      
      by !monday 7 work days: event
      `);

      const [first, , third] = getDateRanges(markwhen);

      checkDate(third.fromDateTime, 2022, 6, 30);
      checkDateTime(third.toDateTime, first.fromDateTime);
    });

    test("Before 3", () => {
      const markwhen = parse(`
      July 11 2022: !monday Monday

      August 18 2022: another event
      
      by 7 work days: event
      `);

      const [, second, third] = getDateRanges(markwhen);

      checkDate(third.fromDateTime, 2022, 8, 9);
      checkDateTime(third.toDateTime, second.fromDateTime);
    });

    test("Before 4", () => {
      const markwhen = parse(`
      July 11 2022: !monday Monday

      August 18 2022: another event
      
      by !monday 7 work days: event
      `);

      const [first, , third] = getDateRanges(markwhen);

      checkDate(third.fromDateTime, 2022, 6, 30);
      checkDateTime(third.toDateTime, first.fromDateTime);
    });

    test("Before 5", () => {
      const markwhen = parse(`
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

    test("Before 6", () => {
      const markwhen = parse(`dateFormat: d/M/y
      #announcements: red
      10/4/2023: ANNUAL CHURCH MEETING !ACM
      
      10/2/2023: Event !event
      before !event 10 week days: revise voting eligibility list
      January 27 2023 - 10 week days: something`);

      const [, , third, fourth] = getDateRanges(markwhen);

      checkDateTime(fourth.fromDateTime, third.fromDateTime);
      checkDateTime(fourth.toDateTime, third.toDateTime);
    });

    test("Before with buffer", () => {
      const markwhen = parse(`
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

    test("Before with buffer", () => {
      const markwhen = parse(`
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
    test("skips number only", () => {
      const markwhen = parse(`title: my timelines
      description: my description
      now - 10 years: an event #1
      1 year: event #2
      3 years: event #third`);

      const tagLiterals = Object.keys(markwhen.timelines[0].tags);
      expect(tagLiterals).toHaveLength(1);
      expect(tagLiterals).toContainEqual("third");
    });

    test("skips number only 2", () => {
      const markwhen = parse(`title: my timelines
      description: my description
      now - 10 years: an event #1 #3342 #098
      1 year: event #2 #another #tag
      3 years: event #third #fourth #fifth #332334b #5`);

      const tagLiterals = Object.keys(markwhen.timelines[0].tags);
      expect(tagLiterals).toHaveLength(6);
      ["another", "tag", "third", "fourth", "fifth", "332334b"].forEach((i) =>
        expect(tagLiterals).toContain(i)
      );
    });
  });

  describe.skip("due dates & relative dates", () => {
    test("to event 1", () => {
      const markwhen = parse(`
      2024: !event1 event
      2022/!event1: from 2022 to !event1
      `);

      const [first, second] = getDateRanges(markwhen);

      checkDate(second.fromDateTime, 2022, 1, 1);
      checkDate(second.toDateTime, 2024, 1, 1);
    });

    test("to event 2", () => {
      const markwhen = parse(`
      2024: !event1 event
      2022 - !event1: from 2022 to !event1
      `);

      const [first, second] = getDateRanges(markwhen);

      checkDate(second.fromDateTime, 2022, 1, 1);
      checkDate(second.toDateTime, 2024, 1, 1);
    });

    test("to event 3", () => {
      const markwhen = parse(`
      2024: !event1 event
      !event1/2025: from 2024 to 2025
      `);

      const [first, second] = getDateRanges(markwhen);

      checkDate(second.fromDateTime, 2022, 1, 1);
      checkDate(second.toDateTime, 2024, 1, 1);
    });

    test("to event 4", () => {
      const markwhen = parse(`
      2024: !event1 event
      !event1 - 2025: from 2024 to 2025
      `);

      const [first, second] = getDateRanges(markwhen);

      checkDate(second.fromDateTime, 2022, 1, 1);
      checkDate(second.toDateTime, 2024, 1, 1);
    });
  });

  describe("viewers and editors", () => {
    test("no viewers specified, none parsed", () => {
      const markwhen = parse(`title: my timelines
      description: my description
      now - 10 years: an event`);

      expect(markwhen.timelines[0].metadata.view.length).toBe(0);
    });

    test("Single viewer", () => {
      const markwhen = parse(`title: my timelines

      view: example@example.com

      description: my description
      now - 10 years: an event`);

      const viewers = markwhen.timelines[0].metadata.view;
      expect(viewers.length).toBe(1);
      expect(viewers).toContain("example@example.com");
    });

    test("Multiple viewers", () => {
      const markwhen = parse(`title: my timelines

      view: example@example.com, example2@example.com someoneelse@g.co

      description: my description
      now - 10 years: an event`);

      const viewers = markwhen.timelines[0].metadata.view;
      [
        "example@example.com",
        "example2@example.com",
        "someoneelse@g.co",
      ].forEach((e) => expect(viewers).toContain(e));
    });

    test("no editors specified, none parsed", () => {
      const markwhen = parse(`title: my timelines
      description: my description
      now - 10 years: an event`);

      expect(markwhen.timelines[0].metadata.edit.length).toBe(0);
    });

    test("Single editor", () => {
      const markwhen = parse(`title: my timelines

      edit: example@example.com

      description: my description
      now - 10 years: an event`);

      const editors = markwhen.timelines[0].metadata.edit;
      expect(editors.length).toBe(1);
      expect(editors).toContain("example@example.com");
    });

    test("Multiple editors", () => {
      const markwhen = parse(`title: my timelines

      edit: example@example.com, example2@example.com someoneelse@g.co

      description: my description
      now - 10 years: an event`);

      const editors = markwhen.timelines[0].metadata.edit;
      [
        "example@example.com",
        "example2@example.com",
        "someoneelse@g.co",
      ].forEach((e) => expect(editors).toContain(e));
    });
  });

  describe.only("Date range parsing", () => {
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
    })
  });
});

function getDateRanges(m: Timelines) {
  return m.timelines[0].events.flatMap((e) => {
    if (e instanceof Event) {
      return [e.ranges.date];
    }
    return e.map((e) => e.ranges.date);
  });
}

function getEvents(m: Timelines) {
  return m.timelines[0].events.flatMap((e) => {
    if (e instanceof Event) {
      return [e];
    }
    return e;
  });
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

function checkDateTime(dateTime1: DateTime, dateTime2: DateTime) {
  expect(dateTime1.year).toBe(dateTime2.year);
  expect(dateTime1.month).toBe(dateTime2.month);
  expect(dateTime1.day).toBe(dateTime2.day);
  expect(dateTime1.hour).toBe(dateTime2.hour);
  expect(dateTime1.minute).toBe(dateTime2.minute);
  expect(dateTime1.second).toBe(dateTime2.second);
}
