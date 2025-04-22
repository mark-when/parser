export const basic86 = `title: markwhen
  timezone: America/Los_Angeles

  2025: event
  property: value

  hi`;

export const basic78 = `title: markwhen
timezone: America/Los_Angeles

2025: event
property: value

hi`;

export const grievous324 = `
timezone: +5

#generalGrievous:
  timezone: +0

#t:
  timezone: -5

group #generalGrievous

group #t

2023-05-01: this is an event in asia or something

2023-05-01: this is an event in the  uk timezone
#generalGrievous

endGroup

endGroup

2023-05-01: this is an event in the UK timezone

#generalGrievous

2023-05-01: this`;

export const now10 = `now: event`;

export const grievous256 = `
group #generalGrievous

group #t

2023-05-01: this is an event in asia or something

2023-05-01: this is an event in the  uk timezone
#generalGrievous

endGroup

endGroup

2023-05-01: this is an event in the UK timezone

#generalGrievous

2023-05-01: this`;

export const basic = `
key: value

2025 - 2026: hello
2026 / 2027: darkness
March 2 2028: my old friend

`;

export const recurrence1 = `2022-08-07 every 12 months x30: event title`;
export const recurrence2 = `2025-02-06 every day until 2025-02-28: Event`;
export const recurrence3 = "2025-04-07 every day until 2025-05-01: event";
export const recurrence4 = "2025-04-07 every day | 2025-05-01: event";
export const recurrence5 = "2025-04-07 every day | now: event";
export const recurrence6 = `2025-02-06 every day until 2025-01-28: Event`;
export const recurrence7 = `february 2 1989 every 3 days for 3 days: event title`;
export const recurrence8 = `09/09/1999 every 3 months x29: event title`;
export const recurrence9 = `Dec 19 every 12 week days for 9 times: event title`;
export const recurrence10 = `2019-01-01 every 12 week days for 9 times: event title`;
export const recurrence11 = `2019-01-01 / 2022-08-07 every 12 week days for 9 times: event title`;
export const recurrence12 = `2019-01-01/2022-08-07 every 12 week days for 9 times: event title`;
export const recurrence13 = `2019-01-01 / 2022-08-07 every 3 days for 3 days: event title`;
export const recurrence14 = `2019-01-01/now every 4 months x50: event title`;
export const recurrence15 = `2019-01-01/now every other year: event title`;
export const recurrence16 = `2025-04-04 / now every day til 2025-12-12: `;
export const recurrence17 = `2025-04-04 every other week until 2025-12-12: `;
export const recurrence18 = `2025-04-04 every other day | now: `;
export const recurrence19 = `2019-01-01/now every other year: event title`;

export const relativeToStart1 = `2025 / 5 months: event title`;
export const relativeToPrevious1 = `5 months: event title`;
export const relativeToPreviousAndStart = `5 months / 5 months: event title`;
export const relativeToId = `Dec 7 1941: date
id: pearlHarbor

after !pearlHarbor / 100 years: anniversary
`;

export const eventText1 = `2019-01-01/now :  e v e n t   t i t l e  `;
export const eventText2 = `dec 2 1989 - now :  e v e n t   t i t l e  `;

export const eventsWithTz = `
group West Coast
tz: +6

2025-09-14: Date
tz: America/New_York

2025-09-14: dksla
timezone: +9

2025-09-14: ok
endGroup

group East Coast
timezone: America/Seattle

2025-06-13 / 5 months: ok
tz: Europe/London

5 months / 5 days: nice
timezone: Europe/Amsterdam

endGroup
`;

export const all = {
  eventsWithTz,
  basic86,
  basic78,
  grievous324,
  now10,
  grievous256,
  basic,
  recurrence1,
  recurrence2,
  recurrence3,
  recurrence4,
  recurrence5,
  recurrence6,
  recurrence7,
  recurrence8,
  recurrence9,
  recurrence10,
  recurrence11,
  recurrence12,
  recurrence13,
  recurrence14,
  recurrence15,
  recurrence16,
  recurrence17,
  recurrence18,
  recurrence19,
  eventText1,
  eventText2,
  relativeToStart1,
  relativeToPrevious1,
  relativeToPreviousAndStart,
  relativeToId,
};
