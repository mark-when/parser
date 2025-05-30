import { parse } from "../src";
import { expand, expandEvent } from "../src/utilities/recurrence";
import { toDateRange } from "../src/Types";
import { nthEvent } from "./testUtilities";
import { DateTime } from "luxon";
import {
  recurrence1,
  recurrence2,
  recurrence3,
  recurrence4,
  recurrence5,
  recurrence6,
} from "./testStrings";

// test("expansion 1", () => {
//   const mw = parse(
//     `2019-01-01 / 2022-08-07 every 3 days for 3 days: event title`
//   );

//   const first = nthEvent(mw, 0);
//   const expansion = expandEvent(first, 10);

//   expect(expansion.length).toBe(1);
//   expect(expansion[0].dateRangeIso).toEqual(first.dateRangeIso);
// });

test("expansion times", () => {
  const mw = parse(recurrence1);

  const first = nthEvent(mw, 0);
  const expansion = expandEvent(first, 50);

  expect(expansion.length).toBe(30);
});

test("expansion limit", () => {
  const mw = parse(recurrence1);

  const first = nthEvent(mw, 0);
  const expansion = expandEvent(first, 10);

  expect(expansion.length).toBe(10);
});

test("expansion 2", () => {
  const mw = parse(recurrence1);

  const first = nthEvent(mw, 0);
  const expansion = expand(
    toDateRange(first.dateRangeIso),
    first.recurrence!,
    10
  );

  expect(expansion.length).toBe(10);
  expect(expansion[expansion.length - 1].fromDateTime.toISODate()).toBe(
    "2031-08-07"
  );
});

test("expansion 3", () => {
  const mw = parse(recurrence1);

  const first = nthEvent(mw, 0);
  const expansion = expand(
    toDateRange(first.dateRangeIso),
    first.recurrence!,
    50
  );

  expect(expansion.length).toBe(30);
  expect(expansion[expansion.length - 1].fromDateTime.toISODate()).toBe(
    "2051-08-07"
  );
});

test("until 1", () => {
  const mw = parse(recurrence2);
  const first = nthEvent(mw, 0);
  expect(first.recurrence).toBeTruthy();
});

test("until 2", () => {
  const mw = parse(recurrence2);
  const first = nthEvent(mw, 0);
  // expect(first.recurrence!.til!.substring(0, 10)).toBe(`2025-02-28`);
});

test("until 3", () => {
  const mw = parse(recurrence2);
  const first = nthEvent(mw, 0);
  const expansion = expand(
    toDateRange(first.dateRangeIso),
    first.recurrence!,
    100
  );

  expect(expansion.length).toBe(23);
});

test("until 4", () => {
  const mw = parse(recurrence3);
  const first = nthEvent(mw, 0);
  const expansion = expand(
    toDateRange(first.dateRangeIso),
    first.recurrence!,
    100
  );

  expect(expansion.length).toBe(25);
});

test("until 4", () => {
  const mw = parse(recurrence4);
  const first = nthEvent(mw, 0);
  const expansion = expand(
    toDateRange(first.dateRangeIso),
    first.recurrence!,
    100
  );

  expect(expansion.length).toBe(25);
});

test("until now", () => {
  const mw = parse(recurrence5);
  const first = nthEvent(mw, 0);
  expect(DateTime.fromISO(first.recurrence!.until!).toISODate()).toBe(
    DateTime.now().toISODate()
  );
});

test("illogical until date is ignored", () => {
  const mw = parse(recurrence6);
  const first = nthEvent(mw, 0);
  const expansion = expand(
    toDateRange(first.dateRangeIso),
    first.recurrence!,
    100
  );

  expect(expansion.length).toBe(1);
});

// test("until text range 3", () => {
//   const mw = parse(`2025 every other year until now: Event`);
//   let visited = false;
//   for (const range of mw.ranges) {
//     if (range.type === RangeType.RecurrenceTilDate) {
//       visited = true;
//       expect(range.from).toBe(28);
//       expect(range.to).toBe(28 + 3);
//     }
//   }
//   expect(visited).toBeTruthy();
// });
