import { readFileSync, writeFileSync } from "fs";
import { parseICal } from "../src";
import { resolve } from "path";
import { muricaMap } from "../src/utilities/dateRangeToString";

describe("ical parsing", () => {
  test("parses ical", () => {
    const ical1 = readFileSync(resolve("./", "tests/school.ics"), "utf-8");
    const mw = parseICal(ical1, { formap: muricaMap }) as string;
    writeFileSync(resolve("./", "tests/school.mw"), mw);
  });
});
