import { iterate, isEventNode } from "../src/Noder";
import { Timelines, Event } from "../src/Types";

export const firstEvent = (markwhen: Timelines) => nthEvent(markwhen, 0);

export const nthEvent = (markwhen: Timelines, n: number) =>
  nthNode(markwhen, n).value as Event;

const nthNode = (markwhen: Timelines, n: number) => {
  let i = 0;
  for (const { path, node } of iterate(markwhen.timelines[0].events)) {
    if (isEventNode(node)) {
      if (i === n) {
        return node;
      }
      i++;
    }
  }
  throw new Error();
};
