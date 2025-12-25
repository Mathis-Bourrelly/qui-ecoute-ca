import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useGameLogic } from './hooks/useGameLogic';

import LandingView from './view/LandingView';
import AdminLobby from './component/AdminLobby';
import AdminGameView from './view/AdminGameView';
import PlayerSubmissionForm from './component/PlayerSubmissionForm';
import PlayerVotingView from './view/PlayerVotingView';
import FinishedView from './view/FinishedView';
import ErrorModal from './component/ErrorModal';
import Layout from './component/Layout';
import TestSimulateView from './view/TestSimulateView';

const AdminArea: React.FC<any> = ({ logic }) => {
  const { game, submissions, scores, role } = logic;
  return (
    <Layout lobbyCode={game.lobbyCode} onReset={() => { localStorage.removeItem('qui_ecoute_ca_role'); localStorage.removeItem('qui_ecoute_ca_name'); window.location.href = '/'; }}>
      {game.status === 'setup' && <AdminLobby submissions={submissions} game={game} onStart={logic.startGame} setTimer={logic.setRoundTimer} />}
      {game.status === 'playing' && <AdminGameView game={game} onNext={logic.nextTrack} resetGame={logic.resetGame} />}
      {game.status === 'finished' && <FinishedView role={role} onRestart={logic.resetGame} scores={scores} totalTracks={(game.shuffledPlaylist || []).length || submissions.length} />}
    </Layout>
  );
};

const PlayerArea: React.FC<any> = ({ logic }) => {
  const { game, submissions, playerName, scores, role } = logic;
  return (
    <Layout lobbyCode={game.lobbyCode} onReset={() => { localStorage.removeItem('qui_ecoute_ca_role'); localStorage.removeItem('qui_ecoute_ca_name'); window.location.href = '/'; }}>
      {game.status === 'setup' && (
        <PlayerSubmissionForm 
          playerName={playerName} 
          onSubmit={logic.addSubmission} 
          submissionCount={submissions.filter((s: any) => s.senderName === playerName).length} 
          isProcessing={logic.isLoadingTitle} 
        />
      )}
      {game.status === 'playing' && <PlayerVotingView game={game} playerName={playerName} onVote={logic.handleVote} />}
      {game.status === 'finished' && <FinishedView role={role} onRestart={logic.resetGame} scores={scores} totalTracks={(game.shuffledPlaylist || []).length || submissions.length} />}
    </Layout>
  );
};

const App: React.FC = () => {
  const logic = useGameLogic();
  const { role, game, submissions, playerName, errorMessage, scores } = logic;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('dev_simulate') === '1') {
    return <TestSimulateView />;
  }

  if (errorMessage) {
    return <ErrorModal message={errorMessage} onClose={() => logic.setErrorMessage(null)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingView onCreate={() => { logic.handleCreateGame(); window.location.href = '/admin'; }} onJoin={(code, name) => { logic.handleJoinGame(code, name); window.location.href = '/player'; }} />} />
        <Route path="/admin" element={role === 'admin' ? <AdminArea logic={logic} /> : <Navigate to="/" replace />} />
        <Route path="/player" element={role === 'player' ? <PlayerArea logic={logic} /> : <Navigate to="/" replace />} />
        <Route path="/finished" element={role === 'admin' ? <AdminArea logic={logic} /> : role === 'player' ? <PlayerArea logic={logic} /> : <Navigate to="/" replace />} />
        <Route path="*" element={role === 'none' ? <Navigate to="/" replace /> : role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/player" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;