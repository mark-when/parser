import { parse, toDateRange } from "../src";
import { eventsWithTz } from "./testStrings";
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
});
