import { parse } from "../src/index";
import { nthEvent } from "./testUtilities";
import path from "path";
import { readFileSync } from "fs";

const small = () => readFileSync(path.resolve("./", "tests/big.mw"), "utf-8");

describe("editors", () => {
  test("single editor", () => {
    const mw = parse(`
title: this is the title
edit: email@example.com`);

    const header = mw.timelines[0].header;
    expect(header.title).toBe("this is the title");
    expect(typeof header.edit).toBe("object");
    expect(header.edit.length).toBe(1);
    expect(header.edit as string[]).toContain("email@example.com");
  });

  test("Multiple editors separated by commas", () => {
    const mw = parse(`
    title: this is the title
    edit: email@example.com, other@example.com`);

    const header = mw.timelines[0].header;
    expect(header.title).toBe("this is the title");
    expect(typeof header.edit).toBe("object");
    expect(header.edit.length).toBe(2);
    expect(header.edit as string[]).toContain("email@example.com");
    expect(header.edit as string[]).toContain("other@example.com");
  });

  test("Multiple editors via yaml", () => {
    const mw = parse(`
    title: this is the title
    edit: 
      - email@example.com
      - other@example.com`);

    const header = mw.timelines[0].header;
    expect(header.title).toBe("this is the title");
    expect(typeof header.edit).toBe("object");
    expect(header.edit.length).toBe(2);
    expect(header.edit as string[]).toContain("email@example.com");
    expect(header.edit as string[]).toContain("other@example.com");
  });

  test("More editors via yaml", () => {
    const mw = parse(`
    title: this is the title
    edit: 
      - email@example.com
      - other@example.com
      - another@email.com`);

    const header = mw.timelines[0].header;
    expect(header.title).toBe("this is the title");
    expect(typeof header.edit).toBe("object");
    expect(header.edit.length).toBe(3);
    expect(header.edit as string[]).toContain("email@example.com");
    expect(header.edit as string[]).toContain("other@example.com");
    expect(header.edit as string[]).toContain("another@email.com");
  });
});

describe("Random items in header", () => {
  test("1", () => {
    const mw = parse(`
    key: value
    otherKey: otherValue
    
    
    thirdKey:
      fourthKey:
        fifthKey: value`);

    const header = mw.timelines[0].header;
    expect(header.key).toBe("value");
    expect(header.otherKey).toBe("otherValue");
    expect(header.thirdKey.fourthKey.fifthKey).toBe("value");
  });

  describe("small header", () => {
    const mw = parse(small());

    expect(Object.keys(mw.timelines[0].header).length).toBe(2);
  });
});

describe("Tags are correctly parsed", () => {
  test("1", () => {
    const mw = parse(`
    #tag1: #abc
    #tag2: red
    #education: white
    
    title: Title
    arbitraryThing:
      - one
      - two
      
    now: event`);

    const tags = mw.timelines[0].tags;
    expect(Object.keys(tags).length).toBe(3);
    expect(mw.timelines[0].header.title).toBe("Title");
    expect(mw.timelines[0].header.arbitraryThing).toStrictEqual(["one", "two"]);
    expect(nthEvent(mw, 0).dateText).toBe("now");
  });
});

test("can use three dashes", () => {
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

  const tags = mw.timelines[0].tags;
  expect(Object.keys(tags).length).toBe(3);
  expect(mw.timelines[0].header.title).toBe("Title");
  expect(mw.timelines[0].header.arbitraryThing).toStrictEqual(["one", "two"]);
  expect(nthEvent(mw, 0).dateText).toBe("now");
});

describe("Folding and ranges", () => {
  test("without dashes", () => {
    const mw = parse(`

title: Title
arbitraryThing:
  - one
  - two

now: event`);

    const headerFoldable = mw.timelines[0].foldables[2];
    expect(headerFoldable).toBeTruthy();
    expect(headerFoldable.type).toBe("header");
    expect(headerFoldable.endIndex).toBe(46);
  });

  test("with dashes", () => {
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


_-_-_break_-_-_

title: Page 2 title
#page2tag: blue

arbEntry: value

now: event`);

    let headerFoldable = mw.timelines[0].foldables[2];
    expect(headerFoldable).toBeTruthy();
    expect(headerFoldable.type).toBe("header");
    expect(headerFoldable.foldStartIndex).toBe(5);
    expect(headerFoldable.endIndex).toBe(95);
  });
});

describe("Programmatic editing", () => {
  const mw = `title: this is the title
description: This is the description
objectAsValue:
  aKey: value
  notherKey: v
`

})
