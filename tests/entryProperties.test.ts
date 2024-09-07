import { Event, isEventNode, iterate, parse, walk2 } from "../src";
import { NodeGroup } from "../src/Node";
import { nthEvent } from "./testUtilities";

const first = (mw: string) => nthEvent(parse(mw), 0);

describe("entry properties", () => {
  test("entry can have properties", () => {
    const mw = `2025-05-11: The day the music died
key: value
text down here
`;
    expect(first(mw).properties).toEqual({ key: "value" });
  });

  test("entry with properties has correct supplemental fields", () => {
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
  });

  test("multiple events", () => {
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

describe("group properties", () => {
  test("group can have properties", () => {
    const mw = `1999-09: birthday

group Happy events
someKey: some value
otherKey: other value

group Sad events
property: value
abc: 123

1995: another event`;

    const events = parse(mw);
    for (const { node } of walk2(events.entries)) {
      if (!node) {
        break;
      }
      if (isEventNode(node)) {
        continue;
      } else {
        const group = node as NodeGroup;
        if (group.title === "Happy events") {
          expect(group.properties).toEqual({
            someKey: "some value",
            otherKey: "other value",
          });
        } else if (group.title === "Sad events") {
          expect(group.properties).toEqual({
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
