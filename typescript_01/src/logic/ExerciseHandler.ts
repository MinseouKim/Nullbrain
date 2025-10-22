import { handleSquat } from "./exercise/SquatLogic";
import { handlePushup } from "./exercise/PushupLogic";
import { handleLunge } from "./exercise/LungeLogic";

// ✅ 향후 추가되는 운동까지 자동 반영 가능한 구조
export const exerciseHandlers = {
  squat: handleSquat,
  pushup: handlePushup,
  lunge: handleLunge,
} satisfies Record<
  string,
  (landmarks: any, stage: any, onRepDetected: () => void) => void
>;
