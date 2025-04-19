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
