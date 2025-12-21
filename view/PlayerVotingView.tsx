
import React from 'react';
import { GameState } from '../types';

interface PlayerVotingViewProps {
  game: GameState;
  playerName: string;
  onVote: (name: string) => void;
}

const PlayerVotingView: React.FC<PlayerVotingViewProps> = ({ game, playerName, onVote }) => {
  const currentVotes = game.votes[game.currentTrackIndex] || [];
  const myVote = currentVotes.find(v => v.voterName === playerName);

  return (
    <div className="max-w-md mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-500 px-1">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">C'EST QUI ?</h2>
        <p className="text-indigo-200 font-bold text-[10px] md:text-xs uppercase">Choisis le coupable !</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {game.participants.map((name, i) => {
          const isMe = name === playerName;
          const color = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-cyan-500'][i % 6];
          return (
            <button 
              key={name} 
              disabled={!!myVote} 
              onClick={() => onVote(name)} 
              className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-b-4 md:border-b-8 border-black/20 text-white font-black text-sm md:text-lg italic transition-all relative overflow-hidden active:scale-95 disabled:opacity-50 flex items-center justify-center text-center min-h-[70px] md:min-h-[100px]
                ${myVote?.guessedName === name ? 'ring-2 md:ring-4 ring-yellow-400 scale-105' : ''} 
                ${color}`}
            >
              <span className="truncate max-w-full px-1">{name}</span>
              {isMe && <span className="absolute top-1 right-2 text-[6px] md:text-[8px] opacity-50 uppercase">Moi</span>}
              {myVote?.guessedName === name && <span className="absolute bottom-1 right-1 text-lg md:text-2xl">✅</span>}
            </button>
          );
        })}
      </div>
      {myVote ? (
        <div className="bg-white/10 p-4 rounded-2xl text-center border-2 border-white/20 animate-pulse mt-4">
          <p className="text-white text-xs md:text-base font-black italic uppercase tracking-tight">Vote enregistré ! Attendons les autres...</p>
        </div>
      ) : (
        <p className="text-center text-indigo-300 text-[10px] font-bold uppercase italic tracking-widest mt-4">Fait ton choix !</p>
      )}
    </div>
  );
};

export default PlayerVotingView;
