import { Landmark } from "../../types/Landmark";
import { calculateAngle } from "../CalculateAngle";

/**
 * 스쿼트 핸들러 - 양쪽 다리 각도 확인 (완화 버전)
 * - UP 임계↓: 160 → 150
 * - DOWN 임계↑: 100 → 115
 * - 약간의 비대칭 허용: ASYM_TOL = 15
 */
export const handleSquat = (
  landmarks: Landmark[],
  stageRef: React.MutableRefObject<"up" | "down">,
  onRepDetected: () => void
): void => {
  // --- 튜닝 파라미터(필요시 숫자만 조정) ---
  const UP_ANGLE = 150; // 서 있을 때 무릎 각도 기준(큼)
  const DOWN_ANGLE = 115; // 앉았을 때 무릎 각도 기준(작음)
  const ASYM_TOL = 15; // 비대칭 허용(한쪽이 덜 내려간 정도 허용치)

  // --- 필수 랜드마크 ---
  const leftHip = landmarks[23];
  const leftKnee = landmarks[25];
  const leftAnkle = landmarks[27];
  const rightHip = landmarks[24];
  const rightKnee = landmarks[26];
  const rightAnkle = landmarks[28];

  if (
    !leftHip ||
    !leftKnee ||
    !leftAnkle ||
    !rightHip ||
    !rightKnee ||
    !rightAnkle
  )
    return;

  // --- 각도 계산 ---
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

  // 조금 더 관대하게 판단: 완전히 '펼 때'와 '앉을 때' 사이에 히스테리시스가 생김
  const bothUp = leftKneeAngle > UP_ANGLE && rightKneeAngle > UP_ANGLE;

  // 둘 다 충분히 낮거나(엄격),
  // 한쪽은 확실히 낮고(<= DOWN), 다른 한쪽은 약간 부족해도 허용(<= DOWN + ASYM_TOL)
  const bothDownStrict =
    leftKneeAngle < DOWN_ANGLE && rightKneeAngle < DOWN_ANGLE;
  const downAsymmetric =
    (leftKneeAngle < DOWN_ANGLE && rightKneeAngle < DOWN_ANGLE + ASYM_TOL) ||
    (rightKneeAngle < DOWN_ANGLE && leftKneeAngle < DOWN_ANGLE + ASYM_TOL);
  const downOk = bothDownStrict || downAsymmetric;

  // --- 카운트 로직 ---
  if (bothUp) {
    if (stageRef.current === "down") {
      stageRef.current = "up";
    }
  } else if (downOk && stageRef.current === "up") {
    stageRef.current = "down";
    onRepDetected();
  }

  // 실시간 피드백 없음
};
