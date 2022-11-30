// import { DateTime } from "luxon";
// import { Event, Events, EventGroup } from "./Types";

// export type Sort = "none" | "down" | "up";

// export default function sortEvents(
//   events: Events,
//   sort: Sort
// ) {
//   if (sort === "none") {
//     return events.map((eventOrEventGroup) => {
//       if (eventOrEventGroup instanceof Event) {
//         return eventOrEventGroup;
//       }
//       addRangeToEventGroup(eventOrEventGroup);
//       return eventOrEventGroup;
//     });
//   }

//   const sortingDown = sort === "down";

//   const sortDownDateTime = function(dateTime1: DateTime, dateTime2: DateTime) {
//     return +dateTime1 - +dateTime2;
//   };

//   const sortUpDateTime = function(dateTime1: DateTime, dateTime2: DateTime) {
//     return +dateTime2 - +dateTime1;
//   };

//   const sortDown = function(event1: Event, event2: Event) {
//     return sortDownDateTime(
//       event1.dateRange.fromDateTime,
//       event2.dateRange.fromDateTime
//     );
//   };

//   const sortUp = function(event1: Event, event2: Event) {
//     return sortUpDateTime(
//       event1.dateRange.fromDateTime,
//       event2.dateRange.fromDateTime
//     );
//   };

//   // We need this because sort won't be called if there's only one element in the array
//   if (events.length === 1 && Array.isArray(events[0])) {
//     sortGroup(events[0], sort);
//     addRangeToEventGroup(events[0]);
//   }

//   events.sort((eventOrEvents1, eventOrEvents2) => {
//     const now = DateTime.now();
//     if (eventOrEvents1 instanceof Event) {
//       if (eventOrEvents2 instanceof Event) {
//         return sortingDown
//           ? sortDown(eventOrEvents1, eventOrEvents2)
//           : sortUp(eventOrEvents1, eventOrEvents2);
//       } else {
//         if (!eventOrEvents2.range) {
//           sortGroup(eventOrEvents2, sort);
//           addRangeToEventGroup(eventOrEvents2);
//         }
//         return sortingDown
//           ? sortDownDateTime(
//               eventOrEvents1.dateRange.fromDateTime,
//               eventOrEvents2.range?.min ?? now
//             )
//           : sortUpDateTime(
//               eventOrEvents1.dateRange.fromDateTime,
//               eventOrEvents2.range?.min ?? now
//             );
//       }
//     }

//     // eventOrEvents1 is array of sub events
//     sortGroup(eventOrEvents1, sort);
//     if (!eventOrEvents1.range) {
//       addRangeToEventGroup(eventOrEvents1);
//     }
//     if (eventOrEvents2 instanceof Event) {
//       return sortingDown
//         ? sortDownDateTime(
//             eventOrEvents1.range?.min ?? now,
//             eventOrEvents2.dateRange.fromDateTime
//           )
//         : sortUpDateTime(
//             eventOrEvents1.range?.min ?? now,
//             eventOrEvents2.dateRange.fromDateTime
//           );
//     }

//     sortGroup(eventOrEvents2, sort);
//     if (!eventOrEvents2.range) {
//       addRangeToEventGroup(eventOrEvents2);
//     }
//     return sortingDown
//       ? sortDownDateTime(
//           eventOrEvents1.range?.min ?? now,
//           eventOrEvents2.range?.min ?? now
//         )
//       : sortUpDateTime(
//           eventOrEvents1.range?.min ?? now,
//           eventOrEvents2.range?.min ?? now
//         );
//   });
//   return events
// }

// function addRangeToEventGroup(events: EventGroup) {
//   if (!events || !events.length) {
//     return;
//   }
//   let min: DateTime = events[0].dateRange.fromDateTime,
//     max: DateTime = events[0].dateRange.fromDateTime,
//     latest = events[0].dateRange.toDateTime;
//   for (const e of events) {
//     min = e.dateRange.fromDateTime < min ? e.dateRange.fromDateTime : min;
//     max = e.dateRange.fromDateTime > max ? e.dateRange.fromDateTime : max;
//     latest =
//       e.dateRange.toDateTime > latest ? e.dateRange.toDateTime : latest;
//   }
//   events.range = { min, max, latest };
// }

// function sortGroup(events: EventGroup, sort: Sort) {
//   const sortDown = function(event1: Event, event2: Event) {
//     return +event1.dateRange.fromDateTime - +event2.dateRange.fromDateTime;
//   };
//   const sortUp = function(event1: Event, event2: Event) {
//     return +event2.dateRange.fromDateTime - +event1.dateRange.fromDateTime;
//   };
//   events.sort(sort === "down" ? sortDown : sortUp);
// }
