import { Landmark } from "../../types/Landmark";
import { calculateAngle } from "../CalculateAngle";

/**
 * 스쿼트 핸들러 - 양쪽 다리 각도 확인
 * @param landmarks 랜드마크 데이터
 * @param stageRef 'up' | 'down' 상태 참조
 * @param onRepDetected 횟수 증가 콜백
 */
export const handleSquat = (
  landmarks: Landmark[],
  stageRef: React.MutableRefObject<"up" | "down">,
  onRepDetected: () => void
): void => {
  // 반환 타입 void (실시간 피드백 없음)
  // --- 1. 양쪽 다리 랜드마크 가져오기 ---
  const leftHip = landmarks[23];
  const leftKnee = landmarks[25];
  const leftAnkle = landmarks[27];
  const rightHip = landmarks[24];
  const rightKnee = landmarks[26];
  const rightAnkle = landmarks[28];

  // 필수 랜드마크 하나라도 없으면 중단
  if (
    !leftHip ||
    !leftKnee ||
    !leftAnkle ||
    !rightHip ||
    !rightKnee ||
    !rightAnkle
  ) {
    return;
  }

  // --- 2. 양쪽 무릎 각도 계산 ---
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

  // --- 3. 횟수 감지 로직 (양쪽 각도 기준) ---
  // [수정] 양쪽 무릎 각도가 모두 160도 이상일 때 'up'
  if (leftKneeAngle > 160 && rightKneeAngle > 160) {
    if (stageRef.current === "down") {
      stageRef.current = "up";
    }
  }
  // [수정] 양쪽 무릎 각도가 모두 100도 미만이고, 이전 상태가 'up'일 때 카운트
  else if (
    leftKneeAngle < 100 &&
    rightKneeAngle < 100 &&
    stageRef.current === "up"
  ) {
    stageRef.current = "down";
    onRepDetected(); // 횟수 증가 신호
  }

  // 실시간 피드백 로직은 없음
};
