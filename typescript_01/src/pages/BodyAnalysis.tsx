import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

import Header from '../components/Header';
import Footer from '../components/Footer';
import CameraSection from '../components/CameraSection'; 
import BodyAnalysisModal from '../components/BodyAnalysisModal';

// --- 인터페이스 ---
interface BodyData {
    height: number;
    weight: number;
    gender: 'male' | 'female';
    age: number;
    name: string;
    reps: number;
    sets: number;
    category: string;
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
    flex: 1; /* 헤더와 푸터 사이의 모든 공간을 차지 */
    width: 100%;
    /* min-height: 655px; 제거 -> 화면 높이에 맞게 유연하게 조절 */
    /* margin: 24px auto; 제거 -> 불필요한 상하 여백 제거 */
    padding: 24px;
    box-sizing: border-box;
    gap: 32px;
`;

const MainContent = styled.main`
    flex: 1; 
    display: flex;
    flex-direction: column;
    min-width: 0; 
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
    flex-shrink: 0;
`;

// (이하 다른 스타일 컴포넌트는 이전과 동일)
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
    h3 { margin: 0 0 15px 0; font-size: 16px; color: #850000; }
    ul { margin: 0; padding-left: 0; list-style: none; font-size: 14px; color: #666; line-height: 1.6; }
`;

const PosePreview = styled.div`
    flex: 1;
    min-height: 150px;
    background-color: #ffffff;
    border-radius: 12px;
    border: 1px solid #ddd;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const PoseImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
`;

const ActionButton = styled.button<{ isStopped?: boolean }>`
    margin-top: auto;
    background: ${(props) => props.isStopped ? "linear-gradient(135deg, #28a745 0%, #20c997 100%)" : "linear-gradient(135deg, #850000 0%, #a00000 100%)"};
    color: white;
    border: none;
    padding: 18px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 18px;
    font-weight: 700;
    transition: all 0.3s ease;
    box-shadow: ${(props) => props.isStopped ? "0 6px 16px rgba(40, 167, 69, 0.3)" : "0 6px 16px rgba(133, 0, 0, 0.3)"};
    &:hover:not(:disabled) {
        background: ${(props) => props.isStopped ? "linear-gradient(135deg, #218838 0%, #1ea085 100%)" : "linear-gradient(135deg, #6b0000 0%, #8b0000 100%)"};
        transform: translateY(-3px);
        box-shadow: ${(props) => props.isStopped ? "0 8px 20px rgba(40, 167, 69, 0.4)" : "0 8px 20px rgba(133, 0, 0, 0.4)"};
    }
    &:disabled {
        background: linear-gradient(135deg, #ccc 0%, #999 100%);
        cursor: not-allowed;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        opacity: 0.7;
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
    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
    background-color: #ccc; transition: .4s; border-radius: 34px;
    &:before { position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
`;

const StyledToggleSwitch = styled.div`
    ${HiddenCheckbox}:checked + ${SliderSpan} { background-color: #850000; }
    ${HiddenCheckbox}:checked + ${SliderSpan}:before { transform: translateX(26px); }
`;

// --- BodyAnalysis Component ---
const BodyAnalysis = () => {
    // (컴포넌트 로직은 이전과 동일)
    const [isVoiceOn, setIsVoiceOn] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [bodyData, setBodyData] = useState<BodyData | null>(null);
    const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
    const navigate = useNavigate();

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleCloseModal();
            }
        };
        if (isModalOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen, bodyData]); 

    const handleStartAnalysis = (data: Omit<BodyData, 'name' | 'reps' | 'sets' | 'category'>) => {
        const fullBodyData: BodyData = {
            ...data, name: "체형 분석", reps: 0, sets: 0, category: "분석"
        };
        setBodyData(fullBodyData);
        setIsModalOpen(false);
        setIsAnalysisRunning(true);
    };

    const handleToggleAnalysis = () => {
        if (isAnalysisRunning) {
            setIsAnalysisRunning(false);
        } else {
            setIsAnalysisRunning(true);
        }
    };

    return (
        <>
            <Header />
            <MainLayoutContainer>
                <ContentContainer>
                    <MainContent>
                        <CameraSection
                            workoutData={bodyData}
                            isWorkoutPaused={!isAnalysisRunning}
                        />
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
                        
                        <ActionButton 
                            onClick={handleToggleAnalysis}
                            disabled={!bodyData}
                            isStopped={!isAnalysisRunning}
                        >
                            {isAnalysisRunning ? '체형 분석 중단하기' : '체형 분석 재시작'}
                        </ActionButton>
                    </Sidebar>
                </ContentContainer>
                
                <BodyAnalysisModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onStart={handleStartAnalysis}
                />
            </MainLayoutContainer>
            <Footer />
        </>
    );
};

export default BodyAnalysis;