import { Route, Routes } from 'react-router-dom';
import ChattingPage from './Chatting/page';
import HomePage from './Home/page';
import CreateChatPage from './CreateChat/page';

export const Router = () => {
    return (
        <Routes>
            <Route path="/chatting" element={<ChattingPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/create-chat" element={<CreateChatPage />} />
            <Route path="/my-characters" element={<HomePage title="내 캐릭터" isMyCharacters={true} />}  />
        </Routes>
    );
};
