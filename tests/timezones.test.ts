import { DateTime } from "luxon";
import { parse, toDateRange } from "../src";
import { eventsWithFromAndToTz, eventsWithTz } from "./testStrings";
import { nthEvent } from "./testUtilities";

describe("timezones", () => {
  test("timezone by event property", () => {
    const mw = parse(eventsWithTz);
    const ny = nthEvent(mw, 0);
    const tok = nthEvent(mw, 1);

    expect(
      toDateRange(ny.dateRangeIso)
        .fromDateTime.diff(toDateRange(tok.dateRangeIso).fromDateTime)
        .as("hours")
    ).toBe(9 + 4);
  });

  test("timezone by group property", () => {
    const mw = parse(eventsWithTz);
    const la = nthEvent(mw, 2);

    expect(toDateRange(la.dateRangeIso).fromDateTime.zone.name).toBe("UTC+6");
  });

  test("different from and to timezones", () => {
    const mw = parse(eventsWithFromAndToTz);
    const nyla = nthEvent(mw, 2);
    const ny = DateTime.fromISO("2025-09-14", { zone: "America/New_York" });
    const la = DateTime.fromISO("2025-09-15", { zone: "America/Los_Angeles" });
    const dr = toDateRange(nyla.dateRangeIso);
    debugger;
    expect(+dr.fromDateTime).toBe(+ny);
    expect(+dr.toDateTime).toBe(+la);
  });
});
