"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const QUESTIONS = [
  {
    id: 'learningStyle',
    question: 'How do you learn best?',
    type: 'radio',
    options: [
      { value: 'visual', label: '👁️ Visual - I prefer videos, diagrams, and visual guides' },
      { value: 'auditory', label: '🎧 Auditory - I learn through listening and discussion' },
      { value: 'kinesthetic', label: '🎯 Kinesthetic - I learn by doing and practicing' }
    ]
  },
  {
    id: 'timeAvailable',
    question: 'How much time can you study daily?',
    type: 'radio',
    options: [
      { value: '30', label: '⏱️ 30 minutes' },
      { value: '60', label: '⏱️ 30-60 minutes' },
      { value: '120', label: '⏱️ 1-2 hours' },
      { value: '240', label: '⏱️ 2+ hours' }
    ]
  },
  {
    id: 'difficultyLevel',
    question: "What's your current skill level?",
    type: 'radio',
    options: [
      { value: 'beginner', label: '🌱 Beginner - Just starting out' },
      { value: 'intermediate', label: '📚 Intermediate - Have some experience' },
      { value: 'expert', label: '🚀 Advanced - Experienced learner' }
    ]
  },
  {
    id: 'preferredTime',
    question: 'When are you most focused?',
    type: 'radio',
    options: [
      { value: 'morning', label: '🌅 Morning (6-12 AM)' },
      { value: 'afternoon', label: '☀️ Afternoon (12-6 PM)' },
      { value: 'evening', label: '🌙 Evening (6-11 PM)' }
    ]
  },
  {
    id: 'focusChallenge',
    question: 'What challenges your focus most?',
    type: 'checkbox',
    options: [
      { value: 'distractions', label: '📱 Distractions (phone, notifications)' },
      { value: 'fatigue', label: '😴 Mental fatigue' },
      { value: 'motivation', label: '⚡ Lack of motivation' },
      { value: 'unclear', label: '🤔 Unclear goals' }
    ]
  },
  {
    id: 'breakPreference',
    question: 'How long should breaks be?',
    type: 'radio',
    options: [
      { value: '5', label: '☕ 5 minutes' },
      { value: '10', label: '🚶 10 minutes' },
      { value: '15', label: '🎮 15 minutes' }
    ]
  }
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const currentQuestion = QUESTIONS[step];

  const handleAnswer = (value: string) => {
    if (currentQuestion.type === 'checkbox') {
      const current = answers[currentQuestion.id] || [];
      const updated = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [currentQuestion.id]: updated });
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: value });
    }
  };

  const handleNext = async () => {
    if (step === QUESTIONS.length - 1) {
      setLoading(true);
      try {
        let currentUserId = localStorage.getItem('motivateai_user_id');
        if (!currentUserId) {
          currentUserId = `user_${Math.random().toString(36).substring(2, 15)}`;
          localStorage.setItem('motivateai_user_id', currentUserId);
        }

        await fetch(`/api/users/${currentUserId}/preferences`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answers),
        });

        router.push('/');
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
      setLoading(false);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const isAnswered = answers[currentQuestion.id] !== undefined && 
                     (Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id].length > 0 : true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to MotivateAI! 🚀</h1>
          <p className="text-purple-300">Let's personalize your learning experience</p>
          <div className="flex gap-1 mt-6 justify-center">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? 'bg-purple-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 shadow-2xl shadow-purple-900/50">
          <div className="mb-6 animate-slide-down" key={step}>
            <span className="text-sm font-bold tracking-wider text-purple-400 uppercase">
              Question {step + 1} of {QUESTIONS.length}
            </span>
            <h2 className="text-2xl font-bold text-white mt-2 leading-tight">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option) => {
              const isSelected = Array.isArray(answers[currentQuestion.id])
                ? answers[currentQuestion.id].includes(option.value)
                : answers[currentQuestion.id] === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    isSelected
                      ? 'bg-purple-600/20 border-purple-500 text-white transform scale-[1.02] shadow-lg shadow-purple-500/20'
                      : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-purple-500/50 hover:bg-slate-800'
                  }`}
                >
                  <input
                    type={currentQuestion.type === 'checkbox' ? 'checkbox' : 'radio'}
                    name={currentQuestion.id}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => handleAnswer(option.value)}
                    className="w-5 h-5 accent-purple-500 cursor-pointer"
                  />
                  <span className="text-[1.05rem] font-medium">{option.label}</span>
                </label>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="w-1/3 bg-slate-800 hover:bg-slate-700 disabled:opacity-0 text-white font-bold py-3 rounded-xl transition-all border border-slate-700"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={!isAnswered || loading}
              className={`flex-1 font-bold py-3 rounded-xl transition-all ${
                isAnswered
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30 transform hover:-translate-y-0.5'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {loading ? '⏳ Saving...' : step === QUESTIONS.length - 1 ? '✓ Complete Setup' : 'Next Question →'}
            </button>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-8 text-center">
          <p className="inline-block bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700 text-purple-300 text-sm">
            💡 We'll use your answers to personalize every session
          </p>
        </div>
      </div>
    </div>
  );
}
