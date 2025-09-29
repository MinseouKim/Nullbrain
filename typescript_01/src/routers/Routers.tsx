import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";

const MainPage = lazy(() => import("../pages/MainPage"));
const ExerciseItems = lazy(() => import("../pages/ExerciseItems"));
const Camera = lazy(() => import("../cameraPage/Camera"));
const BodyTypeResult = lazy(() => import("../pages/BodyTypeResult"));
const ExerciseResult = lazy(() => import("../components/ExerciseResult"));
const BodyAnalysis = lazy(() => import("../pages/BodyAnalysis"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const SignUpPage = lazy(() => import("../pages/SignUpPage"));
const AdminPage = lazy(() => import("../pages/AdminPage"));

const Routers = (props: any) => {
  return (
    <Suspense fallback={<></>}>
      <Routes>
        <Route path="/" element={<Navigate replace to="/main" {...props} />} />
        <Route path="main" element={<MainPage {...props} />} />
        <Route path="exercise" element={<ExerciseItems {...props} />} />
        <Route path="camera" element={<Camera {...props} />} />
        <Route path="bodyTypeResult" element={<BodyTypeResult {...props} />} />
        <Route path="result" element={<ExerciseResult {...props} />} />
        <Route path="bodyAnalysis" element={<BodyAnalysis {...props} />} />
        <Route path="login" element={<LoginPage {...props} />} />
        <Route path="signUp" element={<SignUpPage {...props} />} />
        <Route path="admin" element={<AdminPage {...props} />} />
      </Routes>
    </Suspense>
  );
};
export default Routers;
