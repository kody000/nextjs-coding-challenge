import { Card, CardContent } from '@/components/ui/card';

export function LoadingState() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-500">Connecting to game...</p>
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <Card className="w-full max-w-md mx-auto border-red-200">
      <CardContent className="pt-6 text-center">
        <p className="text-red-500 mb-4">Error: {message}</p>
        <p className="text-sm text-gray-500">Please refresh the page to try again.</p>
      </CardContent>
    </Card>
  );
}
