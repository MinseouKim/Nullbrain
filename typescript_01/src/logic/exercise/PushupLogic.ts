import { Landmark } from "../../types/Landmark";
import { calculateAngle } from "../CalculateAngle";

/**
 * 푸쉬업 핸들러 - 양쪽 팔꿈치 각도 확인
 * @param landmarks 랜드마크 데이터
 * @param stageRef 'up' | 'down' 상태 참조
 * @param onRepDetected 횟수 증가 콜백
 */
export const handlePushup = (
  landmarks: Landmark[],
  stageRef: React.MutableRefObject<"up" | "down">,
  onRepDetected: () => void
): void => {
  // 반환 타입 void (실시간 피드백 없음)
  // --- 1. 양쪽 팔 랜드마크 가져오기 ---
  const lShoulder = landmarks[11];
  const lElbow = landmarks[13];
  const lWrist = landmarks[15];
  const rShoulder = landmarks[12];
  const rElbow = landmarks[14];
  const rWrist = landmarks[16];

  // 필수 랜드마크 하나라도 없으면 중단
  if (!lShoulder || !lElbow || !lWrist || !rShoulder || !rElbow || !rWrist) {
    return;
  }

  // --- 2. 양쪽 팔꿈치 각도 계산 ---
  const leftElbowAngle = calculateAngle(lShoulder, lElbow, lWrist);
  const rightElbowAngle = calculateAngle(rShoulder, rElbow, rWrist);

  // --- 3. 횟수 감지 로직 (양쪽 각도 기준) ---
  // [수정] 양쪽 팔꿈치 각도가 모두 160도 이상일 때 'up'
  if (leftElbowAngle > 160 && rightElbowAngle > 160) {
    if (stageRef.current === "down") {
      stageRef.current = "up";
    }
  }
  // [수정] 양쪽 팔꿈치 각도가 모두 90도 미만이고, 이전 상태가 'up'일 때 카운트
  else if (
    leftElbowAngle < 90 &&
    rightElbowAngle < 90 &&
    stageRef.current === "up"
  ) {
    stageRef.current = "down";
    onRepDetected(); // 횟수 증가 신호
  }

  // 실시간 피드백 로직은 없음
};
