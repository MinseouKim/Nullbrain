import React, {useState, useEffect} from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

import Header from '../components/Header';
import Footer from '../components/Footer';
import BodyAnalysisCamera from '../components/BodyAnalysisCamera';
import BodyAnalysisModal from '../components/BodyAnalysisModal';

// --- 인터페이스 ---
interface BodyData {
    height: number;
    weight: number;
    gender: 'male' | 'female';
    age: number;
}

// --- 스타일 컴포넌트 ---

const MainLayoutContainer = styled.div`
    min-height: 100vh;
    background-color: white;
    color: #333;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    display: flex;
    flex-direction: column;
`;

const ContentContainer = styled.div`
    display: flex;
    flex: 1;
    width: 100%;
`;

const MainContent = styled.main`
    flex: 1;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const Sidebar = styled.aside`
    width: 350px;
    background-color: #f8f9fa;
    padding: 20px;
    border-left: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
`;

const ControlBox = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 20px;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const GuideBox = styled.div`
    background-color: #ffffff;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    h3 {
        margin: 0 0 15px 0;
        font-size: 16px;
        color: #850000;
    }
    ul {
        margin: 0;
        padding-left: 0;
        list-style: none;
        font-size: 14px;
        color: #666;
        line-height: 1.6;
    }
`;

// ✅ StopButton 수정
const StopButton = styled.button`
    /* margin-top: auto; 제거 */
    background: linear-gradient(135deg, #850000 0%, #a00000 100%);
    color: white;
    font-size: 18px;
    font-weight: 700;
    border: none;
    padding: 18px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 6px 16px rgba(133, 0, 0, 0.3);

    &:hover {
        background: linear-gradient(135deg, #6b0000 0%, #8b0000 100%);
        transform: translateY(-2px);
    }
`;

const ToggleSwitchLabel = styled.label`
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
`;
const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
    opacity: 0;
    width: 0;
    height: 0;
`;
const SliderSpan = styled.span`
    position: absolute;
    cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
    &:before {
        position: absolute; content: "";
        height: 26px; width: 26px;
        left: 4px; bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }
`;
const StyledToggleSwitch = styled.div`
    ${HiddenCheckbox}:checked + ${SliderSpan} { background-color: #850000; }
    ${HiddenCheckbox}:checked + ${SliderSpan}:before { transform: translateX(26px); }
`;

// ✅ PoseImage 수정
const PoseImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: contain; /* 이미지 비율 유지 */
    border-radius: 8px;
`;

// ✅ PosePreview 수정
const PosePreview = styled.div`
    flex: 1; /* 남는 공간을 모두 차지하도록 설정 */
    min-height: 150px; /* 최소 높이 지정으로 너무 작아지는 것 방지 */
    background-color: #ffffff;
    border-radius: 12px;
    border: 1px solid #ddd;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

// --- BodyAnalysis Component ---
const BodyAnalysis = () => {
    const [isVoiceOn, setIsVoiceOn] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [bodyData, setBodyData] = useState<BodyData | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsModalOpen(false);
            }
        };
        if (isModalOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen]);

    const handleStartAnalysis = (data: BodyData) => {
        setBodyData(data);
        setIsModalOpen(false);
        console.log("체형 분석 시작. 입력 데이터:", data);
    };

    return (
        <MainLayoutContainer>
            <Header />
            <ContentContainer>
                <MainContent>
                    <BodyAnalysisCamera />
                </MainContent>

                <Sidebar>
                    <ControlBox>
                        <span>음성 안내</span>
                        <StyledToggleSwitch>
                            <ToggleSwitchLabel>
                                <HiddenCheckbox
                                    checked={isVoiceOn}
                                    onChange={() => setIsVoiceOn(!isVoiceOn)}
                                />
                                <SliderSpan />
                            </ToggleSwitchLabel>
                        </StyledToggleSwitch>
                    </ControlBox>
                    <GuideBox>
                        <h3>[ 의상 가이드 ]</h3>
                        <ul>
                            <li>밝은 조명 아래에서 촬영해주세요</li>
                            <li>헐렁하지 않은 옷을 착용해주세요</li>
                            <li>어두운 배경에 밝은 옷이 좋아요</li>
                        </ul>
                    </GuideBox>
                    <PosePreview>
                        <PoseImage src="https://i.pinimg.com/236x/a3/87/33/a3873380fad4d9bd5062e5418eaffe4e.jpg" alt="분석 자세 가이드" />
                    </PosePreview>
                    <StopButton onClick={() => navigate('/main')}>체형 분석 중단하기</StopButton>
                </Sidebar>
            </ContentContainer>
            <Footer />

            <BodyAnalysisModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onStart={handleStartAnalysis}
            />
        </MainLayoutContainer>
    );
};

export default BodyAnalysis;