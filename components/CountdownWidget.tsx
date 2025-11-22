
import React, { useMemo } from 'react';
import { Calendar, Clock, Target, Trophy } from 'lucide-react';

interface CountdownProps {
  examDate: string;
  targetScore: number;
  subScores: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
  };
}

export const CountdownWidget: React.FC<CountdownProps> = ({ examDate, targetScore, subScores }) => {
  const daysLeft = useMemo(() => {
    const end = new Date(examDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [examDate]);

  const getStatusColor = (days: number) => {
    if (days > 60) return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    if (days > 30) return 'bg-blue-50 text-blue-800 border-blue-100';
    if (days > 14) return 'bg-amber-50 text-amber-800 border-amber-100';
    return 'bg-rose-50 text-rose-800 border-rose-100';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
      {/* Countdown */}
      <div className={`md:col-span-3 p-5 rounded-2xl border flex flex-col justify-center items-center text-center ${getStatusColor(daysLeft)}`}>
        <Clock className="opacity-40 mb-2" size={28} />
        <p className="text-xs font-bold uppercase tracking-widest opacity-70">距离考试</p>
        <h2 className="text-4xl font-extrabold my-1">{daysLeft} <span className="text-lg font-medium">天</span></h2>
        <p className="text-xs font-medium opacity-80">{new Date(examDate).toLocaleDateString('zh-CN')}</p>
      </div>

      {/* Target Scores */}
      <div className="md:col-span-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-500 flex items-center gap-2">
                <Target size={16} /> 目标分数
            </h3>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">Target</span>
         </div>
         
         <div className="flex items-end justify-between gap-4">
            <div className="text-center flex-1 border-r border-gray-100 last:border-0">
                <span className="block text-gray-400 text-xs uppercase font-semibold mb-1">总分</span>
                <span className="block text-4xl font-extrabold text-indigo-600">{targetScore}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 flex-[2]">
                {[
                    { l: '听力', s: subScores.listening },
                    { l: '阅读', s: subScores.reading },
                    { l: '写作', s: subScores.writing },
                    { l: '口语', s: subScores.speaking }
                ].map((item) => (
                    <div key={item.l} className="text-center">
                        <span className="block text-gray-400 text-[10px] mb-1">{item.l}</span>
                        <span className="block text-xl font-bold text-gray-800">{item.s}</span>
                    </div>
                ))}
            </div>
         </div>
      </div>

      {/* Motivational or Static */}
      <div className="md:col-span-3 bg-gradient-to-br from-orange-400 to-pink-500 p-5 rounded-2xl shadow-md text-white flex flex-col justify-center items-center text-center">
         <Trophy size={28} className="mb-2 opacity-90" />
         <p className="text-sm font-medium opacity-90">当前目标</p>
         <p className="text-lg font-bold mt-1">屠鸭上岸</p>
         <p className="text-[10px] mt-2 opacity-75 bg-white/20 px-2 py-1 rounded">Every day counts</p>
      </div>
    </div>
  );
};
