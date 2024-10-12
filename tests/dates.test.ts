import { parse, parseDateRange } from "../src";
import { toDateRange } from "../src";
import { DateTime } from "luxon";
import { firstEvent } from "./testUtilities";

/**
 * NOTE: I find it weird that the expectedTo date is always the next day at 00:00:00. Shouldn't it be the same day at 23:59:59?
 */
describe("Regular dates parsing", () => {
  // List the case
  const testCases = [
    // The Common usage case (relatively recent/present dates)
    {
      mwInput: "2025-05-11: The day the music died",
      expectedFrom: DateTime.fromObject({ year: 2025, month: 5, day: 11 }),
      //expectedTo: DateTime.fromObject({ year: 2025, month: 5, day: 11 })
      expectedTo: DateTime.fromObject({ year: 2025, month: 5, day: 12 }),
    },
    {
      mwInput: "1999 - 2099: a century of events",
      expectedFrom: DateTime.fromObject({ year: 1999, month: 1, day: 1 }),
      expectedTo: DateTime.fromObject({ year: 2100, month: 1, day: 1 }),
    },
    {
      mwInput: "2026 - 2029: so many events",
      expectedFrom: DateTime.fromObject({ year: 2026, month: 1, day: 1 }),
      expectedTo: DateTime.fromObject({ year: 2030, month: 1, day: 1 }),
    },
    // TODO: Import case from main.test.ts

    // Dwell into the past with BCE dates (relatively ancient dates)
    // note: BCE (Before the Common Era) === BC (Before Christ)
    // note: CE (Common Era) === AD (Anno Domini)
    //
    // IMPORTANT: expected date are 1 year less than input. its because there's no year 0.
    // From 1 BCE we go to 1 CE (no 0 while in javascript we do have year 0)
    {
      mwInput: "1000 BCE: The Iron Age",
      expectedFrom: DateTime.fromObject({ year: -999, month: 1, day: 1 }),
      expectedTo: DateTime.fromObject({ year: -998, month: 1, day: 1 }),
    },
    {
      mwInput: "586 BCE: The Siege of Jerusalem",
      expectedFrom: DateTime.fromObject({ year: -585, month: 1, day: 1 }),
      expectedTo: DateTime.fromObject({ year: -584, month: 1, day: 1 }),
    },
    {
      mwInput: "285–247 BCE: Ptolemy II Philadelphus",
      expectedFrom: DateTime.fromObject({ year: -284, month: 1, day: 1 }),
      expectedTo: DateTime.fromObject({ year: -246, month: 1, day: 1 }),
    },
    {
      mwInput:
        "586 BC- 70 AD: Second Temple period which end by the Siege of Jerusalem by the Romans",
      expectedFrom: DateTime.fromObject({ year: -585, month: 1, day: 1 }),
      expectedTo: DateTime.fromObject({ year: 70, month: 1, day: 1 }),
    },
  ];

  // Test Each case against parseDateRange
  testCases.forEach(({ mwInput, expectedFrom, expectedTo }) => {
    test(`Should correctly parseDateRange: "${mwInput}"`, () => {
      // Process ----
      const dateRange = parseDateRange(mwInput);
      expect(dateRange).toBeTruthy();
      const from = dateRange?.fromDateTime;
      const to = dateRange?.toDateTime;
      // Test result ----
      expect(from?.year).toEqual(expectedFrom.year);
      expect(from?.month).toEqual(expectedFrom.month);
      expect(from?.day).toEqual(expectedFrom.day);
      expect(to?.year).toEqual(expectedTo.year);
      expect(to?.month).toEqual(expectedTo.month);
      expect(to?.day).toEqual(expectedTo.day);
    });
  });

  // Test Each case against parse
  testCases.forEach(({ mwInput, expectedFrom, expectedTo }) => {
    test(`Should correctly parse "${mwInput}"`, () => {
      // Process ----
      const markwhen = parse(mwInput);
      const dateRange = toDateRange(firstEvent(markwhen).dateRangeIso);
      const from = dateRange.fromDateTime;
      const to = dateRange.toDateTime;
      // Test result ----
      expect(from?.year).toEqual(expectedFrom.year);
      expect(from?.month).toEqual(expectedFrom.month);
      expect(from?.day).toEqual(expectedFrom.day);
      expect(to?.year).toEqual(expectedTo.year);
      expect(to?.month).toEqual(expectedTo.month);
      expect(to?.day).toEqual(expectedTo.day);
    });
  });
});
