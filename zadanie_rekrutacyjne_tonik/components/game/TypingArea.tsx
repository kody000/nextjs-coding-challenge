'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface TypingAreaProps {
  targetText: string;
  currentText: string;
  onChange: (text: string) => void;
  disabled: boolean;
  timeLeft: number;
  isFinished: boolean;
}

export function TypingArea({ targetText, currentText, onChange, disabled, timeLeft, isFinished }: TypingAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled, timeLeft]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= targetText.length) {
      onChange(value);
    }
  };

  const renderedText = useMemo(() => {
    return targetText.split('').map((char, index) => {
      let className = 'text-gray-400';
      
      if (index < currentText.length) {
        className = currentText[index] === char ? 'text-green-600' : 'text-red-500';
      } else if (index === currentText.length && !isFinished) {
        className = 'border-l-2 border-blue-500 animate-pulse';
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  }, [targetText, currentText, isFinished]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Type the sentence</CardTitle>
          <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-600'}`}>
            {timeLeft}s
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-lg font-mono leading-relaxed p-4 bg-gray-50 rounded-lg min-h-[80px]">
          {renderedText}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="typing-input">Your input</Label>
          <Input
            ref={inputRef}
            id="typing-input"
            value={currentText}
            onChange={handleChange}
            disabled={disabled || isFinished}
            placeholder={disabled || isFinished ? (isFinished ? "Finished! Wait for next round..." : "Wait for next round...") : "Start typing..."}
            className="font-mono text-lg"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </div>
        
        <div className="text-sm text-gray-500">
          {isFinished ? (
            <span className="text-green-600 font-medium">Completed! Waiting for round...</span>
          ) : (
            <span>Progress: {currentText.length} / {targetText.length} characters</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
