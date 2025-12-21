import React from 'react';
import { useGameLogic } from './hooks/useGameLogic';

import LandingView from './view/LandingView';
import AdminLobby from './component/AdminLobby';
import AdminGameView from './view/AdminGameView';
import PlayerSubmissionForm from './component/PlayerSubmissionForm';
import PlayerVotingView from './view/PlayerVotingView';
import FinishedView from './view/FinishedView';
import ErrorModal from './component/ErrorModal';
import Layout from './component/Layout';

const App: React.FC = () => {
  const logic = useGameLogic();
  const { role, game, submissions, playerName, errorMessage, scores } = logic;

  if (errorMessage) {
    return <ErrorModal message={errorMessage} onClose={() => logic.setErrorMessage(null)} />;
  }

  if (role === 'none') {
    return <LandingView onCreate={logic.handleCreateGame} onJoin={logic.handleJoinGame} />;
  }

  return (
    <Layout lobbyCode={game.lobbyCode} onReset={() => window.location.reload()}>
      {role === 'admin' ? (
        <>
          {game.status === 'setup' && <AdminLobby submissions={submissions} game={game} onStart={logic.startGame} setTimer={logic.setRoundTimer} />}
          {game.status === 'playing' && <AdminGameView game={game} onNext={logic.goToNextTrack} resetGame={logic.resetGame} />}
          {game.status === 'finished' && <FinishedView onRestart={logic.resetGame} scores={scores} />}
        </>
      ) : (
        <>
          {game.status === 'setup' && (
            <PlayerSubmissionForm 
              playerName={playerName} 
              onSubmit={logic.addSubmission} 
              submissionCount={submissions.filter(s => s.senderName === playerName).length} 
              isProcessing={logic.isLoadingTitle} 
            />
          )}
          {game.status === 'playing' && <PlayerVotingView game={game} playerName={playerName} onVote={logic.handleVote} />}
          {game.status === 'finished' && <FinishedView onRestart={logic.resetGame} scores={scores} />}
        </>
      )}
    </Layout>
  );
};

export default App;