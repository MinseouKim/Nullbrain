import React, { useState } from 'react';
import styled from 'styled-components';

// --- Types ---
interface BodyData {
    height: number;
    weight: number;
    gender: 'male' | 'female';
    age: number;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (data: BodyData) => void;
}

// --- Styled Components ---
const CloseButton = styled.button`
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 22px;
    font-weight: bold;
    color: #999;
    cursor: pointer;
    transition: color 0.2s;
    &:hover {
        color: #333;
    }
`;

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContainer = styled.div`
    background-color: white;
    padding: 40px;
    border-radius: 16px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    gap: 25px;
    position: relative;   
`;

const Title = styled.h2`
    margin: 0;
    text-align: center;
    font-size: 24px;
`;

const Description = styled.p`
    margin: 0;
    text-align: center;
    color: #666;
    line-height: 1.5;
`;

const Form = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Label = styled.label`
    font-weight: 500;
    font-size: 16px;
`;

const Input = styled.input`
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 16px;
`;

const Select = styled.select`
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 16px;
`;

const StartButton = styled.button`
    background-color: #980A0A;
    color: white;
    font-size: 18px;
    font-weight: 700;
    border: none;
    padding: 15px 40px;
    border-radius: 50px;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-top: 10px;
    &:hover { background-color: #7a0808; }
`;

// --- Component ---

const BodyAnalysisModal: React.FC<ModalProps> = ({ isOpen, onClose, onStart }) => {
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [age, setAge] = useState('');

    if (!isOpen) {
        return null;
    }

    const handleStartClick = () => {
        // 모든 필드가 입력되었는지 간단히 확인 (선택 사항)
        if (!height || !weight || !age) {
            alert("모든 정보를 입력해주세요.");
            return;
        }

        const data: BodyData = {
            height: Number(height),
            weight: Number(weight),
            gender,
            age: Number(age),
        };
        onStart(data);
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <CloseButton onClick={onClose}>&times;</CloseButton>
                
                <Title>체형 분석 시작하기</Title>
                <Description>
                    정확한 분석을 위해 신체 정보를 입력해주세요.
                </Description>

                <Form>
                    <InputGroup>
                        <Label>키 (cm)</Label>
                        <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="예: 175" />
                    </InputGroup>
                    <InputGroup>
                        <Label>몸무게 (kg)</Label>
                        <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="예: 70" />
                    </InputGroup>
                    <InputGroup>
                        <Label>성별</Label>
                        <Select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')}>
                            <option value="male">남성</option>
                            <option value="female">여성</option>
                        </Select>
                    </InputGroup>
                    <InputGroup>
                        <Label>만 나이</Label>
                        <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="예: 25" />
                    </InputGroup>
                </Form>

                <StartButton onClick={handleStartClick}>체형 분석하기</StartButton>
            </ModalContainer>
        </ModalOverlay>
    );
};

export default BodyAnalysisModal;