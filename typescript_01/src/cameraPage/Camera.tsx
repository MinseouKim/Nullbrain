import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/Layouts/MainLayout";
import CameraSection from "../components/CameraSection";
import WorkoutSetupModal from "../components/WorkoutSetupModal";

function Camera(){
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(true);
    const [workoutData, setWorkoutData] = useState<{
        name: string;
        reps: number;
        sets: number;
        category: string;
    } | null>(null);
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
    const [timer, setTimer] = useState(0);

    // 타이머 효과
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        
        if (isWorkoutActive && !isWorkoutPaused) {
            interval = setInterval(() => {
                setTimer(timer => timer + 1);
            }, 1000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isWorkoutActive, isWorkoutPaused]);

    const handleStartWorkout = (exerciseData: { name: string; reps: number; sets: number; category: string }) => {
        setWorkoutData(exerciseData);
        setIsWorkoutActive(true);
        setIsWorkoutPaused(false);
        setTimer(0);
        setShowModal(false);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleToggleWorkout = () => {
        if (isWorkoutActive && !isWorkoutPaused) {
            // 운동 정지
            setIsWorkoutPaused(true);
        } else if (isWorkoutActive && isWorkoutPaused) {
            // 운동 재시작
            setIsWorkoutPaused(false);
        }
    };

    const handleEndWorkout = () => {
        // 운동 상태 초기화
        setIsWorkoutActive(false);
        setIsWorkoutPaused(false);
        setTimer(0);
        setWorkoutData(null);
        
        // 메인페이지로 이동
        navigate('/');
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return(
        <MainLayout 
            isWorkoutActive={isWorkoutActive}
            isWorkoutPaused={isWorkoutPaused}
            onToggleWorkout={handleToggleWorkout}
            onEndWorkout={handleEndWorkout}
            timer={formatTime(timer)}
            workoutData={workoutData}
        >
            <CameraSection workoutData={workoutData} />
            <WorkoutSetupModal 
                isOpen={showModal}
                onClose={handleCloseModal}
                onStartWorkout={handleStartWorkout}
            />
        </MainLayout>
    );
}
export default Camera;