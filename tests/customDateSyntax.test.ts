import { DateTime } from "luxon";
import { parse, RangeType } from "../src";
import { getDateRanges, nthEvent } from "./testUtilities";

function expectRange(
  markwhen: ReturnType<typeof parse>,
  eventIndex: number,
  from: string,
  to: string,
) {
  const range = getDateRanges(markwhen)[eventIndex];
  expect(range).toBeTruthy();
  expect(range.fromDateTime.toISODate()).toBe(from);
  expect(range.toDateTime.toISODate()).toBe(to);
}

function expectEventText(
  markwhen: ReturnType<typeof parse>,
  eventIndex: number,
  text: string,
) {
  expect(nthEvent(markwhen, eventIndex).firstLine.restTrimmed).toBe(text);
}

describe("Custom header date syntax", () => {
  test("supports shorthand list rules with full-match fromFormat and duration", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  - pattern: '^\\d{2}\\.\\d{2}\\.\\d{4}$'
    fromFormat: MM.dd.yyyy
    duration: 1 day
---
01.15.2026: Kickoff
`);

    expectRange(markwhen, 0, "2026-01-15", "2026-01-16");
    expectEventText(markwhen, 0, "Kickoff");
  });

  test("supports string from templates with fromFormat", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  - pattern: '^week (\\d{2})/(\\d{4})$'
    from: '$2-W$1'
    fromFormat: "kkkk-'W'WW"
    duration: 1 week
---
week 03/2026: Third week
`);

    const expectedFrom = DateTime.fromObject({
      weekYear: 2026,
      weekNumber: 3,
      weekday: 1,
    });
    expectRange(
      markwhen,
      0,
      expectedFrom.toISODate()!,
      expectedFrom.plus({ weeks: 1 }).toISODate()!,
    );
  });

  test("supports explicit from group and format objects", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  - pattern: '^release (\\d{4}_\\d{2}_\\d{2})$'
    from:
      group: 1
      format: yyyy_MM_dd
    duration: 2 days
---
release 2026_04_03: Ship it
`);

    expectRange(markwhen, 0, "2026-04-03", "2026-04-05");
  });

  test("supports explicit from and to capture groups for custom ranges", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  - pattern: '^(\\d{2}\\.\\d{2}\\.\\d{4})\\s+-\\s+(\\d{2}\\.\\d{2}\\.\\d{4})$'
    from:
      group: 1
      format: MM.dd.yyyy
    to:
      group: 2
      format: MM.dd.yyyy
---
01.15.2026 - 01.18.2026: Long kickoff
`);

    expectRange(markwhen, 0, "2026-01-15", "2026-01-19");
  });

  test("supports from/to shorthand templates with fromFormat and toFormat", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  - pattern: '^term (\\d{4})-(\\d{2}) to (\\d{4})-(\\d{2})$'
    from: '$1-$2'
    fromFormat: yyyy-MM
    to: '$3-$4'
    toFormat: yyyy-MM
---
term 2026-01 to 2026-03: First term
`);

    expectRange(markwhen, 0, "2026-01-01", "2026-04-01");
  });

  test("supports multiple custom rules in order", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  - pattern: '^sprint (\\d+)$'
    from: '2026-01-05'
    fromFormat: yyyy-MM-dd
    duration: '$1 weeks'
  - pattern: '^milestone (\\d{2})\\.(\\d{2})\\.(\\d{4})$'
    from: '$1.$2.$3'
    fromFormat: MM.dd.yyyy
    duration: 1 day
---
sprint 2: Sprint window
milestone 03.12.2026: Milestone
`);

    expectRange(markwhen, 0, "2026-01-05", "2026-01-19");
    expectRange(markwhen, 1, "2026-03-12", "2026-03-13");
  });

  test("defaults priority to first so custom rules win over built-in parsing", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  - pattern: '^(\\d{4})$'
    from: '1999-01-01'
    fromFormat: yyyy-MM-dd
    duration: 1 day
---
2026: Built-in year
`);

    expectRange(markwhen, 0, "1999-01-01", "1999-01-02");
  });

  test("priority first lets custom rules override built-in parsing", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  priority: first
  rules:
    - pattern: '^(\\d{4})$'
      from: '1999-01-01'
      fromFormat: yyyy-MM-dd
      duration: 1 day
---
2026: Custom year
`);

    expectRange(markwhen, 0, "1999-01-01", "1999-01-02");
  });

  test("priority only disables built-in parsing", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  priority: only
  rules:
    - pattern: '^custom (\\d{4}-\\d{2}-\\d{2})$'
      from: '$1'
      fromFormat: yyyy-MM-dd
      duration: 1 day
---
2026-01-01: Built-in date ignored
custom 2026-02-03: Custom date
`);

    expect(getDateRanges(markwhen)).toHaveLength(1);
    expectRange(markwhen, 0, "2026-02-03", "2026-02-04");
    expectEventText(markwhen, 0, "Custom date");
  });

  test("uses custom starts when finding event boundaries", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  - pattern: '^day (\\d{4}-\\d{2}-\\d{2})$'
    from: '$1'
    fromFormat: yyyy-MM-dd
    duration: 1 day
---
day 2026-01-01: First
  first details
day 2026-01-02: Second
  second details
`);

    expect(getDateRanges(markwhen)).toHaveLength(2);
    expectRange(markwhen, 0, "2026-01-01", "2026-01-02");
    expectRange(markwhen, 1, "2026-01-02", "2026-01-03");
    expectEventText(markwhen, 1, "Second");
  });

  test("adds normal date range, colon, and event definition ranges", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  - pattern: '^custom (\\d{4}-\\d{2}-\\d{2})$'
    from: '$1'
    fromFormat: yyyy-MM-dd
    duration: 1 day
---
custom 2026-02-03: Custom date
`);

    const rangeTypes = markwhen.ranges.map((range) => range.type);
    expect(rangeTypes).toContain(RangeType.DateRange);
    expect(rangeTypes).toContain(RangeType.DateRangeColon);
    expect(rangeTypes).toContain(RangeType.EventDefinition);
  });

  test("reports invalid custom patterns and continues parsing built-ins", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  - pattern: '['
    fromFormat: yyyy-MM-dd
    duration: 1 day
---
2026-02-03: Built-in date
`);

    expectRange(markwhen, 0, "2026-02-03", "2026-02-04");
    expect(markwhen.parseMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "error",
          message: expect.stringContaining("dateFormat"),
        }),
      ]),
    );
  });

  test("reports invalid fromFormat when a custom rule matches", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  - pattern: '^custom (\\d{4}-\\d{2}-\\d{2})$'
    from: '$1'
    fromFormat: not-a-date-format
    duration: 1 day
---
custom 2026-02-03: Bad custom format
2026-02-04: Built-in date
`);

    expect(getDateRanges(markwhen)).toHaveLength(1);
    expectRange(markwhen, 0, "2026-02-04", "2026-02-05");
    expect(markwhen.parseMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "error",
          message: expect.stringContaining("dateFormat"),
        }),
      ]),
    );
  });

  test("reports captured dates that match the pattern but fail to parse", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  - pattern: '^custom (\\d{4}-\\d{2}-\\d{2})$'
    from: '$1'
    fromFormat: yyyy-MM-dd
    duration: 1 day
---
custom 2026-99-99: Bad custom date
2026-02-04: Built-in date
`);

    expect(getDateRanges(markwhen)).toHaveLength(1);
    expectRange(markwhen, 0, "2026-02-04", "2026-02-05");
    expect(markwhen.parseMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "error",
          message: expect.stringContaining("dateFormat"),
        }),
      ]),
    );
  });

  test("unknown priority reports an error and defaults to first", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  priority: sideways
  rules:
    - pattern: '^(\\d{4})$'
      from: '1999-01-01'
      fromFormat: yyyy-MM-dd
      duration: 1 day
---
2026: Custom wins
`);

    expectRange(markwhen, 0, "1999-01-01", "1999-01-02");
    expect(markwhen.parseMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "error",
          message: expect.stringContaining("priority"),
        }),
      ]),
    );
  });

  test("malformed expanded dateFormat rules report an error and preserve built-ins", () => {
    const markwhen = parse(`
---
timezone: UTC
dateFormat:
  priority: only
  rules: nope
---
2026-02-04: Built-in date
`);

    expectRange(markwhen, 0, "2026-02-04", "2026-02-05");
    expect(markwhen.parseMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "error",
          message: expect.stringContaining("rules"),
        }),
      ]),
    );
  });

  test("custom date syntax uses the active timezone", () => {
    const markwhen = parse(`
---
timezone: America/New_York
dateFormat:
  - pattern: '^custom (\\d{4}-\\d{2}-\\d{2})$'
    from: '$1'
    fromFormat: yyyy-MM-dd
    duration: 1 day
---
custom 2026-02-03: New York custom date
`);

    const range = getDateRanges(markwhen)[0];
    expect(range.fromDateTime.offset).toBe(-300);
    expect(range.toDateTime.offset).toBe(-300);
    expectRange(markwhen, 0, "2026-02-03", "2026-02-04");
  });
});
