import { useQuery } from "@tanstack/react-query";
import { Bell, Settings, Gamepad } from "lucide-react";

interface AppHeaderProps {
  onOpenInviteModal: () => void;
  currentUserId: number;
}

export default function AppHeader({ onOpenInviteModal, currentUserId }: AppHeaderProps) {
  const { data: user } = useQuery({
    queryKey: ["/api/user", currentUserId],
  });

  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="hand-drawn bg-coral p-2 text-white">
              <Gamepad className="w-6 h-6" />
            </div>
            <h1 className="font-kalam text-2xl font-bold text-slate">QuickBuddies</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="friend-avatar w-10 h-10 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.username?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-warm-yellow rounded-full flex items-center justify-center notification-badge">
                <span className="text-xs font-bold text-slate">3</span>
              </div>
            </div>
            
            <button 
              className="hand-drawn bg-sage p-2 text-white hover:bg-opacity-80 transition-all"
              onClick={onOpenInviteModal}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
