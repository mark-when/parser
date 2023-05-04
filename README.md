# Markwhen parser

Parse markwhen documents. Outputs a list of events given plain text.

See [markwhen.com](https://markwhen.com) and [the documentation](https://docs.markwhen.com).

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
      metadata: [Object]
    },
    {
      events: [Array],
      tags: {},
      ids: {},
      ranges: [Array],
      foldables: {},
      metadata: [Object]
    }
  ]
}
*/
```
