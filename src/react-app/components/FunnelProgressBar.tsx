"use client";

import { default as React } from 'react'; // Removido importação explícita de React

interface FunnelProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function FunnelProgressBar({ currentStep, totalSteps }: FunnelProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full bg-gray-700 rounded-full h-2.5 mb-8">
      <div
        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
}