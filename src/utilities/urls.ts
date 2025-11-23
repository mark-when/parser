import { DateTime } from "luxon";
import { Path, Eventy, iter, isEvent, DateTimeIso, Event } from "../Types.js";


export const toArray = (node: Eventy | undefined, cutoff?: DateTime) => {
  if (!node) {
    return [];
  }
  const array = [] as { path: Path; event: Event }[];
  for (const { path, eventy } of iter(node)) {
    if (isEvent(eventy)) {
      if (
        !cutoff ||
        +DateTime.fromISO(eventy.dateRangeIso.fromDateTimeIso) < +cutoff
      ) {
        array.push({ path, event: eventy });
      }
    }
    if (array.length === 10000) {
      return array;
    }
  }
  return array.sort(
    (a, b) =>
      +DateTime.fromISO(b.event.dateRangeIso.fromDateTimeIso) -
      +DateTime.fromISO(a.event.dateRangeIso.fromDateTimeIso)
  );
};

const linkRegex = /(?<preceding>^|\s)\[(?<title>[^\]]*)\]\((?<url>\S+\.\S+)\)/g;
const rawLinkRegex = /https?:\/\/\S+/g;
const disallowedCharacters = /[^A-Za-z0-9_-]/g;
function urlFromString(s: string): string {
  return s
    .trim()
    .replaceAll(linkRegex, (orig, preceding, title) => preceding + title)
    .replaceAll(rawLinkRegex, "")
    .split(" ")
    .slice(0, 4)
    .map((s) => s.replaceAll(disallowedCharacters, ""))
    .filter((s) => !!s)
    .join("-");
}

export function mapUrls(events: { path: Path; event: Event }[]): {
  path: Path;
  event: Event;
  url: string;
}[] {
  const usedUrls = new Set<string>();

  const checkForDuplicates = (url: string): string => {
    if (!usedUrls.has(url)) {
      usedUrls.add(url);
      return url;
    }
    let i = 1;
    let withIndex = `${url}-${i}`;
    while (usedUrls.has(withIndex)) {
      i++;
      withIndex = `${url}-${i}`;
    }
    usedUrls.add(withIndex);
    return withIndex;
  };

  const getUrl = (event: Event, fromDateTimeIso: DateTimeIso): string => {
    if (event.firstLine.rest) {
      const titleFromFirstLine = urlFromString(event.firstLine.rest);
      if (titleFromFirstLine.length) {
        return checkForDuplicates(titleFromFirstLine);
      }
    }

    const { supplemental } = event;
    if (supplemental.length && supplemental[0].type === "text") {
      // @ts-ignore
      const titleFromFirstBlock = urlFromString(supplemental[0].raw as string);
      if (titleFromFirstBlock) {
        return checkForDuplicates(titleFromFirstBlock);
      }
    }

    const date = DateTime.fromISO(fromDateTimeIso).toISODate()!;
    return checkForDuplicates(date);
  };

  return events
    .reverse()
    .map(({ path, event }) => {
      return {
        path,
        event,
        url: getUrl(event, event.dateRangeIso.fromDateTimeIso),
      };
    })
    .reverse();
}
