import { Event, isEvent, iter, parse, RangeType } from "../src";
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

group Happy events
someKey: some value
otherKey: other value

group Sad events
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

group Happy events
someKey: some value
otherKey: other value

group Sad events
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
