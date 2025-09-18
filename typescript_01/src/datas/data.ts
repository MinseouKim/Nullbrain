export interface ExerciseDetail {
  id: number;
  name: string;
  category: string; // 예: 하체, 상체
  image: string; // 운동 부위 사진 경로 (예: '/images/squat-muscle.jpg')
  stimulationArea: string[]; // 자극 부위
  effect: string[]; // 효과
  caution: string[]; // 주의사항
}

export const EXERCISE_DETAILS: ExerciseDetail[] = [
  {
    id: 1,
    name: '스쿼트',
    category: '하체',
    image: '',
    stimulationArea: ['대퇴사두근', '둔근', '햄스트링'],
    effect: ['하체 근력 강화', '코어 안정성 향상', '칼로리 소모'],
    caution: [
      '허리가 굽지 않도록 주의',
      '무릎이 발끝보다 나가지 않도록 주의',
      '발바닥 전체로 지지',
    ],
  },
  {
    id: 2,
    name: '푸쉬업',
    category: '상체',
    image: '', 
    stimulationArea: ['가슴 (대흉근)', '삼두근', '어깨 (삼각근)'],
    effect: ['상체 근력 강화', '코어 강화', '전신 협응력 증진'],
    caution: [
      '허리가 꺾이지 않도록 복근에 힘 주기',
      '팔꿈치가 너무 벌어지지 않도록 주의',
      '손목 부담 줄이기',
    ],
  },
  {
    id: 3,
    name: '플랭크',
    category: '전신',
    image: '', 
    stimulationArea: ['복직근', '복횡근', '척추 기립근', '둔근'],
    effect: ['코어 근육 강화', '자세 교정', '허리 통증 완화'],
    caution: [
      '허리가 꺾이거나 엉덩이가 너무 올라가지 않도록 일자 유지',
      '어깨와 손목에 부담이 가지 않도록 주의',
      '호흡 유지',
    ],
  },
];