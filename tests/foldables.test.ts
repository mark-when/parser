import { Foldable, parse } from "../src";

describe("foldables", () => {
  test("group foldables", () => {
    const mw = parse(`
# 1
## 2
### 3
#### 4
##### 5
2021: an event

2022: last event`);

    const foldables = mw.foldables;
    expect(Object.keys(foldables).length).toBe(6);
    expect(foldables[1]).toEqual({
      foldStartIndex: 4,
      endIndex: 63,
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
