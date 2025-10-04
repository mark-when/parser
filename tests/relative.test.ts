import { DateTime } from "luxon";
import { Event, parse, toDateRange } from "../src";
import {
  relativeToId,
  relativeToPrevious1,
  relativeToPreviousAndStart,
  relativeToStart1,
} from "./testStrings";
import { checkDateTime, getDateRanges, nthEvent, sp } from "./testUtilities";

describe("relative events", () => {
  test("durations aren't relative", () => {
    const mw = parse(relativeToStart1);
    const event = nthEvent(mw, 0);
    expect(event.isRelative).toBe(false);
  });

  test("simple prior relations are relative", () => {
    const mw = parse(relativeToPrevious1);
    const event = nthEvent(mw, 0);
    expect(event.isRelative).toBe(true);
  });

  test("relative to prior", () => {
    const mw = parse(relativeToPreviousAndStart);
    const event = nthEvent(mw, 0);
    expect(event.isRelative).toBeTruthy();
  });

  test("relative 3", () => {
    const mw = parse(relativeToId);
    const event = nthEvent(mw, 1);
    expect(event.isRelative).toBeTruthy();
  });

  test("relative to two events", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

!event / !eventy: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(first.toDateTime, third.fromDateTime);
    checkDateTime(third.toDateTime, second.fromDateTime);
  });

  test("relative to two events dependencies", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

!event / !eventy: hmmm`;
    const mw = parse(text);
    const third = mw.events.children[2] as Event;
    const [first, second] = mw.events.children as Event[];

    expect(third.fromRelativeTo).toEqual({
      path: [0],
      dt: first.dateRangeIso.toDateTimeIso,
    });
    expect(third.toRelativeTo).toEqual({
      path: [1],
      dt: second.dateRangeIso.fromDateTimeIso,
    });
  });

  test("relative to two events 2", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

!event - !eventy: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(first.toDateTime, third.fromDateTime);
    checkDateTime(third.toDateTime, second.fromDateTime);
  });

  test("relative to two events 2 dependencies", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

!event - !eventy: hmmm`;
    const mw = parse(text);
    const third = mw.events.children[2] as Event;
    const [first, second] = mw.events.children as Event[];

    expect(third.fromRelativeTo).toEqual({
      path: [0],
      dt: first.dateRangeIso.toDateTimeIso,
    });
    expect(third.toRelativeTo).toEqual({
      path: [1],
      dt: second.dateRangeIso.fromDateTimeIso,
    });
  });

  test("modifiers 1", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

!event.start - !eventy.end: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(third.fromDateTime, first.fromDateTime);
    checkDateTime(third.toDateTime, second.toDateTime);
  });

  test("modifiers 2", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

!event.end - !eventy.start: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(third.fromDateTime, first.toDateTime);
    checkDateTime(third.toDateTime, second.fromDateTime);
  });

  test("modifiers 3", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

!event.end / !eventy.start: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(third.fromDateTime, first.toDateTime);
    checkDateTime(third.toDateTime, second.fromDateTime);
  });

  test("modifiers 4", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

!event.start / !event.end: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(third.fromDateTime, first.fromDateTime);
    checkDateTime(third.toDateTime, first.toDateTime);
  });

  test("modifiers 5", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

!event.start - !event.end: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(third.fromDateTime, first.fromDateTime);
    checkDateTime(third.toDateTime, first.toDateTime);
  });

  test("modifiers 6", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

.start / .end: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(third.fromDateTime, second.fromDateTime);
    checkDateTime(third.toDateTime, second.toDateTime);
  });

  test("modifiers 7", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

.start - .end: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(third.fromDateTime, second.fromDateTime);
    checkDateTime(third.toDateTime, second.toDateTime);
  });

  test("modifiers 8", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

.start - .end 1 day: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(third.fromDateTime, second.fromDateTime);
    checkDateTime(third.toDateTime, second.toDateTime.plus({ days: 1 }));
  });

  test("modifiers 9", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

.start - .end -1 day: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(third.fromDateTime, second.fromDateTime);
    checkDateTime(third.toDateTime, second.toDateTime.minus({ days: 1 }));
  });

  test("modifiers 10", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

.start -10 days / .end 1 day: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(third.fromDateTime, second.fromDateTime.minus({ days: 10 }));
    checkDateTime(third.toDateTime, second.toDateTime.plus({ days: 1 }));
  });

  test("modifiers 11", () => {
    const text = `
2025-07-28 / 2025-08-01: Yearly planning #milestone
id: event

2025-08-09: event2
id: eventy

-10 days / 1 day: hmmm`;
    const mw = parse(text);
    const [first, second, third] = getDateRanges(mw);

    checkDateTime(third.fromDateTime, second.toDateTime.minus({ days: 10 }));
    checkDateTime(third.toDateTime, third.fromDateTime.plus({ days: 1 }));
  });
});

describe("dependencies", () => {
  test("is relative to event by id from", () => {
    const mw = parse(`
2025: event
id: event

!event / 1 day: second`);

    const second = mw.events.children[1] as Event;
    const first = mw.events.children[0] as Event;

    expect(second.fromRelativeTo).toEqual({
      path: [0],
      dt: first.dateRangeIso.toDateTimeIso,
    });
  });

  test("is relative to event by id to", () => {
    const mw = parse(`
2025: event
id: event

by !event 1 day: second`);

    const second = mw.events.children[1] as Event;
    const first = mw.events.children[0] as Event;

    expect(second.toRelativeTo).toEqual({
      path: [0],
      dt: first.dateRangeIso.fromDateTimeIso,
    });
  });

  test("is relative to event by id to 2", () => {
    const mw = parse(`
2025: event
id: event

before !event 1 day: second`);

    const second = mw.events.children[1] as Event;
    const first = mw.events.children[0] as Event;

    expect(second.toRelativeTo).toEqual({
      path: [0],
      dt: first.dateRangeIso.fromDateTimeIso,
    });
  });

  test("is relative to 2 events by id", () => {
    const mw = parse(`
2025: event
id: ok

2027: event
id: oops

!ok / !oops: interesting`);

    const third = mw.events.children[2] as Event;
    const [first, second] = mw.events.children as Event[];

    expect(third.fromRelativeTo).toEqual({
      path: [0],
      dt: first.dateRangeIso.toDateTimeIso,
    });
    expect(third.toRelativeTo).toEqual({
      path: [1],
      dt: second.dateRangeIso.fromDateTimeIso,
    });
  });

  test("anonymous start modifier 1", () => {
    const mw = parse(`
2025: event

.start 1 day: event`);

    const first = mw.events.children[0] as Event;
    const second = mw.events.children[1] as Event;
    expect(second.fromRelativeTo).toEqual({
      path: [0],
      dt: first.dateRangeIso.fromDateTimeIso,
    });
    expect(first.dateRangeIso.fromDateTimeIso).toBe(
      second.dateRangeIso.fromDateTimeIso
    );
  });

  test("anonymous start modifier 2", () => {
    const mw = parse(`
2025: event

.end 1 day: event`);

    const first = mw.events.children[0] as Event;
    const second = mw.events.children[1] as Event;
    expect(second.fromRelativeTo).toEqual({
      path: [0],
      dt: first.dateRangeIso.toDateTimeIso,
    });
    expect(first.dateRangeIso.toDateTimeIso).toBe(
      second.dateRangeIso.fromDateTimeIso
    );
  });

  test("anonymous end modifier 1", () => {
    const mw = parse(`
2025: event

.start / .end: event`);

    const first = mw.events.children[0] as Event;
    const second = mw.events.children[1] as Event;
    expect(second.fromRelativeTo).toEqual({
      path: [0],
      dt: first.dateRangeIso.fromDateTimeIso,
    });
    expect(second.toRelativeTo).toEqual({
      path: [0],
      dt: first.dateRangeIso.toDateTimeIso,
    });
  });

  test("datetime property in relative references", () => {
    const text = `
2025-01-01: First event
id: first

2025-02-01: Second event
id: second

!first / !second: Between events`;

    const mw = parse(text);
    const [first, second, third] = mw.events.children as Event[];

    // Check fromRelativeTo contains the correct datetime
    expect(third.fromRelativeTo).toBeDefined();
    expect(third.fromRelativeTo?.path).toEqual([0]);
    expect(third.fromRelativeTo?.dt).toEqual(first.dateRangeIso.toDateTimeIso);

    // Check toRelativeTo contains the correct datetime
    expect(third.toRelativeTo).toBeDefined();
    expect(third.toRelativeTo?.path).toEqual([1]);
    expect(third.toRelativeTo?.dt).toEqual(second.dateRangeIso.fromDateTimeIso);
  });

  test("datetime property with modifiers", () => {
    const text = `
2025-01-01 / 2025-01-10: First event
id: first

!first.start / !first.end: Same span`;

    const mw = parse(text);
    const [first, second] = mw.events.children as Event[];

    // Check fromRelativeTo dt is using the start time
    expect(second.fromRelativeTo).toBeDefined();
    expect(second.fromRelativeTo?.path).toEqual([0]);
    expect(second.fromRelativeTo?.dt).toEqual(
      first.dateRangeIso.fromDateTimeIso
    );

    // Check toRelativeTo dt is using the end time
    expect(second.toRelativeTo).toBeDefined();
    expect(second.toRelativeTo?.path).toEqual([0]);
    expect(second.toRelativeTo?.dt).toEqual(first.dateRangeIso.toDateTimeIso);
  });

  test.skip("datetime property with offsets", () => {
    const text = `
2025-01-01: Reference point
id: ref

!ref -5 days / !ref 10 days: Offset event`;

    const mw = parse(text);
    const [first, second] = mw.events.children as Event[];

    const expectedFromDt = DateTime.fromISO(
      first.dateRangeIso.toDateTimeIso
    ).minus({ days: 5 });
    const expectedToDt = DateTime.fromISO(
      first.dateRangeIso.toDateTimeIso
    ).plus({ days: 10 });

    checkDateTime(
      DateTime.fromISO(second.dateRangeIso.fromDateTimeIso),
      expectedFromDt
    );
    checkDateTime(
      DateTime.fromISO(second.dateRangeIso.toDateTimeIso),
      expectedToDt
    );

    // But the relative reference should contain the original reference point
    expect(second.fromRelativeTo).toBeDefined();
    expect(second.fromRelativeTo?.path).toEqual([0]);
    expect(second.fromRelativeTo?.dt).toEqual(first.dateRangeIso.toDateTimeIso);

    expect(second.toRelativeTo).toBeDefined();
    expect(second.toRelativeTo?.path).toEqual([0]);
    expect(second.toRelativeTo?.dt).toEqual(first.dateRangeIso.toDateTimeIso);
  });

  test.only("relative last", () => {
    const mw = parse(`
2016: Harambe
  id: harambe

2019 / 2022: Pandemic #era
  id: pandemic

!harambe 100 days / !pandemic -100 days: event 

199 days / 10 days: amazin`);

    const [harambe, pandemic, event, amazin] = mw.events.children as Event[];

    expect(amazin.fromRelativeTo?.path).toEqual([2]);
  });
});
