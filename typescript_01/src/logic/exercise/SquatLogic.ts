import { Landmark } from "../../types/Landmark";
import { calculateAngle } from "../CalculateAngle";

// Adaptive squat counter (상대적 움직임 + 방향 감지 기반)
export function handleSquat(
  landmarks: Landmark[],
  stage: React.MutableRefObject<"up" | "down">,
  setRepCount: React.Dispatch<React.SetStateAction<number>>,
  stateRef: React.MutableRefObject<{
    isWorkoutPaused: boolean;
    targetReps: number;
  }>,
  onSetComplete: (data: {
    exerciseName: "squat";
    landmarkHistory: Landmark[][];
    repCount: number;
  }) => void,
  landmarkHistory: React.MutableRefObject<Landmark[][]>
) {
  // 주요 관절 (왼쪽 기준)
  const hip = landmarks[23];
  const knee = landmarks[25];
  const ankle = landmarks[27];
  if (!hip || !knee || !ankle) return;

  const angle = calculateAngle(hip, knee, ankle);

  // 이전 각도 및 방향 추적용 static ref
  if (!(handleSquat as any).lastAngle) (handleSquat as any).lastAngle = angle;
  if (!(handleSquat as any).direction) (handleSquat as any).direction = "up";
  if (!(handleSquat as any).motionScore) (handleSquat as any).motionScore = 0;

  const lastAngle = (handleSquat as any).lastAngle;
  const direction = (handleSquat as any).direction;
  let motionScore = (handleSquat as any).motionScore;

  // 1. 각도 변화량 계산
  const delta = angle - lastAngle;

  // 2. 방향 판별 (down → up)
  // down: 무릎 각도가 줄어드는 방향, up: 늘어나는 방향
  if (delta < -1.5) {
    (handleSquat as any).direction = "down";
    motionScore += Math.abs(delta);
  } else if (delta > 1.5 && direction === "down") {
    // 올라오기 시작한 시점 → 1회 완료
    if (motionScore > 25) {
      // 변화폭이 충분했을 때만 인정 (깊이 무관)
      setRepCount((prev) => {
        const newRep = prev + 1;
        console.log(`[AITrainer] ✅ Adaptive Squat Detected! (${newRep})`);

        if (newRep >= stateRef.current.targetReps) {
          onSetComplete({
            exerciseName: "squat",
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
    (handleSquat as any).direction = "up";
  }

  // 3. 상태 저장
  (handleSquat as any).lastAngle = angle;
  (handleSquat as any).motionScore = motionScore;
}
