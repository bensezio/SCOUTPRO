import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
}

interface PlayerDropdownProps {
  value?: string;
  onValueChange: (value: string, playerName: string) => void;
  placeholder?: string;
}

export function PlayerDropdown({ value, onValueChange, placeholder = "Select a player..." }: PlayerDropdownProps) {
  const { data: playersData, isLoading } = useQuery<{ players: Player[] }>({
    queryKey: ['/api/players'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/players');
      return response.json();
    },
  });

  const players = playersData?.players || [];

  const handleValueChange = (selectedValue: string) => {
    const selectedPlayer = players.find(p => p.id.toString() === selectedValue);
    if (selectedPlayer) {
      const playerName = `${selectedPlayer.firstName} ${selectedPlayer.lastName}`;
      onValueChange(selectedValue, playerName);
    }
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Loading players..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {players.map((player) => (
          <SelectItem key={player.id} value={player.id.toString()}>
            {player.firstName} {player.lastName} - {player.position}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}