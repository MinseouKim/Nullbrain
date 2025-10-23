// ...existing code...
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BodyTypeLineChart from "../components/BodyTypeLineChart";
import { AuthContext } from "../context/AuthContext";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  height?: number;
  weight?: number;
  avatarUrl?: string;
  joinedAt?: string;
};

// 운동 기록 타입 추가
type ExerciseRecord = {
  id: string;
  date: string; // ISO 문자열
  exerciseName: string;
  reps: number;
  bodyScore?: number; // 체형 점수 (0-100)
  accuracy?: number; // 정확도 (0-100)
};

const Page = styled.div`
  min-height: 100vh;
  background: #fff;
  color: #222;
  display: flex;
  flex-direction: column;
`;

/* 반응형 컨테이너: 768 / 480 / 320 브레이크포인트 적용 */
const Container = styled.main`
  width: 1100px;
  max-width: 95%;
  margin: 24px auto;
  display: flex;
  gap: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
    gap: 18px;
    margin: 16px auto;
  }

  @media (max-width: 480px) {
    padding: 12px;
    gap: 12px;
    margin: 12px auto;
  }

  @media (max-width: 320px) {
    padding: 8px;
    gap: 8px;
    margin: 8px auto;
  }
`;

const Left = styled.section`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;

  @media (max-width: 768px) {
    gap: 16px;
  }
  @media (max-width: 480px) {
    gap: 12px;
  }
`;

const Right = styled.aside`
  width: 340px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);

  @media (max-width: 768px) {
    width: 100%;
    padding: 16px;
    margin-top: 6px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }

  @media (max-width: 320px) {
    padding: 10px;
  }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.04);

  @media (max-width: 768px) {
    padding: 16px;
  }
  @media (max-width: 480px) {
    padding: 12px;
  }
  @media (max-width: 320px) {
    padding: 10px;
  }
`;

const Avatar = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;

  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
  }
  @media (max-width: 480px) {
    width: 72px;
    height: 72px;
  }
  @media (max-width: 320px) {
    width: 60px;
    height: 60px;
  }
`;

const Name = styled.h2`
  margin: 0;
  font-size: 22px;
  color: #111;

  @media (max-width: 768px) {
    font-size: 20px;
  }
  @media (max-width: 480px) {
    font-size: 18px;
  }
  @media (max-width: 320px) {
    font-size: 16px;
  }
`;

const Meta = styled.div`
  color: #666;
  font-size: 14px;
  margin-top: 6px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
  @media (max-width: 320px) {
    font-size: 12px;
  }
`;

const Row = styled.div`
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;

  @media (max-width: 768px) {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  @media (max-width: 320px) {
    gap: 8px;
  }
`;

const Btn = styled.button<{ danger?: boolean }>`
  background: ${(p) => (p.danger ? "#000" : "#850000")};
  display: flex;
  align-items: center;
  justify-content: left;
  color: #fff;
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  min-width: 120px;

  &:hover { opacity: 0.95; transform: translateY(-1px); }

  @media (max-width: 768px) {
    min-width: 0;
    padding: 10px 12px;
  }

  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
    padding: 10px;
  }

  @media (max-width: 320px) {
    padding: 8px;
    font-size: 14px;
  }
`;

const GhostBtn = styled.button`
  background: transparent;
  border: 1px solid #ddd;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;

  @media (max-width: 480px) {
    width: 100%;
    text-align: center;
    padding: 10px;
  }

  @media (max-width: 320px) {
    padding: 8px;
  }
`;

const Field = styled.div`
  display:flex;
  justify-content:space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;

  @media (max-width: 480px) {
    font-size: 14px;
    flex-direction: row;
  }

  @media (max-width: 320px) {
    font-size: 13px;
  }
`;

/* 운동 기록 테이블 스타일 - 768 이하에서 가로 스크롤, 480 이하에서 compact */
const RecordTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 14px;
  thead th {
    text-align: left;
    padding: 8px;
    color: #444;
    border-bottom: 1px solid #eee;
  }
  tbody td {
    padding: 10px 8px;
    border-bottom: 1px solid #f5f5f5;
    color: #333;
  }
  tbody tr:hover { background: #fafafa; }

  @media (max-width: 768px) {
    font-size: 13px;
  }

  @media (max-width: 480px) {
    display: block;
    width: 100%;
    overflow-x: auto;
    white-space: nowrap;
  }

  @media (max-width: 320px) {
    font-size: 12px;
  }
`;

const EmptyState = styled.div`
  color: #777;
  padding: 14px 8px;
`;


const ModalOverlay = styled.div`
  width:100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  width:80%;
  background: #f2f2f2;
  padding: 30px;
  border-radius: 12px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;

  @media (max-width: 768px) {
    width: 90%;
    padding: 20px;
  }

  @media (max-width: 480px) {
    width: 95%;
    padding: 14px;
  }

  @media (max-width: 320px) {
    width: 98%;
    padding: 10px;
  }
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
`;

const MyPage: React.FC = () => {
  const { logout } = useContext(AuthContext);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  
  // 모달
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
    const openModal: React.MouseEventHandler<HTMLButtonElement> = () => {
      setIsModalOpen(true);
    };
  
    const closeModal: React.MouseEventHandler<HTMLButtonElement> = () => {
      setIsModalOpen(false);
    };

  // 운동 기록 상태
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 실제 API 경로로 수정하세요
        const res = await fetch("/api/user/me");
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        if (mounted) setUser(json as UserProfile);
      } catch (e) {
        if (mounted) setUser({
          id: "unknown",
          name: "게스트",
          email: "unknown@example.com",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingRecords(true);
      try {
        // 서버에서 운동 기록을 가져오는 엔드포인트 (필요 시 경로 수정)
        const res = await fetch("/api/user/history");
        if (!res.ok) throw new Error("no history");
        const json = await res.json();
        // 서버 응답에 맞게 매핑하세요
        if (mounted) setRecords(json as ExerciseRecord[]);
      } catch (e) {
        // 실패 시 예시 데이터(개발용)
        if (mounted) setRecords([
          { id: "r1", date: new Date().toISOString(), exerciseName: "스쿼트", reps: 15, bodyScore: 82, accuracy: 90 },
          { id: "r2", date: new Date(Date.now() - 86400000).toISOString(), exerciseName: "푸쉬업", reps: 12, bodyScore: 76, accuracy: 84 },
        ]);
      } finally {
        if (mounted) setLoadingRecords(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleLogout = () => {
    logout?.();
    navigate("/login");
  };

  const exportCsv = () => {
    if (!records || records.length === 0) {
      alert("내보낼 기록이 없습니다.");
      return;
    }
    const header = ["date", "exerciseName", "reps", "bodyScore", "accuracy"];
    const rows = records.map(r => [
      new Date(r.date).toLocaleString(),
      r.exerciseName,
      String(r.reps),
      r.bodyScore != null ? String(r.bodyScore) : "",
      r.accuracy != null ? String(r.accuracy) : "",
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exercise_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 체형 점수 통계 계산
  const bodyScoreList = records.filter(r => typeof r.bodyScore === "number").map(r => r.bodyScore as number);
  const avgBodyScore = bodyScoreList.length ? Math.round(bodyScoreList.reduce((a,b) => a + b, 0) / bodyScoreList.length) : null;
  const latestBodyScore = records
    .filter(r => typeof r.bodyScore === "number")
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.bodyScore ?? null;

  return (
    <>
      <Header />
    <Page>
      <Container>
        <Left>
          <Card>
            <Row>
              <div style={{display:"flex", gap:16, alignItems:"center"}}>
                <Avatar src={user?.avatarUrl ?? "/images/default-avatar.png"} alt="avatar" />
                <div>
                  <Name>{user?.name ?? "로딩 중..."}</Name>
                  <Meta>{user?.email}</Meta>
                  <Meta>가입일: {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "-"}</Meta>
                </div>
              </div>
              <div style={{display:"flex", flexDirection:"column", gap:8}}>
                <Btn onClick={() => navigate("/mypage/edit")}>프로필 수정</Btn>
              </div>
            </Row>
          </Card>

          <Card>
            <h3>신체 정보</h3>
            <Field><div>신장</div><div>{user?.height ? `${user.height} cm` : "-"}</div></Field>
            <Field><div>체중</div><div>{user?.weight ? `${user.weight} kg` : "-"}</div></Field>
            <div style={{marginTop:12}}>
              <Btn onClick={() => navigate("/bodyAnalysis")}>자세 분석 다시하기</Btn>
            </div>
          </Card>

          {/* 체형 점수 카드 */}
          <Card>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <h3>체형 점수</h3>
              <div style={{display:"flex", gap:8}}>
                <Btn  onClick={openModal}>지난체형 보기</Btn>
              </div>
            </div>
            {loadingRecords ? (
              <EmptyState>점수 로딩 중...</EmptyState>
            ) : bodyScoreList.length === 0 ? (
              <EmptyState>체형 점수 데이터가 없습니다.</EmptyState>
            ) : (
              <div style={{display:"flex", flexDirection:"column", gap:12}}>
                
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div style={{fontSize:14, color:"#666"}}>평균 점수</div>
                  <div style={{fontSize:22, fontWeight:700, color:"#850000"}}>{avgBodyScore}</div>
                </div>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div style={{fontSize:14, color:"#666"}}>최근 점수</div>
                  <div style={{fontSize:18, fontWeight:700}}>{latestBodyScore ?? "-"}</div>
                </div>

                <div>
                  <div style={{fontSize:14, color:"#666", marginBottom:8}}>최근 점수 목록 (최대 5)</div>
                  <ul style={{margin:0, paddingLeft:16, color:"#333"}}>
                    {records
                      .filter(r => typeof r.bodyScore === "number")
                      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0,5)
                      .map(r => (
                        <li key={r.id} style={{marginBottom:6}}>
                          <strong style={{marginRight:8}}>{r.bodyScore}</strong>
                          <span style={{color:"#777", fontSize:13}}>{new Date(r.date).toLocaleString()}</span>
                        </li>
                      ))
                    }
                  </ul>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h3>운동 기록</h3>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <div style={{color:"#666"}}>최근 운동 세션 및 통계</div>
              <div style={{display:"flex", gap:8}}>
                <Btn onClick={() => navigate("/mypage/history")}>더보기</Btn>
              </div>
            </div>

            {loadingRecords ? (
              <EmptyState>기록 로딩 중...</EmptyState>
            ) : records.length === 0 ? (
              <EmptyState>운동 기록이 없습니다.</EmptyState>
            ) : (
              <RecordTable>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>운동</th>
                    <th>횟수</th>
                    <th>정확도</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 6).map(r => (
                    <tr key={r.id}>
                      <td>{new Date(r.date).toLocaleString()}</td>
                      <td>{r.exerciseName}</td>
                      <td>{r.reps}</td>
                      <td>{r.accuracy != null ? `${r.accuracy}%` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </RecordTable>
            )}
          </Card>
        </Left>

        <Right>
          <Card>
            <h4>계정 설정</h4>
            <div style={{display:"flex", flexDirection:"column", gap:10, marginTop:12}}>
              <GhostBtn onClick={() => navigate("/mypage/change-password")}>비밀번호 변경</GhostBtn>
              <GhostBtn onClick={() => navigate("/settings")}>알림 / 음성 설정</GhostBtn>
              <div style={{display:"flex", flexDirection:"row", gap:10, marginTop:12}}>
              <Btn danger onClick={() => { if(window.confirm("정말로 계정을 삭제하시겠습니까?")) { /* TODO: 삭제 호출 */ navigate("/"); } }}>계정 삭제</Btn>
              <Btn onClick={handleLogout}>로그아웃</Btn>
              </div>
            </div>
          </Card>

          <Card style={{marginTop:16}}>
            <h4>도움말</h4>
            <ul style={{paddingLeft:16, color:"#666"}}>
              <li>프로필 수정으로 신체 정보를 업데이트하세요.</li>
              <li>자세 분석 결과는 마이페이지에서 확인 가능합니다.</li>
            </ul>
          </Card>
        </Right>
      </Container>
    </Page>
      <Footer />
        {/* 모달 */}
      {isModalOpen && (
        <ModalOverlay>
          <ModalContent>
            <CloseBtn onClick={closeModal}>×</CloseBtn>
            <div>
              <BodyTypeLineChart/>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default MyPage;