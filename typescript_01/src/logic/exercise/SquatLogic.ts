import { Landmark } from "../../types/Landmark";
import { calculateAngle } from "../CalculateAngle";

/**
 * 스쿼트 핸들러는 이제 "카운트를 직접 올리지 않고"
 * onRepDetected() 신호만 보냅니다.
 */
export const handleSquat = (
  landmarks: Landmark[],
  stage: React.MutableRefObject<"up" | "down">,
  onRepDetected: () => void
) => {
  const leftHip = landmarks[23];
  const leftKnee = landmarks[25];
  const leftAnkle = landmarks[27];
  if (!leftHip || !leftKnee || !leftAnkle) return;

  const angle = calculateAngle(leftHip, leftKnee, leftAnkle);

  if (angle > 160) stage.current = "up";

  if (angle < 100 && stage.current === "up") {
    stage.current = "down";
    onRepDetected(); // ✅ 여기서만 신호
  }
};
