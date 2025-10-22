import { Landmark } from "../../types/Landmark";
import { calculateAngle } from "../CalculateAngle";

// [추가] 특정 다리의 랜드마크를 가져오는 헬퍼 함수
const getLegLandmarks = (
  landmarks: Landmark[],
  hipIndex: number,
  kneeIndex: number,
  ankleIndex: number
) => {
  return {
    hip: landmarks[hipIndex],
    knee: landmarks[kneeIndex],
    ankle: landmarks[ankleIndex],
  };
};

/**
 * 런지 핸들러 - 앞선 발 자동 감지 (횟수 측정만)
 * @param landmarks 랜드마크 데이터
 * @param stageRef 'up' | 'down' 상태 참조
 * @param onRepDetected 횟수 증가 콜백
 * @returns void (피드백 반환 없음)
 */
export const handleLunge = (
  landmarks: Landmark[],
  stageRef: React.MutableRefObject<"up" | "down">,
  onRepDetected: () => void
): void => {
  // [수정] 반환 타입 void로 변경
  // --- 1. 양쪽 다리 랜드마크 가져오기 ---
  const leftLeg = getLegLandmarks(landmarks, 23, 25, 27);
  const rightLeg = getLegLandmarks(landmarks, 24, 26, 28);

  // 필수 랜드마크 하나라도 없으면 중단
  if (
    !leftLeg.hip ||
    !leftLeg.knee ||
    !leftLeg.ankle ||
    !rightLeg.hip ||
    !rightLeg.knee ||
    !rightLeg.ankle
  ) {
    return; // [수정] null 대신 void 반환이므로 return;
  }

  // --- 2. 앞선 발 감지 ---
  const isLeftLegForward = leftLeg.ankle.z < rightLeg.ankle.z;
  const frontLeg = isLeftLegForward ? leftLeg : rightLeg;
  const backLeg = isLeftLegForward ? rightLeg : leftLeg;

  // --- 3. 앞/뒤 무릎 각도 계산 ---
  const frontKneeAngle = calculateAngle(
    frontLeg.hip,
    frontLeg.knee,
    frontLeg.ankle
  );
  const backKneeAngle = calculateAngle(
    backLeg.hip,
    backLeg.knee,
    backLeg.ankle
  );

  // --- 4. 횟수 감지 로직 (앞/뒤 각도 기준) ---
  if (frontKneeAngle > 160 && backKneeAngle > 160) {
    // 둘 다 펴졌을 때
    if (stageRef.current === "down") {
      stageRef.current = "up";
    }
  } else if (
    frontKneeAngle < 100 && // 앞 무릎 충분히 굽히고
    backKneeAngle < 120 && // 뒷 무릎도 어느 정도 굽히고 (기준값 예시)
    stageRef.current === "up" // 이전 상태가 'up' 이었을 때
  ) {
    stageRef.current = "down";
    onRepDetected(); // 횟수 증가 신호
  }
};
