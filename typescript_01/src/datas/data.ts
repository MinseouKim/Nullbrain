// src/datas/data.ts

export interface ExerciseDetail {
  id: number;
  name: string;
  category: "상체" | "하체" | "전신" | "유산소";
  description: string;
  imageUrl: string;
  stimulationArea: string[]; 
  effect: string[];        
  caution: string[];         
  popularity: number;
}

export const EXERCISE_DETAILS: ExerciseDetail[] = [
  {
    id: 1,
    name: "스쿼트",
    category: "하체",
    description: "하체 근육을 강화하는 가장 대표적인 운동으로, 전신 근력 향상에도 효과적입니다.",
    imageUrl: "https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNTAzMTdfODIg%2FMDAxNzQyMjAwNjUxMDUz.Rd5M3mLr0KQBrXGUEy3Yf2ZeDuQANaPs3N1cy0YYI3Eg.Sjpde4a5O7U1GDwwQnsGcu-LKh5084jygtEA2SjofKsg.JPEG%2FKakaoTalk_20250317_125816163.jpg&type=sc960_832",
    stimulationArea: ["대퇴사두근 (허벅지 앞)", "둔근 (엉덩이)", "햄스트링 (허벅지 뒤)"],
    effect: ["하체 근력 강화", "코어 안정성 향상", "기초대사량 증가"],
    caution: ["허리가 구부러지지 않도록 곧게 펴주세요.", "무릎이 발끝보다 앞으로 과도하게 나가지 않도록 주의하세요.", "앉을 때 엉덩이를 뒤로 빼는 느낌으로 수행하세요."],
    popularity: 95,
  },
  {
    id: 2,
    name: "벤치프레스",
    category: "상체",
    description: "가슴, 어깨, 삼두근을 포함한 상체 전반의 근력을 키우는 대표적인 운동입니다.",
    imageUrl: "https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNTAyMTdfMTMw%2FMDAxNzM5NzQ1ODQ5MTcw.TAOd4mwMQ18-lCDlLqBD2ilmPKeaNa712L65mE6UXe8g.oeo-Ec2jDfwR9df_UdiHGPQC3eQUJJLGn7Y6KGt2-3cg.PNG%2Fimage.png&type=sc960_832",
    stimulationArea: ["대흉근 (가슴)", "전면 삼각근 (어깨)", "삼두근 (팔 뒤)"],
    effect: ["상체 근력 및 근비대", "가슴 근육 발달", "어깨 안정성 강화"],
    caution: ["어깨 부상을 방지하기 위해 과도한 무게는 피하세요.", "바를 내릴 때 가슴에 살짝 닿는 느낌으로 통제하며 내리세요.", "손목이 꺾이지 않도록 주의하세요."],
    popularity: 90,
  },
  {
    id: 3,
    name: "플랭크",
    category: "전신",
    description: "몸의 중심부인 코어 근육을 강화하여 신체 안정성과 자세 교정에 도움을 주는 정적 운동입니다.",
    imageUrl: "https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDEyMTlfMTc0%2FMDAxNzM0NTY1MzUwMTQ4._rVDdNfWYI99Gy2NhNctsbAqwRR7MWLENtgZAbehPpEg.pk3cQNjrbr00u3sk-Gwsz3H0_S3y3TvGfLRA5wJfzXAg.JPEG%2F%25C1%25A6%25B8%25F1%25C0%25BB-%25C0%25D4%25B7%25C2%25C7%25D8%25C1%25D6%25BC%25BC%25BF%25E4_-014_%25281%2529.jpg&type=sc960_832",
    stimulationArea: ["복직근 (복부)", "복횡근 (코어)", "척추기립근 (허리)"],
    effect: ["코어 근력 강화", "자세 교정", "요통 완화"],
    caution: ["허리가 아래로 처지거나 엉덩이가 너무 높게 들리지 않도록 하세요.", "몸이 머리부터 발끝까지 일직선을 유지하도록 신경쓰세요."],
    popularity: 75,
  },
  {
    id: 4,
    name: "런지",
    category: "하체",
    description: "하체 근력과 함께 균형 감각을 효과적으로 향상시킬 수 있는 운동입니다.",
    imageUrl: "https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDEwMDRfODcg%2FMDAxNzI4MDEwMTI4NjE2.10HUiASnx7Aff8eGJVrLu6WlS0sGO-8vuiPWz3gGvH8g.SCa9_lqMbsu8sE8sqCUIbGfUJU8-gRXzleRdoOEWBwcg.PNG%2Fimage_%25281%2529.png&type=a340",
    stimulationArea: ["대퇴사두근 (허벅지 앞)", "둔근 (엉덩이)", "내전근 (허벅지 안)"],
    effect: ["하체 근력 및 균형 감각 향상", "힙 유연성 증진", "좌우 비대칭 개선"],
    caution: ["상체를 곧게 세워 구부러지지 않도록 하세요.", "앞쪽 무릎이 발끝을 넘지 않도록 주의하세요.", "뒤쪽 무릎이 바닥에 닿지 않도록 통제하세요."],
    popularity: 65,
  },
  {
    id: 5,
    name: "데드리프트",
    category: "전신",
    description: "전신 후면 사슬 근육을 모두 사용하여 '전신 운동의 왕'이라 불리는 운동입니다.",
    imageUrl: "https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNTA3MjhfNjYg%2FMDAxNzUzNjY3MDAyOTk1.ne9CFeZuWg8vv0nFr2DCiTts7stXPXcxVVKs3-QxqXwg.Xc6hqTy1TsKAMMQh1_rxt8sMEK3IlREyFr4j09ID1iAg.PNG%2F20250728_103650.png&type=a340",
    stimulationArea: ["척추기립근 (허리)", "둔근 (엉덩이)", "햄스트링 (허벅지 뒤)", "광배근 (등)"],
    effect: ["전신 근력 강화", "악력 향상", "파워 증진"],
    caution: ["허리가 절대 구부러지면 안 됩니다. 항상 곧은 상태를 유지하세요.", "무게 중심은 발 중앙에 두도록 하세요."],
    popularity: 93,
  },
  {
    id: 6,
    name: "풀업",
    category: "상체",
    description: "자신의 체중을 이용해 등과 팔 근육을 강화하는 가장 효과적인 상체 운동 중 하나입니다.",
    imageUrl: "https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNTA0MjVfMTA3%2FMDAxNzQ1NTgxMzQ1MjI5.dt6PYIHIvQ5WX2u0_CaPaSHUey0orSOQ5dZgPbFEMWMg.tAgsbI_419aSN8A_NG3W3LXStlLFIl9_vCmeKZf8-wMg.PNG%2Fimage.png&type=a340",
    stimulationArea: ["광배근 (등)", "이두근 (팔 앞)", "승모근 (어깨 뒤)"],
    effect: ["등 근육 발달 (넓은 등)", "팔 근력 강화", "악력 향상"],
    caution: ["어깨에 과도한 부담이 가지 않도록 천천히 수행하세요.", "반동을 이용하지 않고 근육의 힘으로 올라가세요."],
    popularity: 96,
  },
  {
    id: 7,
    name: "달리기",
    category: "유산소",
    description: "심폐지구력을 향상시키고 체지방을 감소시키는 가장 기본적인 유산소 운동입니다.",
    imageUrl: "",
    stimulationArea: ["심장", "폐", "하체 근육 전반"],
    effect: ["심폐지구력 향상", "체지방 감소", "스트레스 해소"],
    caution: ["자신에게 맞는 속도와 거리를 설정하여 무리하지 마세요.", "쿠션이 좋은 신발을 착용하여 관절을 보호하세요."],
    popularity: 97,
  },
];