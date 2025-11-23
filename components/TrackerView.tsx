
import React, { useState, useMemo } from 'react';
import { StudyLog, StudyPhase, TrackingConfig } from '../types';
import { LogEntryForm } from './LogEntryForm';
import { Modal } from './ui/Modal';
import { Plus, Filter, Search, History, X, BookOpen, Mic, PenTool, Headphones, Edit2, Trash2 } from 'lucide-react';
import { Select, Input, Button } from './ui/FormComponents';

interface TrackerViewProps {
  logs: StudyLog[];
  onAddLog: (log: StudyLog) => void;
  onUpdateLog: (log: StudyLog) => void;
  onDeleteLog: (logId: string) => void;
  currentPhase: StudyPhase;
  trackingConfig: TrackingConfig;
  phaseDates: { phase1End: string; phase2End: string };
}

export const TrackerView: React.FC<TrackerViewProps> = ({ logs, onAddLog, onUpdateLog, onDeleteLog, currentPhase, trackingConfig, phaseDates }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<StudyLog | null>(null);
  const [viewPhase, setViewPhase] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- Filter Logs ---
  const displayedLogs = useMemo(() => {
    let filtered = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (viewPhase !== 'all') {
      filtered = filtered.filter(l => l.phase === viewPhase);
    }

    if (filterDate) {
        filtered = filtered.filter(l => l.date.startsWith(filterDate));
    }

    return filtered;
  }, [logs, viewPhase, filterDate]);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
          onDeleteLog(id);
  };

  const handleEditClick = (log: StudyLog, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingLog(log);
  };

  const handleFormSubmit = (log: StudyLog) => {
      if (editingLog) {
          onUpdateLog(log);
          setEditingLog(null);
      } else {
          onAddLog(log);
          setIsAddModalOpen(false);
      }
  };

  // --- Render Helpers ---
  const getLogDetails = (log: StudyLog) => {
      if (log.mockData) {
          return {
              icon: <div className="font-bold text-xs">MOCK</div>,
              color: 'bg-slate-800 text-white',
              title: `全真模考: ${log.mockData.book} ${log.mockData.test}`,
              stats: (
                <div className="flex gap-2 font-mono text-xs mt-1">
                     <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">L:{log.mockData.listeningScore}</span>
                     <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">R:{log.mockData.readingScore}</span>
                     <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">W:{log.mockData.writingScore}</span>
                     <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">S:{log.mockData.speakingScore}</span>
                     <span className="bg-slate-800 text-white px-1.5 py-0.5 rounded font-bold">总分:{log.mockData.overallScore}</span>
                </div>
              )
          };
      }
      if (log.vocabData) {
          return {
              icon: <BookOpen size={20} />,
              color: 'bg-indigo-100 text-indigo-600',
              title: '背单词',
              stats: (
                  <div className="flex gap-3 text-sm mt-1">
                      <span className="text-green-600 font-medium">+ {log.vocabData.learned} 新词</span>
                      <span className="text-red-500 font-medium">- {log.vocabData.forgotten} 遗忘</span>
                      <span className="text-gray-400 text-xs mt-0.5">{log.vocabData.duration} min</span>
                  </div>
              )
          };
      }
      if (log.readingIntensiveData) {
          return {
              icon: <PenTool size={20} />,
              color: 'bg-emerald-100 text-emerald-600',
              title: `阅读精读: ${log.readingIntensiveData.articleTitle || '无标题'}`,
              stats: (
                  <div className="mt-1">
                    <div className="flex gap-3 text-sm text-gray-600">
                        <span>生词: {log.readingIntensiveData.unknownWordCount}</span>
                        <span>语块: {log.readingIntensiveData.chunkCount}</span>
                        <span>时长: {log.readingIntensiveData.duration} min</span>
                    </div>
                    {log.readingIntensiveData.noteContent && (
                        <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded mt-2 border border-gray-100">
                            "{log.readingIntensiveData.noteContent}"
                        </p>
                    )}
                  </div>
              )
          };
      }
      if (log.corpusData) {
          return {
              icon: <Headphones size={20} />,
              color: 'bg-amber-100 text-amber-600',
              title: `语料库: Chapter ${log.corpusData.chapter}-${log.corpusData.section}`,
              stats: (
                  <div className="flex gap-3 text-sm mt-1 items-center">
                      <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-xs font-medium">第 {log.corpusData.round} 轮</span>
                      <span className={`${log.corpusData.accuracy >= 90 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}`}>
                          {log.corpusData.accuracy}% 正确
                      </span>
                      <span className="text-gray-400 text-xs">({log.corpusData.correctSentences}/{log.corpusData.totalSentences})</span>
                  </div>
              )
          };
      }
      if (log.p2ListeningData) {
          return {
              icon: <Headphones size={20} />,
              color: 'bg-blue-100 text-blue-600',
              title: `听力题型: ${log.p2ListeningData.questionType}`,
              stats: (
                  <div className="flex gap-3 text-sm mt-1">
                      <span className="font-bold text-gray-700">正确率: {Math.round((log.p2ListeningData.correctCount / log.p2ListeningData.totalCount) * 100)}%</span>
                      <span className="text-gray-400 text-xs mt-0.5">({log.p2ListeningData.correctCount}/{log.p2ListeningData.totalCount})</span>
                  </div>
              )
          };
      }
      if (log.p2ReadingData) {
           return {
              icon: <BookOpen size={20} />,
              color: 'bg-teal-100 text-teal-600',
              title: `阅读题型: ${log.p2ReadingData.questionType}`,
              stats: (
                  <div className="flex gap-3 text-sm mt-1">
                      <span className="font-bold text-gray-700">正确率: {Math.round((log.p2ReadingData.correctCount / log.p2ReadingData.totalCount) * 100)}%</span>
                      <span className="text-gray-400 text-xs mt-0.5">({log.p2ReadingData.correctCount}/{log.p2ReadingData.totalCount})</span>
                  </div>
              )
          };
      }
      if (log.p2WritingData) {
           return {
              icon: <PenTool size={20} />,
              color: 'bg-purple-100 text-purple-600',
              title: `写作: ${log.p2WritingData.taskType}`,
              stats: (
                  <div className="flex flex-col gap-1 mt-1">
                       <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{log.p2WritingData.topicType}</span>
                            <span className="bg-purple-600 text-white px-2 py-0.5 rounded text-xs font-bold">{log.p2WritingData.score} 分</span>
                       </div>
                  </div>
              )
          };
      }
      if (log.p2SpeakingData) {
           return {
              icon: <Mic size={20} />,
              color: 'bg-rose-100 text-rose-600',
              title: `口语: ${log.p2SpeakingData.part}`,
              stats: (
                  <div className="flex flex-col gap-1 mt-1">
                       <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800 max-w-[200px] truncate" title={log.p2SpeakingData.topic}>{log.p2SpeakingData.topic}</span>
                            <span className="bg-rose-600 text-white px-2 py-0.5 rounded text-xs font-bold">{log.p2SpeakingData.score} 分</span>
                       </div>
                  </div>
              )
          };
      }

      return {
          icon: <Filter size={20} />,
          color: 'bg-gray-100 text-gray-600',
          title: '未知记录',
          stats: null
      };
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <History className="text-indigo-600" /> 学习记录档案
           </h2>
           <p className="text-gray-500 text-sm mt-1">记录每一次进步，复盘每一个脚印。</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto items-end">
            {/* Phase Filter */}
            <div className="flex-1 xl:flex-none min-w-[140px]">
                <Select 
                    value={viewPhase}
                    onChange={e => setViewPhase(e.target.value)}
                    options={[
                        { value: 'all', label: '全部阶段' },
                        ...Object.values(StudyPhase).map(p => ({ value: p, label: p }))
                    ]}
                />
            </div>

            {/* Date Filter */}
            <div className="relative flex-1 xl:flex-none min-w-[140px]">
                <Input 
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className={filterDate ? 'pr-8' : ''}
                />
                {filterDate && (
                    <button 
                        onClick={() => setFilterDate('')}
                        className="absolute right-3 top-[13px] text-gray-400 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Add Button */}
            <Button 
                onClick={() => setIsAddModalOpen(true)}
                icon={<Plus size={18} />}
                className="w-full sm:w-auto"
            >
                新增记录
            </Button>
        </div>
      </div>

      {/* Log List */}
      <div className="space-y-4">
        {displayedLogs.length === 0 ? (
           <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Search size={32} />
              </div>
              <p className="text-gray-500">暂无符合条件的记录</p>
              {viewPhase === 'all' && !filterDate && <p className="text-xs text-gray-400 mt-1">点击右上角“新增记录”开始追踪</p>}
           </div>
        ) : (
           displayedLogs.map(log => {
              const details = getLogDetails(log);
              return (
                <div key={log.id} className="relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all group">
                    <div className="flex items-start gap-4 pr-16"> {/* Add padding right for buttons */}
                        {/* Icon / Image Thumbnail Section */}
                        <div className="flex-shrink-0 flex flex-col gap-2">
                            {log.readingIntensiveData?.chunkImageUrl || log.readingIntensiveData?.noteImageUrl ? (
                                <div className="flex flex-col gap-1">
                                    {log.readingIntensiveData.chunkImageUrl && (
                                        <div 
                                            className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 cursor-pointer relative group/img"
                                            onClick={() => setSelectedImage(log.readingIntensiveData!.chunkImageUrl!)}
                                        >
                                            <img src={log.readingIntensiveData.chunkImageUrl} className="w-full h-full object-cover" alt="Chunk" />
                                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-white text-[8px] font-bold">语块</div>
                                        </div>
                                    )}
                                    {log.readingIntensiveData.noteImageUrl && (
                                        <div 
                                            className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 cursor-pointer relative group/img"
                                            onClick={() => setSelectedImage(log.readingIntensiveData!.noteImageUrl!)}
                                        >
                                            <img src={log.readingIntensiveData.noteImageUrl} className="w-full h-full object-cover" alt="Note" />
                                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-white text-[8px] font-bold">手帐</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${details.color}`}>
                                    {details.icon}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-800 truncate pr-4">{details.title}</h4>
                                <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(log.date).toLocaleDateString()}</span>
                            </div>
                            
                            {details.stats}
                        </div>
                    </div>

                    {/* Actions - Absolute positioned */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={(e) => handleEditClick(log, e)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="编辑"
                         >
                            <Edit2 size={16} />
                         </button>
                         <button 
                            onClick={(e) => handleDeleteClick(log.id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                         >
                            <Trash2 size={16} />
                         </button>
                    </div>
                </div>
              );
           })
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isAddModalOpen || !!editingLog} onClose={() => { setIsAddModalOpen(false); setEditingLog(null); }} title={editingLog ? "编辑记录" : `新增${currentPhase}记录`} maxWidth="lg">
          <LogEntryForm 
             initialData={editingLog || undefined}
             onAddLog={handleFormSubmit} 
             currentPhase={currentPhase} 
             trackingConfig={trackingConfig} 
             onClose={() => { setIsAddModalOpen(false); setEditingLog(null); }}
          />
      </Modal>

      <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} title="查看图片" maxWidth="2xl">
          {selectedImage && <img src={selectedImage} alt="Evidence" className="w-full h-auto rounded-lg" />}
      </Modal>
    </div>
  );
};
