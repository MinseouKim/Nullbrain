import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";

const MainPage = lazy(() => import("../pages/MainPage"));
const ExerciseItems = lazy(() => import("../pages/ExerciseItems"));

const Routers = (props: any) => {
    return (
        <Suspense fallback={<></>}>

            <Routes>
                <Route path='/' element={<Navigate replace to='/main' {...props} />} />
                <Route path='main' element={<MainPage {...props} />} />
                <Route path='exercise' element={<ExerciseItems {...props} />} />
            </Routes>
        </Suspense>
    )

}
export default Routers;