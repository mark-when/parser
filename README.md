# Markwhen parser

Parse markwhen documents. Outputs a list of events given plain text.

See [markwhen.com](https://markwhen.com), [the documentation](https://docs.markwhen.com), and the [changelog](./CHANGELOG.md).

```js
import { parse } from "@markwhen/parser";

const markwhen = parse(`
title: this is my title
timezone: America/New_York

#neat:
  color: blue
  timezone: -3

2022: event

group My Group #neat
2024: another event

`);

console.log(markwhen);

/*
output:
{
  timelines: [
    {
      events: [Array],
      tags: {},
      ids: {},
      ranges: [Array],
      foldables: {},
      metadata: [Object],
      header: {
        title: "this is my title",
        timezone: "America/New_York"
        // Note that for compatability with the embedded yaml parser 
        // as well as how markwhen uses comments (two slashes),
        // entries in the header that start with a hash `#` will 
        // replace the hash with a right paren `)`
        )neat: {
          color: "blue",
          timezone: -3
        }
      }
    }
  ]
}
*/
```
