import { useQuery } from "@tanstack/react-query";
import { Crown, Trophy, Medal } from "lucide-react";

export default function Leaderboard() {
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["/api/leaderboard"],
  });

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="challenge-card hand-drawn p-6">
      <h2 className="font-kalam text-2xl font-bold text-slate mb-6 text-center">Weekly Leaderboard</h2>
      
      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-slate/60">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No players on the leaderboard yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="text-center order-1">
                <div className="bg-slate/20 hand-drawn p-4 h-20 flex items-end justify-center mb-2">
                  <div className="friend-avatar w-12 h-12 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {top3[1].username[0].toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="font-semibold text-slate">{top3[1].username}</div>
                <div className="text-lg font-bold text-slate">{top3[1].totalScore}</div>
                <div className="w-8 h-8 bg-slate rounded-full flex items-center justify-center mx-auto mt-1">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
              </div>
            )}
            
            {/* 1st Place */}
            {top3[0] && (
              <div className="text-center order-2">
                <div className="bg-warm-yellow/30 hand-drawn p-4 h-24 flex items-end justify-center mb-2">
                  <div className="friend-avatar w-14 h-14 rounded-full flex items-center justify-center">
                    <Crown className="text-white w-6 h-6" />
                  </div>
                </div>
                <div className="font-semibold text-slate">{top3[0].username}</div>
                <div className="text-xl font-bold text-warm-yellow">{top3[0].totalScore}</div>
                <div className="w-8 h-8 bg-warm-yellow rounded-full flex items-center justify-center mx-auto mt-1">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
              </div>
            )}
            
            {/* 3rd Place */}
            {top3[2] && (
              <div className="text-center order-3">
                <div className="bg-coral/20 hand-drawn p-4 h-16 flex items-end justify-center mb-2">
                  <div className="friend-avatar w-10 h-10 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {top3[2].username[0].toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="font-semibold text-slate">{top3[2].username}</div>
                <div className="text-lg font-bold text-slate">{top3[2].totalScore}</div>
                <div className="w-8 h-8 bg-coral rounded-full flex items-center justify-center mx-auto mt-1">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
              </div>
            )}
          </div>

          {/* Rest of Rankings */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((player: any, index: number) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-paper hand-drawn">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-sage rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{index + 4}</span>
                    </div>
                    <div className="friend-avatar w-8 h-8 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {player.username[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-slate">{player.username}</span>
                  </div>
                  <div className="font-bold text-slate">{player.totalScore}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
