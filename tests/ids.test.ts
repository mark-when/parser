import { parse } from "../src";

describe("ided events", () => {
  test("ided event has correct path", () => {
    const mw = parse(`title: hello
2025-04: !id hi

group Group
2025-06: !otherId hello
section Section
2026: !thirdId hello
end
end`);

    expect(mw.ids["!id"]).toEqual([0]);
    expect(mw.ids["!otherId"]).toEqual([1, 0]);
    expect(mw.ids["!thirdId"]).toEqual([1, 1, 0]);
  });
});
