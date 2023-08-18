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
