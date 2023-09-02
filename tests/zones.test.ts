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

  describe("zones via tags", () => {
    test.each(sp())("zone via tag is parsed correctly", (p) => {
      const mw = `
timezone: +5
#generalGrievous:
  timezone: +0
  
2023-05-01: this is an event in the ny timezone

2023-05-01: this is an event in the UK timezone

#generalGrievous`;

      const timelines = p(mw);

      const ny = DateTime.fromISO(
        firstEvent(timelines).dateRangeIso.fromDateTimeIso
      );
      const uk = DateTime.fromISO(
        nthEvent(timelines, 1).dateRangeIso.fromDateTimeIso
      );
      const diff = ny.diff(uk).as("hours");
      expect(diff).toBe(-5);
    });
  });

  test.each(sp())("zone via group tag", (p) => {
    const mw = `
timezone: +5
#generalGrievous:
  timezone: +0

group #generalGrievous 
2023-05-01: this is an event in the UK timezone
endGroup
2023-05-01: this is an event in the UK timezone

#generalGrievous`;

    const timelines = p(mw);

    const uk1 = DateTime.fromISO(
      firstEvent(timelines).dateRangeIso.fromDateTimeIso
    );
    const uk2 = DateTime.fromISO(
      nthEvent(timelines, 1).dateRangeIso.fromDateTimeIso
    );
    const diff = uk1.diff(uk2).as("hours");
    expect(diff).toBe(0);
  });

  test.each(sp())("nested zones via group tag", (p) => {
    const mw = `
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


2023-05-01: this `;

    const timelines = p(mw);

    const asia = DateTime.fromISO(
      firstEvent(timelines).dateRangeIso.fromDateTimeIso
    );
    const uk1 = DateTime.fromISO(
      nthEvent(timelines, 1).dateRangeIso.fromDateTimeIso
    );
    const uk2 = DateTime.fromISO(
      nthEvent(timelines, 2).dateRangeIso.fromDateTimeIso
    );
    const diff = uk1.diff(uk2).as("hours");
    expect(diff).toBe(0);

    expect(asia.diff(uk1).as("hours")).toBe(5);

    const ny = DateTime.fromISO(
      nthEvent(timelines, 3).dateRangeIso.fromDateTimeIso
    );
    expect(asia.diff(ny).as("hours")).toBe(10);
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
});
