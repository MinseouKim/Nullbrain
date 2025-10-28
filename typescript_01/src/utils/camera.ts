/** 브라우저/권한/장치 에러를 사용자 친화적으로 매핑 */
export const getCameraErrorMessage = (e: unknown): string => {
  const err = e as { name?: string; message?: string };

  const isLocalhost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

  // 보안(HTTPS) 체크는 환경 검사 단계에서 먼저 하므로 여기선 예비로만 남겨둠
  if (
    typeof window !== "undefined" &&
    window.location.protocol !== "https:" &&
    !isLocalhost
  ) {
    return "카메라는 HTTPS 또는 localhost 환경에서만 동작합니다. 주소창의 보안(https) 여부를 확인해주세요.";
  }

  const name = err?.name;

  if (name === "NotAllowedError" || name === "SecurityError") {
    return "카메라 권한이 차단되었습니다. 브라우저의 사이트 권한 설정에서 ‘허용’으로 바꿔주세요.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "사용 가능한 카메라 장치를 찾지 못했습니다.";
  }
  if (name === "NotReadableError") {
    return "다른 앱이 카메라를 사용 중입니다.";
  }
  if (name === "AbortError") {
    return "카메라 초기화가 중단되었습니다. 다시 시도해주세요.";
  }
  if (name === "InsecureContext") {
    return "HTTPS가 아닌 환경에서는 카메라를 켤 수 없습니다. https:// 또는 localhost에서 실행해주세요.";
  }
  if (name === "MediaDevicesUnsupported") {
    return "이 브라우저는 카메라 사용에 필요한 기능을 지원하지 않습니다.";
  }
  if (name === "PermissionPromptBlocked") {
    return "브라우저에서 권한 팝업이 차단된 것 같습니다. 팝업/권한 요청을 허용해주세요.";
  }

  return "카메라 초기화에 실패했습니다. 권한/장치 상태를 확인해주세요.";
};

/** HTTPS 또는 localhost 여부 */
const isHttpsOrLocalhost = (): boolean => {
  if (typeof window === "undefined") return false;
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(
    window.location.hostname
  );
  return window.location.protocol === "https:" || isLocalhost;
};

/** 비디오 입력 장치 존재 여부 */
const hasVideoInput = async (): Promise<boolean> => {
  if (!navigator.mediaDevices?.enumerateDevices) return false;
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.some((d) => d.kind === "videoinput");
};

/** 권한 상태(granted/denied/prompt/unknown) 조회 */
const getPermissionState = async (): Promise<
  "granted" | "denied" | "prompt" | "unknown"
> => {
  try {
    // TS 타입 가드를 피하기 위해 any 캐스팅
    // 일부 브라우저는 name: 'camera' 대신 'microphone'만 지원하기도 함
    const res = await (navigator.permissions as any)?.query?.({
      name: "camera" as any,
    });
    if (
      res?.state === "granted" ||
      res?.state === "denied" ||
      res?.state === "prompt"
    ) {
      return res.state;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
};

export interface CameraCheckOptions {
  /**
   * probe=true 인 경우, getUserMedia를 실제로 호출해
   * NotReadableError(다른 앱 사용중) 같은 런타임 에러까지 조기 감지합니다.
   * 단, permission이 'prompt'라면 사용자에게 권한 팝업이 뜰 수 있습니다.
   */
  probe?: boolean;
  /** 프론트에서 원하는 제약조건을 그대로 전달 (선택) */
  constraints?: MediaStreamConstraints;
}

/**
 * 카메라 사용이 가능한 환경/권한/장치인지 선검사.
 * - 문제가 있으면 "에러 name"을 가진 예외를 throw (getCameraErrorMessage로 매핑 가능)
 * - 문제가 없으면 resolve(void)
 */
export const ensureCameraReady = async (
  options: CameraCheckOptions = {}
): Promise<void> => {
  const { probe = false, constraints } = options;

  // 1) 보안 컨텍스트 검사 (HTTPS/localhost)
  if (!isHttpsOrLocalhost()) {
    const err = new Error("Insecure context") as any;
    err.name = "InsecureContext";
    throw err;
  }

  // 2) 브라우저 지원 여부
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const err = new Error("mediaDevices unsupported") as any;
    err.name = "MediaDevicesUnsupported";
    throw err;
  }

  // 3) 장치 존재 여부
  if (!(await hasVideoInput())) {
    const err = new Error("No video input") as any;
    err.name = "NotFoundError";
    throw err;
  }

  // 4) 권한 상태
  const permission = await getPermissionState();
  if (permission === "denied") {
    const err = new Error("Permission denied") as any;
    err.name = "NotAllowedError";
    throw err;
  }

  // 5) (선택) 실제 장치 열어보기 (다른 앱 점유/Abort 에러 조기 감지)
  if (probe) {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia(
        constraints ?? { video: true }
      );
      // 바로 정리
      stream.getTracks().forEach((t) => t.stop());
    } catch (e: any) {
      // Permission이 prompt 상태인데 팝업이 차단된 경우를 힌트로
      if (permission === "prompt" && e?.name === "NotAllowedError") {
        const err = new Error("Permission prompt blocked?") as any;
        err.name = "PermissionPromptBlocked";
        throw err;
      }
      // 그대로 위임 (NotAllowedError/NotReadableError/AbortError 등)
      throw e;
    }
  }
};
