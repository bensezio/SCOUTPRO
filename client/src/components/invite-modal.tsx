import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Facebook, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
}

export default function InviteModal({ isOpen, onClose, currentUserId }: InviteModalProps) {
  const { toast } = useToast();
  const [inviteLink] = useState(`${window.location.origin}/join/abc123`);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Link Copied!",
        description: "Invite link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link. Please copy it manually.",
        variant: "destructive",
      });
    }
  };

  const handleSocialShare = (platform: string) => {
    const text = "Join me for quick 5-minute challenges on QuickBuddies!";
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(inviteLink)}`,
    };
    
    window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="challenge-card hand-drawn bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-kalam text-xl font-bold text-slate">
            Invite Friends
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="block text-sm font-semibold text-slate mb-2">
              Share Link
            </Label>
            <div className="flex">
              <Input 
                value={inviteLink}
                className="flex-1 hand-drawn bg-paper text-slate border-slate/20"
                readOnly
              />
              <Button
                className="btn-hand-drawn hand-drawn ml-2 bg-mint text-white hover:bg-mint/80"
                onClick={handleCopyLink}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="btn-hand-drawn hand-drawn p-3 text-white bg-blue-600 hover:bg-blue-700"
              onClick={() => handleSocialShare('facebook')}
            >
              <Facebook className="w-4 h-4 mr-2" />
              Facebook
            </Button>
            <Button
              className="btn-hand-drawn hand-drawn p-3 text-white bg-blue-400 hover:bg-blue-500"
              onClick={() => handleSocialShare('twitter')}
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
