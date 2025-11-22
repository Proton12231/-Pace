
import React, { useState, useRef, useEffect } from 'react';
import { StudyLog, StudyPhase, QuestionTypes, TrackingConfig } from '../types';
import { Save, Upload, Clock, Image as ImageIcon, Info, Calendar, BookOpen, FileText } from 'lucide-react';

interface LogEntryFormProps {
  onAddLog: (log: StudyLog) => void;
  currentPhase: StudyPhase;
  trackingConfig: TrackingConfig;
  onClose?: () => void;
  minDate?: string;
  maxDate?: string;
}

// --- Static Components (Moved outside to fix focus loss bug) ---
const TabButton = ({ id, label, active, onClick }: { id: string, label: string, active: boolean, onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
      active 
        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
    }`}
  >
    {label}
  </button>
);

const InputGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
  <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {children}
  </div>
);

const NumberInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
      type="number" 
      {...props} 
      className={`block w-full rounded-xl border-gray-200 bg-gray-50 p-3 text-lg font-medium text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all ${props.className}`} 
    />
);

const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
      type="text" 
      {...props} 
      className="block w-full rounded-xl border-gray-200 bg-gray-50 p-3 text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all" 
    />
);

export const LogEntryForm: React.FC<LogEntryFormProps> = ({ onAddLog, currentPhase, trackingConfig, onClose, minDate, maxDate }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeModule, setActiveModule] = useState<string>('');
  
  const chunkInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  // --- Phase 1 States ---
  const [vLearned, setVLearned] = useState(0);
  const [vForgotten, setVForgotten] = useState(0);
  const [vDuration, setVDuration] = useState(30);

  const [rTitle, setRTitle] = useState('');
  const [rUnknown, setRUnknown] = useState(0);
  const [rChunks, setRChunks] = useState(0);
  const [rDuration, setRDuration] = useState(45);
  const [rNote, setRNote] = useState('');
  const [rChunkImage, setRChunkImage] = useState<string | undefined>(undefined);
  const [rNoteImage, setRNoteImage] = useState<string | undefined>(undefined);

  const [cChapter, setCChapter] = useState('3');
  const [cSection, setCSection] = useState('1');
  const [cRound, setCRound] = useState(1);
  const [cTotal, setCTotal] = useState(0);
  const [cCorrect, setCCorrect] = useState(0);

  // --- Phase 2 States ---
  const [p2LType, setP2LType] = useState(QuestionTypes.LISTENING[0]);
  const [p2LTotal, setP2LTotal] = useState(10);
  const [p2LCorrect, setP2LCorrect] = useState(0);

  const [p2RType, setP2RType] = useState(QuestionTypes.READING[0]);
  const [p2RTotal, setP2RTotal] = useState(10);
  const [p2RCorrect, setP2RCorrect] = useState(0);

  const [p2WTask, setP2WTask] = useState<'Task 1' | 'Task 2'>('Task 1');
  const [p2WTopic, setP2WTopic] = useState(QuestionTypes.WRITING_TASK1[0]);
  const [p2WScore, setP2WScore] = useState(6.0);

  const [p2SPart, setP2SPart] = useState<'Part 1' | 'Part 2' | 'Part 3'>('Part 1');
  const [p2STopic, setP2STopic] = useState('');
  const [p2SScore, setP2SScore] = useState(6.0);

  // --- Phase 3 States ---
  const [mBook, setMBook] = useState('剑17');
  const [mTest, setMTest] = useState('Test 1');
  const [mLScore, setMLScore] = useState(6.0);
  const [mRScore, setMRScore] = useState(6.0);
  const [mWScore, setMWScore] = useState(6.0);
  const [mSScore, setMSScore] = useState(6.0);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Init active module
  useEffect(() => {
    if (currentPhase === StudyPhase.PHASE_1) {
      if (trackingConfig.phase1.vocab) setActiveModule('vocab');
      else if (trackingConfig.phase1.reading) setActiveModule('reading');
      else if (trackingConfig.phase1.corpus) setActiveModule('corpus');
    } else if (currentPhase === StudyPhase.PHASE_2) {
      if (trackingConfig.phase2.listening) setActiveModule('p2_listening');
      else if (trackingConfig.phase2.reading) setActiveModule('p2_reading');
      else if (trackingConfig.phase2.writing) setActiveModule('p2_writing');
      else if (trackingConfig.phase2.speaking) setActiveModule('p2_speaking');
    } else {
      setActiveModule('mock');
    }
  }, [currentPhase, trackingConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const log: StudyLog = {
      id: Date.now().toString(),
      date: new Date(date).toISOString(),
      phase: currentPhase
    };

    if (activeModule === 'vocab') {
      log.vocabData = { learned: Number(vLearned), forgotten: Number(vForgotten), duration: Number(vDuration) };
    } else if (activeModule === 'reading') {
      log.readingIntensiveData = {
        articleTitle: rTitle,
        unknownWordCount: Number(rUnknown),
        chunkCount: Number(rChunks),
        duration: Number(rDuration),
        noteContent: rNote,
        chunkImageUrl: rChunkImage,
        noteImageUrl: rNoteImage
      };
    } else if (activeModule === 'corpus') {
      log.corpusData = {
        chapter: cChapter,
        section: cSection,
        round: Number(cRound),
        totalSentences: Number(cTotal),
        correctSentences: Number(cCorrect),
        accuracy: cTotal > 0 ? Math.round((Number(cCorrect) / Number(cTotal)) * 100) : 0
      };
    } else if (activeModule === 'p2_listening') {
      log.p2ListeningData = { questionType: p2LType, correctCount: Number(p2LCorrect), totalCount: Number(p2LTotal) };
    } else if (activeModule === 'p2_reading') {
      log.p2ReadingData = { questionType: p2RType, correctCount: Number(p2RCorrect), totalCount: Number(p2RTotal) };
    } else if (activeModule === 'p2_writing') {
      log.p2WritingData = { taskType: p2WTask, topicType: p2WTopic, score: Number(p2WScore) };
    } else if (activeModule === 'p2_speaking') {
      log.p2SpeakingData = { part: p2SPart, topic: p2STopic, score: Number(p2SScore) };
    } else if (activeModule === 'mock') {
      const avg = (Number(mLScore) + Number(mRScore) + Number(mWScore) + Number(mSScore)) / 4;
      let final = Math.round(avg * 4) / 4;
      const decimal = final % 1;
      if (decimal > 0 && decimal < 0.5) final = Math.floor(final) + 0.5;
      else if (decimal > 0.5) final = Math.ceil(final);

      log.mockData = {
        book: mBook, test: mTest,
        listeningScore: Number(mLScore), readingScore: Number(mRScore),
        writingScore: Number(mWScore), speakingScore: Number(mSScore),
        overallScore: final
      };
    }
    onAddLog(log);
    if (onClose) onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date & Module Selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
            <Calendar size={16} className="ml-2 text-gray-500"/>
            <input 
                type="date" 
                value={date} 
                min={minDate}
                max={maxDate}
                onChange={e => setDate(e.target.value)} 
                className="flex-1 bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0" 
            />
        </div>
        
        <div className="flex flex-wrap gap-2">
            {currentPhase === StudyPhase.PHASE_1 && (
            <>
                {trackingConfig.phase1.vocab && <TabButton id="vocab" label="📚 背单词" active={activeModule === 'vocab'} onClick={() => setActiveModule('vocab')} />}
                {trackingConfig.phase1.reading && <TabButton id="reading" label="🧐 阅读精读" active={activeModule === 'reading'} onClick={() => setActiveModule('reading')} />}
                {trackingConfig.phase1.corpus && <TabButton id="corpus" label="🎧 语料库" active={activeModule === 'corpus'} onClick={() => setActiveModule('corpus')} />}
            </>
            )}
            {currentPhase === StudyPhase.PHASE_2 && (
            <>
                {trackingConfig.phase2.listening && <TabButton id="p2_listening" label="👂 听力题型" active={activeModule === 'p2_listening'} onClick={() => setActiveModule('p2_listening')} />}
                {trackingConfig.phase2.reading && <TabButton id="p2_reading" label="📖 阅读题型" active={activeModule === 'p2_reading'} onClick={() => setActiveModule('p2_reading')} />}
                {trackingConfig.phase2.writing && <TabButton id="p2_writing" label="✍️ 写作专项" active={activeModule === 'p2_writing'} onClick={() => setActiveModule('p2_writing')} />}
                {trackingConfig.phase2.speaking && <TabButton id="p2_speaking" label="🗣️ 口语专项" active={activeModule === 'p2_speaking'} onClick={() => setActiveModule('p2_speaking')} />}
            </>
            )}
            {currentPhase === StudyPhase.PHASE_3 && <TabButton id="mock" label="🏆 全真模考" active={activeModule === 'mock'} onClick={() => setActiveModule('mock')} />}
        </div>
      </div>

      {/* --- Form Fields --- */}
      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-6">
        {activeModule === 'vocab' && (
        <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="今日背诵"><NumberInput value={vLearned} onChange={e => setVLearned(Number(e.target.value))} /></InputGroup>
                <InputGroup label="今日遗忘"><NumberInput value={vForgotten} onChange={e => setVForgotten(Number(e.target.value))} className="text-red-600" /></InputGroup>
            </div>
            <InputGroup label="时长(min)"><NumberInput value={vDuration} onChange={e => setVDuration(Number(e.target.value))} /></InputGroup>
        </div>
        )}

        {activeModule === 'reading' && (
        <div className="space-y-4 animate-fade-in">
            <InputGroup label="文章标题"><TextInput value={rTitle} onChange={e => setRTitle(e.target.value)} placeholder="例如：剑14 Test1 Passage2" /></InputGroup>
            <div className="grid grid-cols-3 gap-3">
                <InputGroup label="生词"><NumberInput value={rUnknown} onChange={e => setRUnknown(Number(e.target.value))} /></InputGroup>
                <InputGroup label="语块"><NumberInput value={rChunks} onChange={e => setRChunks(Number(e.target.value))} /></InputGroup>
                <InputGroup label="时长"><NumberInput value={rDuration} onChange={e => setRDuration(Number(e.target.value))} /></InputGroup>
            </div>
            <InputGroup label="笔记摘要"><textarea rows={3} value={rNote} onChange={e => setRNote(e.target.value)} className="block w-full rounded-xl border-gray-200 bg-gray-50 p-3 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all" placeholder="记录今天的核心感悟..." /></InputGroup>
            
            {/* Dual Image Upload */}
            <div className="grid grid-cols-2 gap-4">
                <div onClick={() => chunkInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all h-32 flex flex-col items-center justify-center relative overflow-hidden group">
                    <input type="file" hidden ref={chunkInputRef} accept="image/*" onChange={e => handleImageUpload(e, setRChunkImage)} />
                    {rChunkImage ? (
                        <>
                            <img src={rChunkImage} alt="Chunk" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1">语块截图</div>
                        </>
                    ) : (
                        <>
                            <BookOpen className="text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500 font-medium">上传语块截图</span>
                        </>
                    )}
                </div>

                <div onClick={() => noteInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all h-32 flex flex-col items-center justify-center relative overflow-hidden group">
                    <input type="file" hidden ref={noteInputRef} accept="image/*" onChange={e => handleImageUpload(e, setRNoteImage)} />
                    {rNoteImage ? (
                         <>
                            <img src={rNoteImage} alt="Note" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1">手帐/笔记</div>
                        </>
                    ) : (
                        <>
                            <FileText className="text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500 font-medium">上传精读手帐</span>
                        </>
                    )}
                </div>
            </div>
        </div>
        )}

        {activeModule === 'corpus' && (
        <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2 bg-yellow-50 p-2 rounded text-xs text-yellow-800"><Info size={14} /> 正确率 &lt; 90% 需重听</div>
            <div className="grid grid-cols-3 gap-3">
                <InputGroup label="章">
                    <select value={cChapter} onChange={e => setCChapter(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200">
                        {['3', '4', '5', '11'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </InputGroup>
                <InputGroup label="节"><NumberInput value={cSection} onChange={e => setCSection(e.target.value)} /></InputGroup>
                <InputGroup label="轮"><NumberInput value={cRound} onChange={e => setCRound(Number(e.target.value))} /></InputGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputGroup label="听写句数"><NumberInput value={cTotal} onChange={e => setCTotal(Number(e.target.value))} /></InputGroup>
                <InputGroup label="正确句数"><NumberInput value={cCorrect} onChange={e => setCCorrect(Number(e.target.value))} /></InputGroup>
            </div>
        </div>
        )}

        {/* Phase 2/3 Generic Wrappers */}
        {(activeModule.startsWith('p2_') || activeModule === 'mock') && (
            <div className="space-y-4 animate-fade-in">
                {activeModule === 'p2_listening' && (
                    <>
                        <InputGroup label="题型"><select value={p2LType} onChange={e => setP2LType(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200">{QuestionTypes.LISTENING.map(t => <option key={t} value={t}>{t}</option>)}</select></InputGroup>
                        <div className="grid grid-cols-2 gap-4"><InputGroup label="总题"><NumberInput value={p2LTotal} onChange={e => setP2LTotal(Number(e.target.value))} /></InputGroup><InputGroup label="正确"><NumberInput value={p2LCorrect} onChange={e => setP2LCorrect(Number(e.target.value))} /></InputGroup></div>
                    </>
                )}
                {activeModule === 'p2_reading' && (
                    <>
                        <InputGroup label="题型"><select value={p2RType} onChange={e => setP2RType(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200">{QuestionTypes.READING.map(t => <option key={t} value={t}>{t}</option>)}</select></InputGroup>
                        <div className="grid grid-cols-2 gap-4"><InputGroup label="总题"><NumberInput value={p2RTotal} onChange={e => setP2RTotal(Number(e.target.value))} /></InputGroup><InputGroup label="正确"><NumberInput value={p2RCorrect} onChange={e => setP2RCorrect(Number(e.target.value))} /></InputGroup></div>
                    </>
                )}
                {activeModule === 'p2_writing' && (
                    <>
                        <div className="flex gap-2"><TabButton id="t1" label="Task 1" active={p2WTask === 'Task 1'} onClick={() => setP2WTask('Task 1')} /><TabButton id="t2" label="Task 2" active={p2WTask === 'Task 2'} onClick={() => setP2WTask('Task 2')} /></div>
                        <InputGroup label="题材"><select value={p2WTopic} onChange={e => setP2WTopic(e.target.value)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200">{(p2WTask === 'Task 1' ? QuestionTypes.WRITING_TASK1 : QuestionTypes.WRITING_TASK2).map(t => <option key={t} value={t}>{t}</option>)}</select></InputGroup>
                        <InputGroup label="得分"><NumberInput step="0.5" value={p2WScore} onChange={e => setP2WScore(Number(e.target.value))} /></InputGroup>
                    </>
                )}
                {activeModule === 'p2_speaking' && (
                    <>
                        <InputGroup label="Part"><select value={p2SPart} onChange={e => setP2SPart(e.target.value as any)} className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200">{QuestionTypes.SPEAKING_PART.map(p => <option key={p} value={p}>{p}</option>)}</select></InputGroup>
                        <InputGroup label="话题"><TextInput value={p2STopic} onChange={e => setP2STopic(e.target.value)} /></InputGroup>
                        <InputGroup label="得分"><NumberInput step="0.5" value={p2SScore} onChange={e => setP2SScore(Number(e.target.value))} /></InputGroup>
                    </>
                )}
                {activeModule === 'mock' && (
                     <>
                        <div className="grid grid-cols-2 gap-4"><InputGroup label="书号"><TextInput value={mBook} onChange={e => setMBook(e.target.value)} /></InputGroup><InputGroup label="Test"><TextInput value={mTest} onChange={e => setMTest(e.target.value)} /></InputGroup></div>
                        <div className="grid grid-cols-4 gap-2">
                            {[{l:'L',v:mLScore,s:setMLScore},{l:'R',v:mRScore,s:setMRScore},{l:'W',v:mWScore,s:setMWScore},{l:'S',v:mSScore,s:setMSScore}].map(i => (
                                <div key={i.l}><label className="text-xs block text-center text-gray-500">{i.l}</label><input type="number" step="0.5" value={i.v} onChange={e => i.s(Number(e.target.value))} className="w-full p-2 bg-gray-50 border rounded-lg text-center" /></div>
                            ))}
                        </div>
                     </>
                )}
            </div>
        )}
      </div>

      <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
        <Save size={20} /> 确认提交
      </button>
    </form>
  );
};
