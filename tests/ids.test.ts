import { parse, toDateRange } from "../src";
import { nthEvent } from "./testUtilities";

describe("ided events", () => {
  test("ided event has correct path", () => {
    const mw = parse(`title: hello
2025-04: !id hi

# Group
2025-06: !otherId hello
## Section
2026: !thirdId hello`);

    expect(mw.ids["id"]).toEqual([0]);
    expect(mw.ids["otherId"]).toEqual([1, 0]);
    expect(mw.ids["thirdId"]).toEqual([1, 1, 0]);
  });

  test("id specified via properties override first line definition", () => {
    const mw = parse(`2025: !id
id: realId`);
    expect(mw.ids["realId"]).toEqual([0]);
  });

  test("id specified via properties can be correctly referenced", () => {
    const mw = parse(`2025: !id
id: realId

after !realId 5 years: 2030?`);
    const event = nthEvent(mw, 1);
    expect(toDateRange(event.dateRangeIso).fromDateTime.year).toEqual(2026);
    expect(toDateRange(event.dateRangeIso).toDateTime.year).toEqual(2031);
  });
});
