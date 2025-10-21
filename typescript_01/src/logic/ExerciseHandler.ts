import { handleSquat } from "./exercise/SquatLogic";
import { handlePushup } from "./exercise/PushupLogic";
// 앞으로 다른 운동이 생기면 여기에만 추가
// import { handlePlank } from "./exercise/plankLogic";

export const exerciseHandlers = {
  squat: handleSquat,
  pushup: handlePushup,
  // plank: handlePlank,
} as const;
