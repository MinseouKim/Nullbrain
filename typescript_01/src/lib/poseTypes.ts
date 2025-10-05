// src/lib/poseTypes.ts
export interface KP extends Array<any> {
  [index: number]: {
    x: number;
    y: number;
    visibility?: number;
  };
  x?: number;
  y?: number;
  confidence?: number;
}

export interface Size {
  width: number;
  height: number;
  w: number;
  h: number;
}

export interface PoseResult {
  keypoints: KP[];
  score?: number;
}

export interface PoseEstimationResult {
  poses: PoseResult[];
}
