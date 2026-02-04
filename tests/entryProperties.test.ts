import { Event, isEvent, iter, parse, RangeType } from "../src";
import { entrySet } from "../src/utilities/properties";
import { nthEvent, sp } from "./testUtilities";

const first = (mw: string) => nthEvent(parse(mw), 0);

describe("entry properties", () => {
  test.each(sp())("entry can have properties", () => {
    const mw = `2025-05-11: The day the music died
key: value
text down here
`;
    expect(first(mw).properties).toEqual({ key: "value" });
  });

  test.each(sp())(
    "entry with properties has correct supplemental fields",
    () => {
      const mw = `2025: a year of events
properties: true
otherKey: value

- [] a list item
- [] another list item
`;
      const firstEvent = first(mw);
      expect(firstEvent.properties).toEqual({
        properties: true,
        otherKey: "value",
      });

      expect(firstEvent.firstLine.restTrimmed).toBe("a year of events");
      expect(firstEvent.supplemental.length).toBe(2);
      expect(firstEvent.supplemental[0].type).toBe("checkbox");
      expect(firstEvent.supplemental[1].type).toBe("checkbox");
    }
  );

  test.each(sp())("multiple events", () => {
    const mw = `2026 - 2029: so many events
thisHasProperties:
  indented: some value with spaces

March 3 2025: future time

Jan 9 1999: past time
old: yes`;

    const events = parse(mw);
    const first = nthEvent(events, 0);
    const second = nthEvent(events, 1);
    const third = nthEvent(events, 2);

    expect(first.properties).toEqual({
      thisHasProperties: { indented: "some value with spaces" },
    });
    expect(first.supplemental.length).toBe(0);

    expect(second.properties).toEqual({});
    expect(second.firstLine.restTrimmed).toBe("future time");
  });
});

describe("proper ranges", () => {
  test.each(sp())("proper ranges 1", () => {
    const mw = `1999-09: birthday
propKey: l`;
    const parsed = parse(mw);
    expect(nthEvent(parsed, 0).properties).toEqual({ propKey: "l" });
    let visited = false;
    for (const range of parsed.ranges) {
      if (range.type === RangeType.PropertyKey) {
        visited = true;
        expect(range.from).toBe(18);
        expect(range.to).toBe(25);
      }
    }
    expect(visited).toBe(true);
  });

  test.each(sp())("proper ranges 2", () => {
    const mw = `1999-09: birthday
propKey:`;
    const parsed = parse(mw);
    expect(nthEvent(parsed, 0).properties).toEqual({ propKey: null });
    let visited = false;
    for (const range of parsed.ranges) {
      if (range.type === RangeType.PropertyKey) {
        visited = true;
        expect(range.from).toBe(18);
        expect(range.to).toBe(25);
      }
    }
    expect(visited).toBe(true);
  });

  test.each(sp())("proper ranges 3", () => {
    const mw = `1999-09: birthday
propKey: l`;
    const parsed = parse(mw);
    expect(nthEvent(parsed, 0).properties).toEqual({ propKey: "l" });
    let visited = false;
    for (const range of parsed.ranges) {
      if (range.type === RangeType.PropertyValue) {
        visited = true;
        expect(range.from).toBe(26);
        expect(range.to).toBe(28);
      }
    }
    expect(visited).toBe(true);
  });

  test.each(sp())("proper ranges 4", () => {
    const mw = `1999-09: birthday
propKey: l  1`;
    const parsed = parse(mw);
    expect(nthEvent(parsed, 0).properties).toEqual({ propKey: "l  1" });
    let visited = false;
    for (const range of parsed.ranges) {
      if (range.type === RangeType.PropertyValue) {
        visited = true;
        expect(range.from).toBe(26);
        expect(range.to).toBe(31);
      }
    }
    expect(visited).toBe(true);
  });

  test.each(sp())("proper ranges 5", () => {
    const mw = `1999-09: birthday
propKey: l  1`;
    const parsed = parse(mw);
    expect(nthEvent(parsed, 0).properties).toEqual({ propKey: "l  1" });
    let visited = false;
    for (const range of parsed.ranges) {
      if (range.type === RangeType.PropertyKey) {
        visited = true;
        expect(range.from).toBe(18);
        expect(range.to).toBe(25);
      }
    }
    expect(visited).toBe(true);
  });

  test.each(sp())("proper ranges 6", () => {
    const mw = `1999-09: birthday
x: something:with colon `;
    const parsed = parse(mw);
    expect(nthEvent(parsed, 0).properties).toEqual({
      x: "something:with colon",
    });
    let visited = false;
    for (const range of parsed.ranges) {
      if (range.type === RangeType.PropertyKey) {
        visited = true;
        expect(range.from).toBe(18);
        expect(range.to).toBe(19);
      }
    }
    expect(visited).toBe(true);
  });

  test.each(sp())("proper ranges 7", () => {
    const mw = `1999-09: birthday
x: something:with colon `;
    const parsed = parse(mw);
    expect(nthEvent(parsed, 0).properties).toEqual({
      x: "something:with colon",
    });
    let visited = false;
    for (const range of parsed.ranges) {
      if (range.type === RangeType.PropertyValue) {
        visited = true;
        expect(range.from).toBe(20);
        expect(range.to).toBe(42);
      }
    }
    expect(visited).toBe(true);
  });

  test.each(sp())("proper ranges 8", () => {
    const mw = `1999-09: birthday
  propKey: l`;
    const parsed = parse(mw);
    expect(nthEvent(parsed, 0).properties).toEqual({ propKey: "l" });
    let visited = false;
    for (const range of parsed.ranges) {
      if (range.type === RangeType.PropertyKey) {
        visited = true;
        expect(range.from).toBe(20);
        expect(range.to).toBe(27);
      }
    }
    expect(visited).toBe(true);
  });
});

describe("permitted keys", () => {
  test("dashes", () => {
    const mw = `1999: event
    key-with-dashes: value`;

    const events = parse(mw);
    const first = nthEvent(events, 0);
    expect(first.properties["key-with-dashes"]).toBe("value");
  });

  test("periods", () => {
    const mw = `1999: event
    key-with.period: value`;

    const events = parse(mw);
    const first = nthEvent(events, 0);
    expect(first.properties["key-with.period"]).toBe("value");
  });
});

describe("hex values", () => {
  test("replaces hex with right paren", () => {
    const mw = `2028: event
    key:  
      nested: #value`;
    const events = parse(mw);
    const first = nthEvent(events, 0);
    expect(first.properties.key.nested).toBe(")value");
  });
});

describe("prop order", () => {
  test("propOrder is correct 1", () => {
    const mw = `1999-09: birthday

# Happy events
someKey: some value
otherKey: other value

# Sad events
property: value
abc: 123

1995: another event`;

    const events = parse(mw);
    for (const { eventy } of iter(events.events)) {
      if (!eventy) {
        break;
      }
      if (isEvent(eventy)) {
        continue;
      } else {
        if (eventy.title === "Happy events") {
          expect(eventy.propOrder).toEqual(["someKey", "otherKey"]);
        } else if (eventy.title === "Sad events") {
          expect(eventy.propOrder).toEqual(["property", "abc"]);
        }
      }
    }

    expect(nthEvent(events, 0).firstLine.restTrimmed).toBe("birthday");
    expect(nthEvent(events, 1).firstLine.restTrimmed).toBe("another event");
  });

  test("propOrder is correct 2", () => {
    const mw = `2028: event
    key:  
      nested: #value
    anotherKey: value
    kf: 
      nest:
        ok: yes
    oh: yes`;
    const events = parse(mw);
    const first = nthEvent(events, 0);
    expect(first.propOrder).toEqual(["key", "anotherKey", "kf", "oh"]);
    expect(first.properties.kf.nest.ok).toBe("yes");
  });
});

describe("group properties", () => {
  test.each(sp())("group can have properties", () => {
    const mw = `1999-09: birthday

# Happy events
someKey: some value
otherKey: other value

# Sad events
property: value
abc: 123

1995: another event`;

    const events = parse(mw);
    for (const { eventy } of iter(events.events)) {
      if (!eventy) {
        break;
      }
      if (isEvent(eventy)) {
        continue;
      } else {
        if (eventy.title === "Happy events") {
          expect(eventy.properties).toEqual({
            someKey: "some value",
            otherKey: "other value",
          });
        } else if (eventy.title === "Sad events") {
          expect(eventy.properties).toEqual({
            property: "value",
            abc: 123,
          });
        }
      }
    }

    expect(nthEvent(events, 0).firstLine.restTrimmed).toBe("birthday");
    expect(nthEvent(events, 1).firstLine.restTrimmed).toBe("another event");
  });
});

describe("property indices", () => {
  test("has proper indices 1", () => {
    const mw = parse(`# my group
prop: value`);
    const group = mw.events.children[0];
    expect(group.textRanges.properties?.from).toBe(11);
    expect(group.textRanges.properties?.to).toBe(22);
  });

  test("has proper indices 2", () => {
    const mw = parse(`# my group
prop: value
`);
    const group = mw.events.children[0];
    expect(group.textRanges.properties?.from).toBe(11);
    expect(group.textRanges.properties?.to).toBe(22);
  });

  test("has proper indices 3", () => {
    const mw = parse(`# my group
prop: value

2024: neat
key:
  other: value`);
    const group = nthEvent(mw, 0);
    expect(group.textRanges.properties?.from).toBe(35);
    expect(group.textRanges.properties?.to).toBe(54);
  });
});

const replace = (
  originalString: string,
  toInsert?: { from: number; insert: string; to?: number }
) =>
  toInsert
    ? originalString.substring(0, toInsert.from) +
      toInsert.insert +
      originalString.substring(toInsert.to ? toInsert.to : toInsert.from)
    : originalString;

describe("setting eventy properties", () => {
  test.each(sp())("can set group property", () => {
    const mw = `# My group
2022-04: Birthday month`;

    const toInsert = entrySet(mw, [0], { key: "value" });
    expect(replace(mw, toInsert)).toBe(`# My group
  key: value
2022-04: Birthday month`);
  });

  test.each(sp())("can set event property", () => {
    const mw = `# My group
2022-04: Birthday month
## nested
2026-04: Another birthday month`;

    const toInsert = entrySet(mw, [0, 1, 0], { key: "value" });
    expect(replace(mw, toInsert)).toBe(`# My group
2022-04: Birthday month
## nested
2026-04: Another birthday month
      key: value
`);
  });

  test.each(sp())("can set nested event property", () => {
    const mw = `# My group
2022-04: Birthday month
## nested
2026-04: Another birthday month`;

    const toInsert = entrySet(mw, [0, 1], {
      layer: { nested: ["array", "of", "values"] },
    });
    expect(replace(mw, toInsert)).toBe(`# My group
2022-04: Birthday month
## nested
    layer:
      nested: ["array", "of", "values"]
2026-04: Another birthday month`);
  });

  test.each(sp())("can set prop on last eventy", () => {
    const mw = `# My group
2022-04: Birthday month
## nested
2026-04: Another birthday month

now: hi`;

    const toInsert = entrySet(mw, [0, 1, 1], { layer: { nested: 12 } });
    expect(replace(mw, toInsert)).toBe(`# My group
2022-04: Birthday month
## nested
2026-04: Another birthday month

now: hi
      layer:
        nested: 12
`);
  });

  test.each(sp())("can use hex values as properties", () => {
    const mw = `# My group
2022-04: Birthday month`;

    const toInsert = entrySet(mw, [0], { key: "#123fde" });
    expect(replace(mw, toInsert)).toBe(`# My group
  key: #123fde
2022-04: Birthday month`);
  });

  test.each(sp())("nested values are preserved", () => {
    const mw = `# My group
2022-04: Birthday month
## nested
2026-04: Another birthday month
property: value
other: thing
layer:
  random: false

now: hi`;

    const toInsert = entrySet(mw, [0, 1, 0], { layer: { nested: 12 } }, true);
    const replaced = replace(mw, toInsert);
    expect(replaced).toBe(`# My group
2022-04: Birthday month
## nested
2026-04: Another birthday month
      property: value
      other: thing
      layer:
        random: false
        nested: 12

now: hi`);
  });

  test("deleting values", () => {
    const mw = `# My group
2022-04: Birthday month
## nested
2026-04: Another birthday month
property: value
other: thing
layer:
  random: false
  nested: 12

now: hi`;

    const toInsert = entrySet(mw, [0, 1, 0], { layer: undefined });
    const replaced = replace(mw, toInsert);
    expect(replaced).toBe(`# My group
2022-04: Birthday month
## nested
2026-04: Another birthday month


now: hi`);
  });

  test("deleting values merge", () => {
    const mw = `# My group
2022-04: Birthday month
## nested
2026-04: Another birthday month
property: value
other: thing
layer:
  random: false
  nested: 12

now: hi`;

    const toInsert = entrySet(mw, [0, 1, 0], { layer: undefined }, true);
    const replaced = replace(mw, toInsert);
    expect(replaced).toBe(`# My group
2022-04: Birthday month
## nested
2026-04: Another birthday month
      property: value
      other: thing

now: hi`);
  });
});
