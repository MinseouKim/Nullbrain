import levenshtein from "js-levenshtein";

/**
 * 사용자 입력(한글/영문/혼합)을 AI 로직용 영문 키로 변환
 * ex) "스쿼트" → "squat", "푸쉬업" → "pushup"
 */
export const exerciseNameMap: Record<string, string> = {
  squat: "squat",
  스쿼트: "squat",
  squart: "squat",

  pushup: "pushup",
  푸쉬업: "pushup",
  푸시업: "pushup",
  팔굽혀펴기: "pushup",

  plank: "plank",
  플랭크: "plank",
  플랭: "plank",

  lunge: "lunge",
  런지: "lunge",

  deadlift: "deadlift",
  데드리프트: "deadlift",
  데드: "deadlift",
  dedlift: "deadlift",

  benchpress: "benchpress",
  벤치프레스: "benchpress",
  벤치: "benchpress",

  pullup: "pullup",
  풀업: "pullup",

  shoulderpress: "shoulderpress",
  숄더프레스: "shoulderpress",
  어깨프레스: "shoulderpress",
};

/**
 * ✅ 오타 허용 및 유사 단어 매칭
 * @param name 사용자 입력 운동명 (한글 or 영어)
 * @returns 내부 로직용 영문 키 (기본값: "squat")
 */
export function exerciseForAI(name: string): string {
  if (!name) return "squat";
  const lower = name.trim().toLowerCase();

  // 완전 일치 시 바로 반환
  if (exerciseNameMap[lower]) return exerciseNameMap[lower];

  // 부분 일치 시 탐색
  const partialMatch = Object.keys(exerciseNameMap).find((key) =>
    lower.includes(key)
  );
  if (partialMatch) return exerciseNameMap[partialMatch];

  // 🔹 Levenshtein 거리 기반 오타 교정 (가장 가까운 후보 선택)
  const threshold = 2; // 2~3자 이내 오타는 허용
  let bestMatch = "squat";
  let minDistance = Infinity;

  for (const key of Object.keys(exerciseNameMap)) {
    const distance = levenshtein(lower, key);
    if (distance < minDistance && distance <= threshold) {
      minDistance = distance;
      bestMatch = key;
    }
  }

  return exerciseNameMap[bestMatch] || "squat";
}
