import {
  EDTF_START_REGEX,
  EVENT_START_REGEX,
  edtf_recurrenceMatchIndex,
  recurrence_recurrenceMatchIndex,
  edtfEventTextMatchIndex,
  eventTextMatchIndex,
} from "../src/regex";
import {
  eventText1,
  eventText2,
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
  recurrence7,
  recurrence8,
  recurrence9,
} from "./testStrings";

describe("regex indices", () => {
  test("recurrence indices 1", () => {
    const matches = recurrence7.match(EVENT_START_REGEX);
    expect(matches).toBeTruthy();
    expect(matches![recurrence_recurrenceMatchIndex]).toBe(
      " every 3 days for 3 days"
    );
  });

  test("recurrence indices 2", () => {
    const matches = recurrence8.match(EVENT_START_REGEX);
    expect(matches).toBeTruthy();
    expect(matches![recurrence_recurrenceMatchIndex]).toBe(
      " every 3 months x29"
    );
  });

  test("recurrence indices 3", () => {
    const matches = recurrence9.match(EVENT_START_REGEX);
    expect(matches).toBeTruthy();
    expect(matches![recurrence_recurrenceMatchIndex]).toBe(
      " every 12 week days for 9 times"
    );
  });

  test("edtf recurrence indices 1", () => {
    const matches = recurrence10.match(EDTF_START_REGEX);

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(
      " every 12 week days for 9 times"
    );
  });

  test("edtf recurrence indices 2", () => {
    const matches = recurrence11.match(EDTF_START_REGEX);

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(
      " every 12 week days for 9 times"
    );
  });

  test("edtf recurrence indices 3", () => {
    const matches = recurrence12.match(EDTF_START_REGEX);

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(
      " every 12 week days for 9 times"
    );
  });

  test("edtf recurrence indices 4", () => {
    const matches = recurrence13.match(EDTF_START_REGEX);

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(
      " every 3 days for 3 days"
    );
  });

  test("edtf recurrence indices 5", () => {
    const matches = recurrence14.match(EDTF_START_REGEX);

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(" every 4 months x50");
  });

  test("edtf recurrence indices 6", () => {
    const matches = recurrence15.match(EDTF_START_REGEX);

    expect(matches).toBeTruthy();
    expect(matches![edtf_recurrenceMatchIndex]).toBe(" every other year");
  });

  test("edtf recurrence until 1", () => {
    const matches = recurrence16.match(EDTF_START_REGEX);
    expect(matches).toBeTruthy();
  });

  test("edtf recurrence until 2", () => {
    const matches = recurrence17.match(EDTF_START_REGEX);
    expect(matches).toBeTruthy();
  });

  test("edtf recurrence until 3", () => {
    const matches = recurrence18.match(EDTF_START_REGEX);
    expect(matches).toBeTruthy();
  });

  test("event text after date definition", () => {
    const matches = recurrence19.match(EDTF_START_REGEX);

    expect(matches).toBeTruthy();
    expect(matches![edtfEventTextMatchIndex]).toBe(" event title");
  });

  test("event text after date definition", () => {
    const matches = eventText1.match(EDTF_START_REGEX);

    expect(matches).toBeTruthy();
    expect(matches![edtfEventTextMatchIndex]).toBe("  e v e n t   t i t l e  ");
  });

  test("event text after date definition", () => {
    const matches = eventText2.match(
      EVENT_START_REGEX
    );

    expect(matches).toBeTruthy();
    expect(matches![eventTextMatchIndex]).toBe("  e v e n t   t i t l e  ");
  });
});
