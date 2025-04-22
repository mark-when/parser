import { parse } from "../src";
import {
  relativeToId,
  relativeToPrevious1,
  relativeToPreviousAndStart,
  relativeToStart1,
} from "./testStrings";
import { nthEvent, sp } from "./testUtilities";

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
    expect(event.isRelative).toBeTruthy()
  });

  test('relative 3', () => {
    const mw = parse(relativeToId)
    const event = nthEvent(mw, 1)
    expect(event.isRelative).toBeTruthy()
    
  })
});
