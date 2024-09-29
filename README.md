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
```
