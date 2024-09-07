import { DateTime } from "luxon";
import { DateRange, Event, GroupStyle, Range } from "./Types.js";

export type SomeNode = Node<NodeValue>;
export type NodeArray = Array<SomeNode>;
export type NodeValue = NodeArray | Event;
export type GroupRange = (DateRange & { maxFrom: DateTime }) | undefined;

export class Node<T extends NodeValue> {
  constructor(public value: T) {}
}

export class NodeGroup extends Node<NodeArray> {
  tags: string[] = [];
  title: string = "";
  range?: GroupRange;
  startExpanded?: boolean;
  style?: GroupStyle;
  rangeInText?: Range;
  properties: Record<string, any> = {};
}
