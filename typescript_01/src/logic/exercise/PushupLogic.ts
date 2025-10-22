import { Landmark } from "../../types/Landmark";
import { calculateAngle } from "../CalculateAngle";

export const handlePushup = (
  landmarks: Landmark[],
  stage: React.MutableRefObject<"up" | "down">,
  onRepDetected: () => void
) => {
  // 예시: 팔꿈치 각도로 푸시업 트리거
  const rShoulder = landmarks[12];
  const rElbow = landmarks[14];
  const rWrist = landmarks[16];
  if (!rShoulder || !rElbow || !rWrist) return;

  const angle = calculateAngle(rShoulder, rElbow, rWrist);

  if (angle > 160) stage.current = "up";
  if (angle < 90 && stage.current === "up") {
    stage.current = "down";
    onRepDetected(); // ✅ 신호만
  }
};
