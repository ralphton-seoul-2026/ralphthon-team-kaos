// ── Deep Mode: Socratic Questions for Ouroboros ──

export const SOCRATIC_QUESTIONS = [
  '이 작업에서 외부 서비스는 무엇이 필요한가?',
  '각 서비스에 어떤 인증이 필요한가?',
  '작업 중간에 실패하면 어떤 데이터가 유실되는가?',
  '이 작업의 예상 소요시간은?',
  '어떤 로컬 도구가 필요한가?',
];

export const DEEP_MODE_CONFIG = {
  maxRounds: 3,
  ambiguityThreshold: 0.2,
  timeoutMs: 180_000, // 3 minutes
};
