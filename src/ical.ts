import { DateTime } from "luxon";
import { mapUrls, toArraySorted } from ".";
import { Block, Event, Image, ParseResult, toDateRange } from "./Types";

function formatDate(date: DateTime): string {
  return (
    date.setZone("utc").toISO()!.replaceAll(/[-:]/g, "").split(".")[0] + "Z"
  );
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function foldLine(line: string): string {
  if (line.length <= 75) {
    return line;
  }

  const result = [];
  let start = 0;

  // First line can be 75 characters
  result.push(line.substring(start, 75));
  start = 75;

  // Subsequent lines are indented with a space, so 74 characters max
  while (start < line.length) {
    result.push(" " + line.substring(start, start + 74));
    start += 74;
  }

  return result.join("\n");
}

export function eventToIcal({
  event,
  url,
}: {
  event: Event;
  url: string;
}): string {
  const summary = escapeText(event.firstLine.restTrimmed);
  const description = escapeText(
    event.supplemental
      ?.map((s) => {
        if (s instanceof Block) {
          return s.raw;
        }
        if (s instanceof Image) {
          return s.link;
        }
        return s;
      })
      .join("\n") || ""
  );
  const dtStamp = formatDate(DateTime.now());

  const dr = toDateRange(event.dateRangeIso);

  // Check if it's an all-day event (no time specified)
  const isAllDay =
    !dr.fromDateTime.hour &&
    !dr.fromDateTime.minute &&
    !dr.fromDateTime.second &&
    !dr.toDateTime.hour &&
    !dr.toDateTime.minute &&
    !dr.toDateTime.second;

  let dateTimeFields;
  if (isAllDay) {
    dateTimeFields = `DTSTART;VALUE=DATE:${formatDate(dr.fromDateTime)}
DTEND;VALUE=DATE:${formatDate(dr.toDateTime)}`;
  } else {
    dateTimeFields = `DTSTART:${formatDate(dr.fromDateTime)}
DTEND:${formatDate(dr.toDateTime)}`;
  }

  return `BEGIN:VEVENT
UID:${url}
DTSTAMP:${dtStamp}
${dateTimeFields}
${foldLine(`SUMMARY:${summary}`)}
${foldLine(`DESCRIPTION:${description}`)}
END:VEVENT`;
}

export function toICal(
  mw: ParseResult,
  options?: {
    name?: string;
  }
): string {
  const asArray = toArraySorted(mw.events);
  const events = mapUrls(asArray);
  const body = events.map(eventToIcal).join("\n");
  const pre = `BEGIN:VCALENDAR
PRODID:-//Markwhen//Version 1.0//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  const post = `
END:VCALENDAR`;

  return (
    pre +
    (options?.name
      ? `NAME:${options.name}
`
      : "") +
    body +
    post
  );
}
