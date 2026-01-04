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
        <Route 
          path="/my-characters" 
          element={<Home title="내 캐릭터" isMyCharacters={true} />} 
        />
      </Routes>
    </>
  );
}

export default App;