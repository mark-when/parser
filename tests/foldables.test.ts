import { Foldable, parse } from "../src";

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

  test("through end of event", () => {
    const mw = parse(`4/27/2025: 
what: ho
key: value

i don't know what's going o`);

    expect(mw.foldables[0]).toMatchObject({
      foldStartIndex: 11,
      startLine: 0,
      startIndex: 11,
      endIndex: 59,
    } as Foldable);
  });

  test("through end of event 2", () => {
    const mw = parse(`4/27/2025: 
what: ho
key: value

i don't know what's going o

`);

    expect(mw.foldables[0]).toMatchObject({
      foldStartIndex: 11,
      startLine: 0,
      startIndex: 11,
      endIndex: 61,
    } as Foldable);
  });

  test("through end of event 2", () => {
    const mw = parse(`4/27/2025: 
what: ho
key: value

i don't know what's going o

now: neat`);

    expect(mw.foldables[0]).toMatchObject({
      foldStartIndex: 11,
      startLine: 0,
      startIndex: 11,
      endIndex: 61,
    } as Foldable);
  });

  test("through end of event 3", () => {
    const mw = parse(`2025: e

2025: e`);

    expect(mw.foldables[0]).toMatchObject({
      foldStartIndex: 7,
      startLine: 0,
      startIndex: 7,
      endIndex: 8,
    } as Foldable);
  });
});
