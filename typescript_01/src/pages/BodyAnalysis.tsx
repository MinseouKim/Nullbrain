import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

import Header from '../components/Header';
import Footer from '../components/Footer';
import BodyAnalysisCamera from '../components/BodyAnalysisCamera';
import BodyAnalysisModal from '../components/BodyAnalysisModal';

interface BodyData {
    height: number;
    weight: number;
    gender: 'male' | 'female';
    age: number;
}

const AppWrapper = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    font-family: 'Noto Sans KR', sans-serif;
    background-color: white;
    color: #333;
`;

const Main = styled.main`
    flex: 1;
    width: 100%;
    margin: 20px 0 10px 0;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
`;

const MainContent = styled.div`
    flex-grow: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    margin-right: 24px;
    min-height: 630px; // 카메라 영역의 최소 높이를 확보하여 더 크게 만듭니다.
`;

const Sidebar = styled.aside`
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const ControlBox = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f7f7f7;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 20px;
    font-weight: 500;
`;

const GuideBox = styled.div`
    background-color: #f7f7f7;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 20px;
    h3 {
        margin: 0 0 15px 0;
        font-size: 16px;
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

const StopButton = styled.button`
    background-color: #980A0A;
    color: white;
    font-size: 18px;
    font-weight: 700;
    border: none;
    padding: 18px;
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    &:hover { background-color: #7a0808; }
`;

const ToggleSwitchLabel = styled.label`
    position: relative;
    display: inline-block;
    width: 80px;
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
    ${HiddenCheckbox}:checked + ${SliderSpan} { background-color: #555; }
    ${HiddenCheckbox}:checked + ${SliderSpan}:before { transform: translateX(46px); }
`;

const PoseImage = styled.img`
    width: 100%;
    border-radius: 8px;
`;

const PosePreview = styled.div`
    flex: 1;
    background-color: #E9E9E9;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
`;

// --- The BodyAnalysis Component ---
const BodyAnalysis = () => {
    const [isVoiceOn, setIsVoiceOn] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [bodyData, setBodyData] = useState<BodyData | null>(null);
    const navigate = useNavigate();

    const handleStartAnalysis = (data: BodyData) => {
        setBodyData(data);
        setIsModalOpen(false);
        console.log("체형 분석 시작. 입력 데이터:", data);
    };

    return (
        <>
        <Header />
            <AppWrapper>
                <Main>
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
                        <StopButton>체형 분석 중단하기</StopButton>
                    </Sidebar>
                </Main>
                <BodyAnalysisModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onStart={handleStartAnalysis}
                />
            </AppWrapper>
        <Footer />
    </>
    );
};

export default BodyAnalysis;