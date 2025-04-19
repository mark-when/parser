import { parse, RangeType } from "../src/index";
import { nthEvent, sp } from "./testUtilities";
import { resolve } from "path";
import { readFileSync } from "fs";
import { set } from "../src/utilities/header";

const small = () => readFileSync(resolve("./", "tests/big.mw"), "utf-8");

describe("editors", () => {
  test.each(sp())("single editor", () => {
    const mw = parse(`
title: this is the title
edit: email@example.com`);

    const header = mw.header;
    expect(header.title).toBe("this is the title");
    expect(typeof header.edit).toBe("object");
    expect(header.edit.length).toBe(1);
    expect(header.edit as string[]).toContain("email@example.com");
  });

  test.each(sp())("Multiple editors separated by commas", () => {
    const mw = parse(`
title: this is the title
edit: email@example.com, other@example.com`);

    const header = mw.header;
    expect(header.title).toBe("this is the title");
    expect(typeof header.edit).toBe("object");
    expect(header.edit.length).toBe(2);
    expect(header.edit as string[]).toContain("email@example.com");
    expect(header.edit as string[]).toContain("other@example.com");
  });

  test.each(sp())("Multiple editors via yaml", () => {
    const mw = parse(`
title: this is the title
edit: 
  - email@example.com
  - other@example.com`);

    const header = mw.header;
    expect(header.title).toBe("this is the title");
    expect(typeof header.edit).toBe("object");
    expect(header.edit.length).toBe(2);
    expect(header.edit as string[]).toContain("email@example.com");
    expect(header.edit as string[]).toContain("other@example.com");
  });

  test.each(sp())("More editors via yaml", () => {
    const mw = parse(`
title: this is the title
edit: 
  - email@example.com
  - other@example.com
  - another@email.com`);

    const header = mw.header;
    expect(header.title).toBe("this is the title");
    expect(typeof header.edit).toBe("object");
    expect(header.edit.length).toBe(3);
    expect(header.edit as string[]).toContain("email@example.com");
    expect(header.edit as string[]).toContain("other@example.com");
    expect(header.edit as string[]).toContain("another@email.com");
  });
});

describe("Random items in header", () => {
  test.each(sp())("1", () => {
    const mw = parse(`
key: value
otherKey: otherValue

thirdKey:
  fourthKey:
    fifthKey: value`);

    const header = mw.header;
    expect(header.key).toBe("value");
    expect(header.otherKey).toBe("otherValue");
    expect(header.thirdKey.fourthKey.fifthKey).toBe("value");
  });

  test.each(sp())("small header", () => {
    const mw = parse(small());

    expect(Object.keys(mw.header).length).toBe(46);
  });
});

describe("Tags are correctly parsed", () => {
  test.each(sp())("1", () => {
    const mw = parse(`
title: Title
arbitraryThing:
  - one
  - two

#tag1: #abc
#tag2: red
#education: white

now: event`);

    expect(mw.header.title).toBe("Title");
    expect(mw.header.arbitraryThing).toStrictEqual(["one", "two"]);
    expect(mw.header[")tag1"]).toBe(")abc");
    expect(mw.header[")tag2"]).toBe("red");
    expect(mw.header[")education"]).toBe("white");
    expect(nthEvent(mw, 0).firstLine.datePart).toBe("now");
  });

  test.each(sp())("can use three dashes", () => {
    const mw = parse(`
---
#tag1: #abc
#tag2: red
#education: white

title: Title
arbitraryThing:
  - one
  - two
---

now: event`);

    const header = mw.header;
    // 5 plus dateFormat
    expect(Object.keys(header).length).toBe(6);
    expect(mw.header.title).toBe("Title");
    expect(mw.header.arbitraryThing).toStrictEqual(["one", "two"]);
    expect(nthEvent(mw, 0).firstLine.datePart).toBe("now");
  });
});

describe("Folding and ranges", () => {
  test.each(sp())("without dashes", () => {
    const mw = parse(`

title: Title
arbitraryThing:
  - one
  - two

now: event`);

    const headerFoldable = mw.foldables[2];
    expect(headerFoldable).toBeTruthy();
    expect(headerFoldable.type).toBe("header");
    expect(headerFoldable.endIndex).toBe(46);
  });

  test.each(sp())("with dashes", () => {
    const mw = parse(`

---
#tag1: #abc
#tag2: red
#education: white

title: Title
arbitraryThing:
  - one
  - two
  
title: Page 2 title
#page2tag: blue

arbEntry: value
---
now: event`);

    let headerFoldable = mw.foldables[2];
    expect(headerFoldable).toBeTruthy();
    expect(headerFoldable.type).toBe("header");
    expect(headerFoldable.foldStartIndex).toBe(5);
    expect(headerFoldable.endIndex).toBe(148);

    expect(mw.parseMessages.length).toBe(1);
    const error = mw.parseMessages[0];
    expect(error.type).toBe("error");
    expect(error.pos[0]).toBe(96);
  });

  test.each(sp())("overflow header items have correct ranges 1", () => {
    const mw = parse(`title: |
  longer title
  but it should be ok`);

    let visited = false;
    for (const range of mw.ranges) {
      if (range.type === RangeType.HeaderKey) {
        visited = true;
        expect(range.from).toBe(0);
        expect(range.to).toBe(5);
      }
    }
    expect(visited).toBe(true);
  });

  // test.each(sp())("overflow header items have correct ranges 2", () => {
  //   const mw = parse(`title: |
  // longer title
  // but it should be ok`);

  //   let visited = false;
  //   for (const range of mw.ranges) {
  //     if (range.type === RangeType.HeaderValue) {
  //       visited = true;
  //       expect(range.from).toBe(0);
  //       expect(range.to).toBe(5);
  //     }
  //   }
  //   expect(visited).toBe(true);
  // });
});

const replace = (
  originalString: string,
  toInsert?: { from: number; insert: string; to: number }
) =>
  toInsert
    ? originalString.substring(0, toInsert.from) +
      toInsert.insert +
      (toInsert.to ? originalString.substring(toInsert.to) : 0)
    : originalString;

describe("Programmatic editing", () => {
  test.each(sp())("can overwrite string", () => {
    const mw = `title: this is the title
description: This is the description
objectAsValue:
  aKey: value
  notherKey: v
`;

    const toInsert = set(mw, "description", "new description");
    expect(replace(mw, toInsert)).toBe(`title: this is the title
description: new description
objectAsValue:
  aKey: value
  notherKey: v
`);
  });

  test.each(sp())("can overwrite object with object", () => {
    const mw = `title: this is the title
description: This is the description
objectAsValue:
  aKey: value
  notherKey: v
`;

    const toInsert = set(mw, "objectAsValue", { neato: "cool" });
    expect(replace(mw, toInsert)).toBe(`title: this is the title
description: This is the description
objectAsValue:
  neato: cool

`);
  });

  test.each(sp())("can overwrite interior object with object", () => {
    const mw = `title: this is the title
description: This is the description
objectAsValue:
  aKey: value
  notherKey: v
key: v
`;

    const toInsert = set(mw, "objectAsValue", {
      neato: "cool",
      other: "thing",
    });
    expect(replace(mw, toInsert)).toBe(`title: this is the title
description: This is the description
objectAsValue:
  neato: cool
  other: thing
key: v
`);
  });

  test.each(sp())("can overwrite interior object with string", () => {
    const mw = `title: this is the title
description: This is the description
objectAsValue:
  aKey: value
  notherKey: v
key: v
`;

    const toInsert = set(mw, "objectAsValue", "hi");
    expect(replace(mw, toInsert)).toBe(`title: this is the title
description: This is the description
objectAsValue: hi
key: v
`);
  });

  test.each(sp())("can overwrite interior nested object", () => {
    const mw = `title: this is the title
description: This is the description
objectAsValue:
  aKey:
    value: interior
    notherKey: v
key: v
`;

    const toInsert = set(mw, "objectAsValue.aKey", "hi");
    expect(replace(mw, toInsert)).toBe(`title: this is the title
description: This is the description
objectAsValue:
  aKey: hi
key: v
`);
  });

  test.each(sp())("works with three dash syntax", () => {
    const mw = `

---
title: this is the title
description: This is the description
objectAsValue:
  aKey:
    value: interior
    notherKey: v
key: v
---
`;

    const toInsert = set(mw, "objectAsValue.aKey", { so: "this is christmas" });
    expect(replace(mw, toInsert)).toBe(`

---
title: this is the title
description: This is the description
objectAsValue:
  aKey:
    so: this is christmas
key: v
---
`);
  });

  test.each(sp())("works with three dash syntax", () => {
    const mw = `


title: this is the title
description: This is the description
objectAsValue:
  aKey:
    value: interior
    notherKey: v
key: v

`;

    const toInsert = set(mw, "objectAsValue.aKey.whimsy", {
      so: "this is christmas",
    });
    expect(replace(mw, toInsert)).toBe(`


title: this is the title
description: This is the description
objectAsValue:
  aKey:
    value: interior
    notherKey: v
    whimsy:
      so: this is christmas
key: v

`);
  });
});

describe("errors and warnings", () => {
  test("parsing errors are reported 1", () => {
    const mw = `---
key: value
:-error   
    
---`;
    const parsed = parse(mw);
    expect(parsed.parseMessages.length).toBe(1);
    expect(parsed.parseMessages[0].type).toBe("error");
    expect(parsed.parseMessages[0].pos[0]).toBe(15);
    expect(parsed.parseMessages[0].pos[1]).toBe(22);
  });

  test("no timezone warning", () => {
    const mw = `now: event`;
    const parsed = parse(mw);
    expect(parsed.documentMessages.length).toBe(1);
    expect(parsed.documentMessages[0].type).toBe("warning");
  });

  test("invalid timezone error", () => {
    const mw = `timezone: America Los Angerles`;
    const parsed = parse(mw);
    const error = parsed.parseMessages.find(({ type }) => type === "error");
    expect(error).toBeTruthy();
    expect(error!.pos).toEqual([10, 30]);
    expect(error?.message).toBe('Invalid timezone "America Los Angerles"');
  });

  test("invalid timezone error 2", () => {
    const mw = `title: My timeline
timezone: bds`;
    const parsed = parse(mw);
    const error = parsed.parseMessages.find(({ type }) => type === "error");
    expect(error).toBeTruthy();
    expect(error!.pos).toEqual([29, 32]);
    expect(error?.message).toBe('Invalid timezone "bds"');
  });
});
