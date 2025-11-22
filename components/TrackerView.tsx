
import React, { useState, useMemo } from 'react';
import { StudyLog, StudyPhase, TrackingConfig } from '../types';
import { LogEntryForm } from './LogEntryForm';
import { Modal } from './ui/Modal';
import { Plus, Filter, Search, History, Calendar, X } from 'lucide-react';

interface TrackerViewProps {
  logs: StudyLog[];
  onAddLog: (log: StudyLog) => void;
  currentPhase: StudyPhase;
  trackingConfig: TrackingConfig;
  phaseDates: { phase1End: string; phase2End: string };
}

export const TrackerView: React.FC<TrackerViewProps> = ({ logs, onAddLog, currentPhase, trackingConfig, phaseDates }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewPhase, setViewPhase] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>(''); // Date filter state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- Filter Logs ---
  const displayedLogs = useMemo(() => {
    let filtered = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Filter by Phase
    if (viewPhase !== 'all') {
      filtered = filtered.filter(l => l.phase === viewPhase);
    }

    // Filter by Date
    if (filterDate) {
        filtered = filtered.filter(l => l.date.startsWith(filterDate));
    }

    return filtered;
  }, [logs, viewPhase, filterDate]);

  // --- Determine Date Constraints for Form ---
  const getDateConstraints = () => {
    const today = new Date().toISOString().split('T')[0];
    let min = undefined;
    let max = today;

    if (currentPhase === StudyPhase.PHASE_1) {
      max = phaseDates.phase1End < today ? phaseDates.phase1End : today;
    } else if (currentPhase === StudyPhase.PHASE_2) {
      min = phaseDates.phase1End; // Can start after P1
      max = phaseDates.phase2End < today ? phaseDates.phase2End : today;
    } else {
      min = phaseDates.phase2End;
    }
    return { min, max };
  };
  const { min, max } = getDateConstraints();

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
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
            {/* Phase Filter */}
            <div className="relative flex-1 xl:flex-none min-w-[140px]">
                <Filter size={14} className="absolute left-3 top-3 text-gray-400"/>
                <select 
                    value={viewPhase} 
                    onChange={e => setViewPhase(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-indigo-100 cursor-pointer text-gray-600 appearance-none"
                >
                    <option value="all">全部阶段</option>
                    {Object.values(StudyPhase).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>

            {/* Date Filter */}
            <div className="relative flex-1 xl:flex-none min-w-[140px]">
                <Calendar size={14} className="absolute left-3 top-3 text-gray-400"/>
                <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 bg-gray-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-indigo-100 text-gray-600"
                    placeholder="筛选日期"
                />
                {filterDate && (
                    <button 
                        onClick={() => setFilterDate('')}
                        className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Add Button */}
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all w-full sm:w-auto"
            >
                <Plus size={18} /> 新增记录
            </button>
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
           displayedLogs.map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all group">
                  <div className="flex items-start gap-4">
                      {/* Icon / Image Thumbnail Section */}
                      <div className="flex-shrink-0 flex gap-2">
                          {/* Case: Reading Intensive Images */}
                          {log.readingIntensiveData ? (
                            <div className="flex flex-col gap-1">
                                {log.readingIntensiveData.chunkImageUrl ? (
                                    <div 
                                        className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 cursor-pointer relative group/img"
                                        onClick={() => setSelectedImage(log.readingIntensiveData!.chunkImageUrl!)}
                                        title="查看语块截图"
                                    >
                                        <img src={log.readingIntensiveData.chunkImageUrl} className="w-full h-full object-cover" alt="Chunk" />
                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-white text-[8px] font-bold">语块</div>
                                    </div>
                                ) : null}
                                {log.readingIntensiveData.noteImageUrl ? (
                                    <div 
                                        className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 cursor-pointer relative group/img"
                                        onClick={() => setSelectedImage(log.readingIntensiveData!.noteImageUrl!)}
                                        title="查看手帐"
                                    >
                                        <img src={log.readingIntensiveData.noteImageUrl} className="w-full h-full object-cover" alt="Note" />
                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center text-white text-[8px] font-bold">手帐</div>
                                    </div>
                                ) : null}
                                {!log.readingIntensiveData.chunkImageUrl && !log.readingIntensiveData.noteImageUrl && (
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-indigo-100 text-indigo-600">
                                        阅
                                    </div>
                                )}
                            </div>
                          ) : (
                              /* Default Type Icons */
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                                  log.corpusData ? 'bg-amber-100 text-amber-600' :
                                  log.vocabData ? 'bg-blue-100 text-blue-600' : 
                                  log.mockData ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                              }`}>
                                  {log.corpusData ? '听' : log.vocabData ? '词' : log.mockData ? '考' : '习'}
                              </div>
                          )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                              <h4 className="font-bold text-gray-800 truncate pr-4">
                                  {log.readingIntensiveData?.articleTitle || 
                                   (log.corpusData ? `语料库 Chapter ${log.corpusData.chapter}` : 
                                   (log.p2WritingData ? `写作 ${log.p2WritingData.taskType}` : 
                                   log.phase.split('：')[0]))}
                              </h4>
                              <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(log.date).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="text-sm text-gray-600 mt-1 space-y-1">
                              {log.corpusData && (
                                  <div className="flex gap-3">
                                      <span>Ch{log.corpusData.chapter}-{log.corpusData.section} (R{log.corpusData.round})</span>
                                      <span className={`${log.corpusData.accuracy >= 90 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}`}>
                                          {log.corpusData.accuracy}% 正确
                                      </span>
                                  </div>
                              )}
                              {log.readingIntensiveData && (
                                  <div>
                                      <div className="flex gap-3 text-xs mb-1">
                                        <span>📚 生词: {log.readingIntensiveData.unknownWordCount}</span>
                                        <span>⏱️ {log.readingIntensiveData.duration}分</span>
                                      </div>
                                      {log.readingIntensiveData.noteContent && <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">"{log.readingIntensiveData.noteContent}"</p>}
                                  </div>
                              )}
                              {log.vocabData && (
                                  <div className="flex gap-3">
                                      <span className="text-green-600">+ {log.vocabData.learned} 新词</span>
                                      <span className="text-red-500">- {log.vocabData.forgotten} 遗忘</span>
                                  </div>
                              )}
                              {log.mockData && (
                                  <div className="flex gap-2 font-mono text-xs mt-1">
                                      <span className="bg-gray-100 px-1 rounded">L:{log.mockData.listeningScore}</span>
                                      <span className="bg-gray-100 px-1 rounded">R:{log.mockData.readingScore}</span>
                                      <span className="bg-gray-100 px-1 rounded">W:{log.mockData.writingScore}</span>
                                      <span className="bg-gray-100 px-1 rounded">S:{log.mockData.speakingScore}</span>
                                      <span className="bg-black text-white px-1 rounded font-bold">All:{log.mockData.overallScore}</span>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
           ))
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={`新增${currentPhase}记录`} maxWidth="lg">
          <LogEntryForm 
             onAddLog={onAddLog} 
             currentPhase={currentPhase} 
             trackingConfig={trackingConfig} 
             onClose={() => setIsAddModalOpen(false)}
             minDate={min}
             maxDate={max}
          />
      </Modal>

      <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} title="查看图片" maxWidth="2xl">
          {selectedImage && <img src={selectedImage} alt="Evidence" className="w-full h-auto rounded-lg" />}
      </Modal>
    </div>
  );
};
