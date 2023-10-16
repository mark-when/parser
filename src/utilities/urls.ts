import { DateTime } from "luxon";
import { SomeNode, Node } from "../Node";
import { walk, isEventNode } from "../Noder";
import { Path, EventDescription, DateTimeIso, Event } from "../Types";

const disallowedCharacters = /[^A-Za-z0-9_-]/g;

export const toArray = (node: SomeNode | undefined, cutoff: DateTime) => {
  if (!node) {
    return [];
  }
  const array = [] as { path: Path; node: Node<Event> }[];
  walk(node, [], (n, path) => {
    if (n && isEventNode(n)) {
      if (+DateTime.fromISO(n.value.dateRangeIso.fromDateTimeIso) < +cutoff) {
        array.push({ path, node: n });
      }
    }
    if (array.length === 1000) {
      return true;
    }
  });
  return array.sort(
    (a, b) =>
      +DateTime.fromISO(b.node.value.dateRangeIso.fromDateTimeIso) -
      +DateTime.fromISO(a.node.value.dateRangeIso.fromDateTimeIso)
  );
};

export function mapUrls(events: { path: Path; node: Node<Event> }[]): {
  path: Path;
  node: Node<Event>;
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

  const linkRegex =
    /(?<preceding>^|\s)\[(?<title>[^\]]*)\]\((?<url>\S+\.\S+)\)/g;

  const getUrl = (
    eventDescription: EventDescription,
    fromDateTimeIso: DateTimeIso
  ): string => {
    if (eventDescription.eventDescription) {
      const titleFromFirstLine = eventDescription.eventDescription
        .trim()
        .replaceAll(linkRegex, (orig, preceding, title) => title)
        .split(" ")
        .slice(0, 4)
        .map((s) => s.replaceAll(disallowedCharacters, ""))
        .filter((s) => !!s)
        .join("-");

      if (titleFromFirstLine.length) {
        return checkForDuplicates(titleFromFirstLine);
      }
    }

    const { supplemental } = eventDescription;
    if (supplemental.length && supplemental[0].type === "text") {
      // @ts-ignore
      const titleFromFirstBlock = (supplemental[0].raw as string)
        .trim()
        .split(" ")
        .slice(0, 4)
        .map((s) => s.replaceAll(disallowedCharacters, ""))
        .filter((s) => !!s)
        .join("-");
      if (titleFromFirstBlock) {
        return checkForDuplicates(titleFromFirstBlock);
      }
    }

    const date = DateTime.fromISO(fromDateTimeIso).toISODate();
    return checkForDuplicates(date);
  };

  return events
    .reverse()
    .map(({ path, node }) => {
      return {
        path,
        node,
        url: getUrl(
          node.value.eventDescription,
          node.value.dateRangeIso.fromDateTimeIso
        ),
      };
    })
    .reverse();
}
