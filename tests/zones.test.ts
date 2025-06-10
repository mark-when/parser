import {
  DateTime,
  FixedOffsetZone,
  IANAZone,
  Settings,
  SystemZone,
} from "luxon";
import { toDateRange } from "../src/Types";
import { firstEvent, nthEvent, sp } from "./testUtilities";

describe("timezones", () => {
  beforeAll(() => {
    Settings.defaultZone = "utc";
  });

  afterAll(() => {
    Settings.defaultZone = new SystemZone();
  });

  test.each(sp())("timezone works", (p) => {
    const nyt = `timezone: +5
    2023-05-01: event`;

    const utc = `timezone: +0
    2023-05-01: event`;

    const nytp = p(nyt);
    const utcp = p(utc);
    const nytpFromDateTime = toDateRange(
      firstEvent(nytp).dateRangeIso
    ).fromDateTime;
    const utcpFromDateTime = toDateRange(
      firstEvent(utcp).dateRangeIso
    ).fromDateTime;

    const diff = nytpFromDateTime.diff(utcpFromDateTime);
    expect(diff.as("hours")).toBe(-5);
  });

  test.each(sp())("default timezone is system", (p) => {
    const mw = `2023-05-01: event`;
    const parsed = p(mw);

    const dt = DateTime.fromISO("2023-05-01", { zone: new SystemZone() });
    const diff = toDateRange(firstEvent(parsed).dateRangeIso)
      .fromDateTime.diff(dt)
      .as("hours");
    expect(diff).toEqual(0);
  });

  test.each(sp())("named zone", (p) => {
    const mw = `timezone: America/New_York
    2023-05-01: event`;

    const parsed = p(mw);
    const dt = DateTime.fromISO("2023-05-01", {
      zone: new IANAZone("America/New_York"),
    });
    expect(+toDateRange(firstEvent(parsed).dateRangeIso).fromDateTime).toEqual(
      +dt
    );
  });

  test.each(sp())("named zone 2", (p) => {
    const mw = `timezone: America/New_York
    2023-05-01: event`;

    const parsed = p(mw);
    const dt = DateTime.fromISO("2023-05-01", {
      zone: new IANAZone("America/Chicago"),
    });
    const diff = toDateRange(firstEvent(parsed).dateRangeIso)
      .fromDateTime.diff(dt)
      .as("hours");
    expect(diff).toEqual(-1);
  });

  test.each(sp())("relative dates with zones", (p) => {
    const mw = `timezone: -05:00
    2023-05-01: event
    5 days: event
    `;
  });

  test.each(sp())("specific times", (p) => {
    const mw = `timezone: America/New_York
Sep 1 2023 21:49: hi`;
    const timelines = p(mw);
    const first = firstEvent(timelines).dateRangeIso.fromDateTimeIso;

    expect(
      +DateTime.fromISO("2023-09-01T21:49:00.000Z").plus({ hours: 4 })
    ).toBe(+DateTime.fromISO(first));
  });

  test.each(sp())("casual dates with times", (p) => {
    const mw = `timezone: America/New_York
Sep 1 2023 21:49 - Sep 1 2023 21:50: hi`;
    const timelines = p(mw);
    const firstFrom = firstEvent(timelines).dateRangeIso.fromDateTimeIso;
    const firstTo = firstEvent(timelines).dateRangeIso.toDateTimeIso;

    expect(
      +DateTime.fromISO("2023-09-01T21:49:00.000Z").plus({ hours: 4 })
    ).toBe(+DateTime.fromISO(firstFrom));

    expect(
      +DateTime.fromISO("2023-09-01T21:50:00.000Z").plus({ hours: 4 })
    ).toBe(+DateTime.fromISO(firstTo));
  });

  test.each(sp())("specific case", (p) => {
    const mw = `---
Something:
re:
  description: |
    mostly [markwhen](https://markwhen.com) stuff
    [Github](https://github.com/kochrt)
  author:
    name: Rob Koch
    avatar: https://media.markwhen.com/7mGszd2clHRHudsf0lLX4Kb1ChI3/0bc5-25f1-db6a-3706.jpg 
  
#london:
  timezone: Europe/London
  color: #227766

timezone: America/New_York

ranges: [1 day, 30 days, 6 months]

#reminderTest:
  reminders: 1 hour
---

10/27/2023 1:56pm: This is a reminder #reminderTest 

Oct 6 2023 19:00: testing things out

#reminderTest
`;

    const timelines = p(mw);
    const firstFrom = DateTime.fromISO(
      firstEvent(timelines).dateRangeIso.fromDateTimeIso
    );
    expect(+DateTime.fromISO("2023-10-27T17:56:00.000Z")).toBe(+firstFrom);
  });
});
