'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Player, SortField, SortDirection, TableState } from '@/types/game';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LeaderboardProps {
  players: Player[];
  tableState: TableState;
  onTableStateChange: (state: TableState) => void;
  currentPlayerId: string;
  targetLength: number;
  isPending?: boolean;
}

function SortableHeader({ 
  field, 
  children, 
  currentSortField, 
  currentSortDirection, 
  onSort 
}: { 
  field: SortField; 
  children: React.ReactNode;
  currentSortField: SortField;
  currentSortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) {
  const getSortIndicator = () => {
    if (currentSortField !== field) return null;
    return currentSortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => onSort(field)}
        className="h-8 font-bold"
      >
        {children}{getSortIndicator()}
      </Button>
    </TableHead>
  );
}

export function Leaderboard({ players, tableState, onTableStateChange, currentPlayerId, targetLength, isPending }: LeaderboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (field: SortField) => {
    const newDirection: SortDirection = 
      tableState.sortField === field && tableState.sortDirection === 'desc' 
        ? 'asc' 
        : 'desc';
    
    const newState: TableState = { ...tableState, sortField: field, sortDirection: newDirection };
    onTableStateChange(newState);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', `${field}-${newDirection}`);
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const newState = { ...tableState, page: newPage };
    onTableStateChange(newState);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePageSizeChange = (newSize: number) => {
    const newState = { ...tableState, pageSize: newSize, page: 1 };
    onTableStateChange(newState);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('pageSize', newSize.toString());
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const totalPages = Math.ceil(players.length / tableState.pageSize);
  const startIndex = (tableState.page - 1) * tableState.pageSize;
  const endIndex = Math.min(startIndex + tableState.pageSize, players.length);
  const currentPlayers = players.slice(startIndex, endIndex);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Leaderboard</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rows:</span>
            <select
              value={tableState.pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isPending && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4 text-sm text-orange-700">
            You joined mid-round. You will be added to the leaderboard in the next round.
          </div>
        )}
        {players.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No players yet. Join the game!</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="name" currentSortField={tableState.sortField} currentSortDirection={tableState.sortDirection} onSort={handleSort}>Player</SortableHeader>
                  <SortableHeader field="progress" currentSortField={tableState.sortField} currentSortDirection={tableState.sortDirection} onSort={handleSort}>Progress</SortableHeader>
                  <SortableHeader field="wpm" currentSortField={tableState.sortField} currentSortDirection={tableState.sortDirection} onSort={handleSort}>WPM</SortableHeader>
                  <SortableHeader field="accuracy" currentSortField={tableState.sortField} currentSortDirection={tableState.sortDirection} onSort={handleSort}>Accuracy</SortableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPlayers.map((player) => (
                  <TableRow 
                    key={player.id}
                    className={player.id === currentPlayerId ? 'bg-blue-50' : ''}
                  >
                    <TableCell className="font-medium">
                      {player.name}
                      {player.id === currentPlayerId && ' (You)'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${player.finished ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min((player.currentText.length / targetLength) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">{player.currentText.length}/{targetLength}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-lg">{player.wpm}</TableCell>
                    <TableCell>{(player.accuracy * 100).toFixed(0)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(tableState.page - 1)}
                  disabled={tableState.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {tableState.page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(tableState.page + 1)}
                  disabled={tableState.page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
