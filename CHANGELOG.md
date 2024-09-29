## 0.12.0

Support for properties on events and event groups and restructuring of the parser output.

This is a significant and breaking change. Whereas previously the parser would output `Node`s with `.value`s, now `EventGroup`s have `.children` and those children and either `Event`s or `EventGroup`s directly; there is no intermediate `Node`.

The structure of an `Event` has also changed significantly - it has been flattened with some duplicate fields removed.

## 0.10.8

- export dateRangeToString

## 0.10.5

- additional export

## 0.10.4

- Manually bump version in parse.ts instead of importing package.json

## 0.10.3

- Missed some exports from 0.10.2

## 0.10.2

- Missed some exports from 0.10.1

## 0.10.1

- Missed some exports from 0.10.0

## 0.10.0

- Merge all exports to be from index.js

## 0.9.8

- Fixed bug where some events with times did not have the correct timezone

## 0.9.7

- Add exports to package.json

## 0.9.5

- Return the right version

## 0.9.4

- Fix for two digit numbers being parsed as years

## 0.9.3

- Only prefix lines in descriptions if they would have otherwise been parsed as a date or date range

## 0.9.2

- Rudimentary ical parsing via [`parseICal`](src/index.ts)

## 0.9.1

- Add parser version as part of output

## 0.9.0

- Remove lineFrom & lineTo in ranges

## 0.8.8

- Add support for timezone specification via the header

## 0.7.0

- Remove support for pages

## 0.6.5

- Removed shell command (use `@markwhen/mw` instead)
- Support for folding events in editor

## 0.5.2

- Added shell command for parsing markwhen: `mw {file name}` or `bash bin/index.js {file name}`

## 0.5.1

- Better support for yaml frontmatter

## 0.5.0

- Support for yaml frontmatter

## 0.4.9

- Fix list item content ranges

## 0.4.8

- Add recurrence match to edtf range match too

## 0.4.6

- Add recurrence match to recurrence range content

## 0.4.5

- Add utility function `expand` (src/utilities/recurrence.ts) to expand recurrent events

## 0.4.3

- Add eventText directly to Event and EventDescription (parsed from regex instead of inferred)

## 0.4.1

- Recurrence range bug fixes

## 0.4.0

- Recurrence syntax
  every (number) (durationUnit) (for (number) (durationUnit | 'times') | x(number))?
