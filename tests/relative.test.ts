import { parse } from "../src";
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
