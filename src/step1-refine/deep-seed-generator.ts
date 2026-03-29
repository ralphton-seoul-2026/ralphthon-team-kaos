// ── Step 1: Deep Mode — AI-Powered Seed Generator via Claude CLI ──

import type { Seed } from '../core/types.js';
import { generateSeed } from './local-seed-generator.js';

const SYSTEM_PROMPT = `당신은 AI 에이전트 실행 전 환경 검증을 위한 분석가입니다.
사용자의 작업 설명을 분석하여 다음 JSON 형식으로 응답하세요. JSON만 출력하세요.

{
  "task_summary": "작업 요약 (한국어, 1-2문장)",
  "ambiguity_score": 0.0~1.0 (모호할수록 높음),
  "external_services": [
    {
      "name": "서비스명",
      "auth_type": "인증 방식",
      "operations": ["작업 유형"],
      "rate_limit_concern": true/false,
      "estimated_calls": 예상 호출 수
    }
  ],
  "local_dependencies": ["필요한 로컬 의존성"],
  "estimated_duration": "예상 소요시간",
  "failure_impact": ["실패 시 영향"],
  "environment_assumptions": ["환경 가정"]
}

암묵적으로 필요한 서비스도 추론하세요:
- "크롬에서 구글에서 수집" → Selenium/Playwright + Google 검색 API 또는 웹 크롤링
- "시간 단위로 업데이트" → 크론잡 또는 스케줄러, 서버 필요
- "웹사이트를 만들고 싶어" → 웹 프레임워크(Next.js, React 등), 호스팅(Vercel 등)
- "데이터 저장" → 데이터베이스 필요`;

export async function generateDeepSeed(prompt: string): Promise<Seed> {
  // 1. Check if claude CLI exists
  const { execa } = await import('execa');

  let claudeAvailable = false;
  try {
    const whichResult = await execa('which', ['claude'], { reject: false });
    claudeAvailable = whichResult.exitCode === 0 && whichResult.stdout.trim().length > 0;
  } catch {
    claudeAvailable = false;
  }

  if (!claudeAvailable) {
    console.error('Deep Mode 사용 불가, Quick Mode로 전환');
    return generateSeed(prompt);
  }

  // 2. Call claude CLI
  try {
    const result = await execa('claude', ['-p', '--output-format', 'text', '--system-prompt', SYSTEM_PROMPT, prompt], {
      timeout: 120000,
      reject: false,
    });

    if (result.exitCode !== 0 || !result.stdout.trim()) {
      console.error('Deep Mode 사용 불가, Quick Mode로 전환');
      return generateSeed(prompt);
    }

    // 3. Parse JSON response
    const rawOutput = result.stdout.trim();
    // Extract JSON from possible markdown code blocks
    const jsonMatch = rawOutput.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawOutput];
    const jsonStr = jsonMatch[1]?.trim() ?? rawOutput;

    const parsed = JSON.parse(jsonStr) as Seed;

    // Validate required fields
    if (
      typeof parsed.task_summary !== 'string' ||
      typeof parsed.ambiguity_score !== 'number' ||
      !Array.isArray(parsed.external_services) ||
      !Array.isArray(parsed.local_dependencies) ||
      typeof parsed.estimated_duration !== 'string' ||
      !Array.isArray(parsed.failure_impact) ||
      !Array.isArray(parsed.environment_assumptions)
    ) {
      console.error('Deep Mode 사용 불가, Quick Mode로 전환');
      return generateSeed(prompt);
    }

    return parsed;
  } catch {
    console.error('Deep Mode 사용 불가, Quick Mode로 전환');
    return generateSeed(prompt);
  }
}
