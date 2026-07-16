import assert from "node:assert/strict";
import test from "node:test";
import {
  interviewTranscript,
  isRepeatedInterviewQuestion,
  MAX_AI_INTERVIEW_QUESTIONS,
} from "../../src/lib/ai/interview.ts";

test("AI interview is capped at five questions", () => {
  assert.equal(MAX_AI_INTERVIEW_QUESTIONS, 5);
});

test("interview transcript preserves question and answer pairs", () => {
  assert.deepEqual(
    interviewTranscript([
      { role: "assistant", content: "รายได้ต่อเดือนเท่าไร" },
      { role: "user", content: "25,000 บาท" },
      { role: "assistant", content: "มีค่าใช้จ่ายจำเป็นเดือนละเท่าไร" },
    ]),
    [
      { question: "รายได้ต่อเดือนเท่าไร", answer: "25,000 บาท" },
      { question: "มีค่าใช้จ่ายจำเป็นเดือนละเท่าไร", answer: null },
    ],
  );
});

test("interview transcript keeps the latest unanswered question visible", () => {
  const transcript = interviewTranscript([
    { role: "assistant", content: "รายได้ต่อเดือนเท่าไร" },
    { role: "user", content: "25,000 บาท" },
    { role: "assistant", content: "มีค่าใช้จ่ายจำเป็นเดือนละเท่าไร" },
  ]);

  assert.equal(transcript.at(-1)?.answer, null);
  assert.equal(transcript.length < MAX_AI_INTERVIEW_QUESTIONS, true);
});

test("repeated interview questions are rejected even when phrased differently", () => {
  const asked = ["รายได้ต่อเดือนของคุณเท่าไร"];

  assert.equal(isRepeatedInterviewQuestion("รายได้ต่อเดือนของคุณเท่าไร?", asked), true);
  assert.equal(isRepeatedInterviewQuestion("กรุณาระบุรายได้ต่อเดือนปัจจุบันของคุณ", asked), true);
  assert.equal(isRepeatedInterviewQuestion("มีค่าใช้จ่ายจำเป็นต่อเดือนเท่าไร", asked), false);
});
