import React from 'react';
import styled from 'styled-components';

// Styled Components
const CameraSectionContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    box-sizing: border-box;
`;

const FeedbackSection = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 25px 30px;
    background-color: #f8f9fa;
    border-radius: 12px;
    border: 2px solid #e0e0e0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
    min-height: 80px;
`;

const FeedbackMessage = styled.div`
    color: #333;
    font-size: 22px;
    font-weight: 700;
`;

const CameraContainer = styled.div`
    width: 100%;
    flex: 1; /* 남은 공간을 모두 차지하도록 설정 */
    background-color: #f8f9fa;
    border-radius: 12px;
    border: 2px solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    /* min-height 속성을 제거하여 유연성을 확보 */
`;

const CameraPlaceholder = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
    color: #666;
`;

const CameraIcon = styled.div`
    font-size: 48px;
    opacity: 0.7;
`;

const CameraText = styled.div`
    font-size: 20px;
    font-weight: 600;
    color: #666;
`;

const CameraSubtitle = styled.div`
    font-size: 14px;
    color: #999;
    font-style: italic;
`;

const BodyAnalysisCamera: React.FC = () => {
    const feedbackMessage = "체형 분석을 시작하겠습니다!";

    return (
        <CameraSectionContainer>
            <FeedbackSection>
                <FeedbackMessage>{feedbackMessage}</FeedbackMessage>
            </FeedbackSection>

            <CameraContainer>
                <CameraPlaceholder>
                    <CameraIcon>📷</CameraIcon>
                    <CameraText>카메라 영역</CameraText>
                    <CameraSubtitle>체형 분석 중...</CameraSubtitle>
                </CameraPlaceholder>
            </CameraContainer>
        </CameraSectionContainer>
    );
};

export default BodyAnalysisCamera;