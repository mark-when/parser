import { parse } from "../src";
import { sp } from "./testUtilities";

describe("foldables", () => {
  test("group foldables", () => {
    const mw = parse(`
  group 1
  group 2
  group 3
  group 4
  group 5
  2021: an event
  endGroup
  endGroup
  endGroup
  endGroup
  endGroup
  
  2022: last event`);

    const foldables = mw.foldables;
    expect(Object.keys(foldables).length).toBe(5);
    expect(foldables[1]).toEqual({
      foldStartIndex: 10,
      endIndex: 122,
      startIndex: 1,
      startLine: 1,
      type: "section",
    });
  });
});
