// src/App.tsx (대안)
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GlobalStyles } from '@/style/GlobalStyles';
import Home from '@/pages/Home/page';

function App() {
  return (
    <>
      <GlobalStyles />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/characters" element={<div>캐릭터 제작</div>} />
        <Route path="/my-characters" element={<div>내 캐릭터</div>} />
      </Routes>
    </>
  );
}

export default App;