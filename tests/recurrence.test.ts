import { parse } from "../src"
import { nthEvent } from "./main.test"
import { expand, expandEvent } from "../src/utilities/recurrence"
import { toDateRange } from "../src/Types"

test("expansion 1", () => {
  const mw = parse(`2019-01-01 / 2022-08-07 every 3 days for 3 days: event title`)

  const first = nthEvent(mw, 0)
  const expansion = expandEvent(first, 10)

  expect(expansion.length).toBe(1)
  expect(expansion[0].dateRangeIso).toEqual(first.dateRangeIso)
})

test("expansion times", () => {
  const mw = parse(`2022-08-07 every 12 months x30: event title`);

  const first = nthEvent(mw, 0)
  const expansion = expandEvent(first, 50)

  expect(expansion.length).toBe(30)
})

test("expansion limit", () => {
  const mw = parse(`2022-08-07 every 12 months x30: event title`);

  const first = nthEvent(mw, 0)
  const expansion = expandEvent(first, 10)

  expect(expansion.length).toBe(10)
})

test("expansion 2", () => {
  const mw = parse(`2022-08-07 every 12 months x30: event title`);

  const first = nthEvent(mw, 0)
  const expansion = expand(toDateRange(first.dateRangeIso), first.recurrence!, 10)

  expect(expansion.length).toBe(10)
  expect(expansion[expansion.length - 1].fromDateTime.toISODate()).toBe('2031-08-07')
})

test("expansion 3", () => {
  const mw = parse(`2022-08-07 every 12 months x30: event title`);

  const first = nthEvent(mw, 0)
  const expansion = expand(toDateRange(first.dateRangeIso), first.recurrence!, 50)

  expect(expansion.length).toBe(30)
  expect(expansion[expansion.length - 1].fromDateTime.toISODate()).toBe('2051-08-07')
})