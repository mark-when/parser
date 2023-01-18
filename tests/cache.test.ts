import profiler from "v8-profiler-next";
import path from "path";
import * as fs from "fs";
import { readFileSync } from "fs";
import { parse } from "../src";
import { Cache } from "../src/Cache";

profiler.setGenerateType(1);
const title = "cache-test";

const bigTimeline = () =>
  readFileSync(path.resolve("./", "tests/big.mw"), "utf-8");

describe("caching", () => {
  profiler.startProfiling(title, true);
  afterAll(() => {
    const profile = profiler.stopProfiling(title);
    profile.export(function (error, result: any) {
      // if it doesn't have the extension .cpuprofile then
      // chrome's profiler tool won't like it.
      // examine the profile:
      //   Navigate to chrome://inspect
      //   Click Open dedicated DevTools for Node
      //   Select the profiler tab
      //   Load your file
      fs.writeFileSync(`${title}.cpuprofile`, result);
      profile.delete();
    });
  });
  test("Using cache results in same ", () => {
    const big = bigTimeline();

    const cache = new Cache();
    let start = performance.now();
    const mw1 = parse(big, cache);
    const first = performance.now() - start;

    start = performance.now();
    const mw2 = parse(big, cache);
    const second = performance.now() - start;

    console.log(first, second);
    expect(second).toBeLessThan(first);
  });
});
