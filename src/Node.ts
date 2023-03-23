import { DateTime } from "luxon";
import { DateRange, Event, GroupStyle, Path, Range } from "./Types.js";

export type SomeNode = Node<NodeValue>;
export type NodeArray = Array<SomeNode>;
export type NodeValue = NodeArray | Event;
export type GroupRange = (DateRange & { maxFrom: DateTime }) | undefined;

export class Node<T extends NodeValue> {
  constructor(value: T) {
    this.value = value;
  }

  value: T;

  tags?: string[];
  title?: string;
  range?: GroupRange;
  startExpanded?: boolean;
  style?: GroupStyle;
  rangeInText?: Range;
}
