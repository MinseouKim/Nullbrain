import { Landmark } from "../../types/Landmark";
import { calculateAngle } from "../CalculateAngle";

// ✅ Adaptive push-up counter (상대적 움직임 + 방향 감지 기반)
export function handlePushup(
  landmarks: Landmark[],
  stage: React.MutableRefObject<"up" | "down">,
  setRepCount: React.Dispatch<React.SetStateAction<number>>,
  stateRef: React.MutableRefObject<{
    isWorkoutPaused: boolean;
    targetReps: number;
  }>,
  onSetComplete: (data: {
    exerciseName: "pushup";
    landmarkHistory: Landmark[][];
    repCount: number;
  }) => void,
  landmarkHistory: React.MutableRefObject<Landmark[][]>
) {
  // 주요 관절 (오른팔 기준)
  const shoulder = landmarks[12];
  const elbow = landmarks[14];
  const wrist = landmarks[16];
  if (!shoulder || !elbow || !wrist) return;

  const angle = calculateAngle(shoulder, elbow, wrist);

  // 내부 상태 추적용 static 변수
  if (!(handlePushup as any).lastAngle) (handlePushup as any).lastAngle = angle;
  if (!(handlePushup as any).direction) (handlePushup as any).direction = "up";
  if (!(handlePushup as any).motionScore) (handlePushup as any).motionScore = 0;

  const lastAngle = (handlePushup as any).lastAngle;
  const direction = (handlePushup as any).direction;
  let motionScore = (handlePushup as any).motionScore;

  // ✅ 1. 각도 변화량 계산
  const delta = angle - lastAngle;

  // ✅ 2. 내려가기 / 올라오기 판별
  // down: 팔꿈치 각도 줄어드는 방향
  if (delta < -1.5) {
    (handlePushup as any).direction = "down";
    motionScore += Math.abs(delta);
  } else if (delta > 1.5 && direction === "down") {
    // 올라오기 시작 → 1회 완료
    if (motionScore > 25) {
      // 팔의 움직임이 충분했을 때만 카운트
      setRepCount((prev) => {
        const newRep = prev + 1;
        console.log(`[AITrainer] ✅ Adaptive Push-up Detected! (${newRep})`);

        if (newRep >= stateRef.current.targetReps) {
          onSetComplete({
            exerciseName: "pushup",
            landmarkHistory: landmarkHistory.current,
            repCount: stateRef.current.targetReps,
          });
          landmarkHistory.current = [];
          return 0;
        }
        return newRep;
      });
    }

    motionScore = 0;
    (handlePushup as any).direction = "up";
  }

  // ✅ 3. 상태 업데이트
  (handlePushup as any).lastAngle = angle;
  (handlePushup as any).motionScore = motionScore;
}
