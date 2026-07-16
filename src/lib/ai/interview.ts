export const MAX_AI_INTERVIEW_QUESTIONS = 5;

type InterviewMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const genericQuestionWords = new Set([
  "กรุณา",
  "โปรด",
  "ช่วย",
  "ระบุ",
  "แจ้ง",
  "ขอ",
  "ทราบ",
  "คุณ",
  "ปัจจุบัน",
  "หรือไม่",
  "อย่างไร",
  "เท่าไร",
  "เท่าไหร่",
  "อะไร",
  "มี",
  "เป็น",
  "และ",
  "ของ",
  "ที่",
  "ใน",
  "ต่อ",
]);

function normalizedText(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("th-TH")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function meaningfulWords(value: string) {
  const segmenter = new Intl.Segmenter("th", { granularity: "word" });
  return new Set(
    Array.from(segmenter.segment(value))
      .filter((segment) => segment.isWordLike)
      .map((segment) => segment.segment.trim().toLocaleLowerCase("th-TH"))
      .filter((word) => word.length > 1 && !genericQuestionWords.has(word)),
  );
}

function wordOverlap(first: string, second: string) {
  const firstWords = meaningfulWords(first);
  const secondWords = meaningfulWords(second);
  const smallerSize = Math.min(firstWords.size, secondWords.size);
  if (smallerSize < 2) return 0;

  let matches = 0;
  for (const word of firstWords) {
    if (secondWords.has(word)) matches += 1;
  }
  return matches / smallerSize;
}

export function interviewTranscript(messages: InterviewMessage[]) {
  const transcript: Array<{ question: string; answer: string | null }> = [];

  for (const message of messages) {
    if (message.role === "assistant") {
      transcript.push({ question: message.content, answer: null });
    } else if (message.role === "user") {
      const unanswered = transcript.findLast((item) => item.answer === null);
      if (unanswered) unanswered.answer = message.content;
    }
  }

  return transcript;
}

export function isRepeatedInterviewQuestion(candidate: string, askedQuestions: string[]) {
  const normalizedCandidate = normalizedText(candidate);
  if (!normalizedCandidate) return false;

  return askedQuestions.some((question) => {
    const normalizedQuestion = normalizedText(question);
    if (!normalizedQuestion) return false;
    if (normalizedCandidate === normalizedQuestion) return true;

    const shorterLength = Math.min(normalizedCandidate.length, normalizedQuestion.length);
    if (
      shorterLength >= 12
      && (normalizedCandidate.includes(normalizedQuestion) || normalizedQuestion.includes(normalizedCandidate))
    ) {
      return true;
    }

    return wordOverlap(candidate, question) >= 0.75;
  });
}
