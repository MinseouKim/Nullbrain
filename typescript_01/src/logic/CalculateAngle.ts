import { Landmark } from "../types/Landmark";

export const calculateAngle = (
  a: Landmark,
  b: Landmark,
  c: Landmark
): number => {
  const rad =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((rad * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
};
