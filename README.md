# Markwhen parser

Parse markwhen documents. Outputs a list of events given plain text.

See [markwhen.com](https://markwhen.com).

```js
import { parse } from "@markwhen/parser";

const markwhen = parse(`
title: this is my title

2022: event

_-_-_break_-_-_

title: page 2

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

# Expect breaking changes
Markwhen is a work in progress and things are likely to change.