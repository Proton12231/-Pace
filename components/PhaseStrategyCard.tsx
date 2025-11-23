
import React, { useState } from 'react';
import { StudyPhase, PhaseStrategy } from '../types';
import { Info, Edit2, Save, X } from 'lucide-react';
import { Textarea, Input, Button } from './ui/FormComponents';

interface PhaseStrategyCardProps {
  phase: StudyPhase;
  strategy: PhaseStrategy;
  onUpdate: (newStrategy: PhaseStrategy) => void;
}

export const PhaseStrategyCard: React.FC<PhaseStrategyCardProps> = ({ phase, strategy, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(strategy.title);
  const [editDesc, setEditDesc] = useState(strategy.description);

  const themeClasses = {
    indigo: 'from-indigo-600 to-indigo-800 shadow-indigo-200',
    blue: 'from-blue-600 to-blue-800 shadow-blue-200',
    rose: 'from-rose-600 to-rose-800 shadow-rose-200',
  };

  const currentTheme = themeClasses[strategy.colorTheme] || themeClasses.indigo;

  const handleSave = () => {
    onUpdate({
      ...strategy,
      title: editTitle,
      description: editDesc
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 border border-gray-200 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Edit2 size={18} className="text-indigo-600"/> 编辑阶段策略
            </h3>
            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <div className="space-y-4">
            <Input label="策略标题" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            <Textarea label="策略详情 (支持 HTML 标签)" rows={5} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setIsEditing(false)}>取消</Button>
                <Button variant="primary" onClick={handleSave} icon={<Save size={16} />}>保存</Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${currentTheme} text-white p-6 rounded-2xl shadow-lg mb-6 relative overflow-hidden group`}>
        <div className="relative z-10">
            <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-3">
                    <Info className="opacity-80" /> {phase} <span className="opacity-75 text-sm font-normal">| {strategy.title}</span>
                </h2>
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                    title="编辑策略内容"
                >
                    <Edit2 size={16} />
                </button>
            </div>
            
            <div className="bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <div 
                    className="prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: strategy.description }} 
                />
            </div>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black opacity-10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none"></div>
    </div>
  );
};
