
import React, { useState, useRef, useEffect } from 'react';
import { StudyLog, StudyPhase, QuestionTypes, TrackingConfig } from '../types';
import { Save, BookOpen, FileText, Info } from 'lucide-react';
import { Input, Select, Textarea, Button } from './ui/FormComponents';

interface LogEntryFormProps {
  onAddLog: (log: StudyLog) => void;
  currentPhase: StudyPhase;
  trackingConfig: TrackingConfig;
  onClose?: () => void;
  minDate?: string;
  maxDate?: string;
  initialData?: StudyLog;
}

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

export const LogEntryForm: React.FC<LogEntryFormProps> = ({ onAddLog, currentPhase, trackingConfig, onClose, minDate, maxDate, initialData }) => {
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

  // --- Initialize active module based on phase config if not editing ---
  useEffect(() => {
    if (initialData) return; // Skip if editing
    
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
  }, [currentPhase, trackingConfig, initialData]);

  // --- Populate form if editing (initialData present) ---
  useEffect(() => {
    if (initialData) {
      setDate(initialData.date.split('T')[0]);
      
      if (initialData.vocabData) {
        setActiveModule('vocab');
        setVLearned(initialData.vocabData.learned);
        setVForgotten(initialData.vocabData.forgotten);
        setVDuration(initialData.vocabData.duration);
      } else if (initialData.readingIntensiveData) {
        setActiveModule('reading');
        setRTitle(initialData.readingIntensiveData.articleTitle || '');
        setRUnknown(initialData.readingIntensiveData.unknownWordCount);
        setRChunks(initialData.readingIntensiveData.chunkCount);
        setRDuration(initialData.readingIntensiveData.duration);
        setRNote(initialData.readingIntensiveData.noteContent || '');
        setRChunkImage(initialData.readingIntensiveData.chunkImageUrl);
        setRNoteImage(initialData.readingIntensiveData.noteImageUrl);
      } else if (initialData.corpusData) {
        setActiveModule('corpus');
        setCChapter(initialData.corpusData.chapter);
        setCSection(initialData.corpusData.section);
        setCRound(initialData.corpusData.round);
        setCTotal(initialData.corpusData.totalSentences);
        setCCorrect(initialData.corpusData.correctSentences);
      } else if (initialData.p2ListeningData) {
        setActiveModule('p2_listening');
        setP2LType(initialData.p2ListeningData.questionType);
        setP2LTotal(initialData.p2ListeningData.totalCount);
        setP2LCorrect(initialData.p2ListeningData.correctCount);
      } else if (initialData.p2ReadingData) {
        setActiveModule('p2_reading');
        setP2RType(initialData.p2ReadingData.questionType);
        setP2RTotal(initialData.p2ReadingData.totalCount);
        setP2RCorrect(initialData.p2ReadingData.correctCount);
      } else if (initialData.p2WritingData) {
        setActiveModule('p2_writing');
        setP2WTask(initialData.p2WritingData.taskType);
        setP2WTopic(initialData.p2WritingData.topicType);
        setP2WScore(initialData.p2WritingData.score);
      } else if (initialData.p2SpeakingData) {
        setActiveModule('p2_speaking');
        setP2SPart(initialData.p2SpeakingData.part);
        setP2STopic(initialData.p2SpeakingData.topic);
        setP2SScore(initialData.p2SpeakingData.score);
      } else if (initialData.mockData) {
        setActiveModule('mock');
        setMBook(initialData.mockData.book);
        setMTest(initialData.mockData.test);
        setMLScore(initialData.mockData.listeningScore);
        setMRScore(initialData.mockData.readingScore);
        setMWScore(initialData.mockData.writingScore);
        setMSScore(initialData.mockData.speakingScore);
      }
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const log: StudyLog = {
      id: initialData ? initialData.id : Date.now().toString(), // Use existing ID if editing
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
      log.p2SpeakingData = { part: p2SPart, topic: p2STopic || '未分类', score: Number(p2SScore) };
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
      <div className="space-y-4">
        <Input 
            type="date" 
            label="记录日期"
            value={date} 
            min={minDate}
            max={maxDate}
            onChange={e => setDate(e.target.value)} 
        />
        
        {/* Only show tabs if not editing, OR allow changing type even when editing but usually editing implies same type */}
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

      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-6">
        {activeModule === 'vocab' && (
        <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
                <Input label="今日背诵" type="number" value={vLearned} onChange={e => setVLearned(Number(e.target.value))} />
                <Input label="今日遗忘" type="number" value={vForgotten} onChange={e => setVForgotten(Number(e.target.value))} className="text-red-600" />
            </div>
            <Input label="时长(min)" type="number" value={vDuration} onChange={e => setVDuration(Number(e.target.value))} />
        </div>
        )}

        {activeModule === 'reading' && (
        <div className="space-y-4 animate-fade-in">
            <Input label="文章标题" value={rTitle} onChange={e => setRTitle(e.target.value)} placeholder="例如：剑14 Test1 Passage2" />
            <div className="grid grid-cols-3 gap-3">
                <Input label="生词" type="number" value={rUnknown} onChange={e => setRUnknown(Number(e.target.value))} />
                <Input label="语块" type="number" value={rChunks} onChange={e => setRChunks(Number(e.target.value))} />
                <Input label="时长" type="number" value={rDuration} onChange={e => setRDuration(Number(e.target.value))} />
            </div>
            <Textarea label="笔记摘要" rows={3} value={rNote} onChange={e => setRNote(e.target.value)} placeholder="记录今天的核心感悟..." />
            
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
                <Select 
                    label="章" 
                    value={cChapter} 
                    onChange={e => setCChapter(e.target.value)} 
                    options={['3', '4', '5', '11'].map(c => ({ value: c, label: c }))} 
                />
                <Input label="节" type="number" value={cSection} onChange={e => setCSection(e.target.value)} />
                <Input label="轮" type="number" value={cRound} onChange={e => setCRound(Number(e.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="听写句数" type="number" value={cTotal} onChange={e => setCTotal(Number(e.target.value))} />
                <Input label="正确句数" type="number" value={cCorrect} onChange={e => setCCorrect(Number(e.target.value))} />
            </div>
        </div>
        )}

        {(activeModule.startsWith('p2_') || activeModule === 'mock') && (
            <div className="space-y-4 animate-fade-in">
                {activeModule === 'p2_listening' && (
                    <>
                        <Select label="题型" value={p2LType} onChange={e => setP2LType(e.target.value)} options={QuestionTypes.LISTENING.map(t => ({value: t, label: t}))} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="总题" type="number" value={p2LTotal} onChange={e => setP2LTotal(Number(e.target.value))} />
                            <Input label="正确" type="number" value={p2LCorrect} onChange={e => setP2LCorrect(Number(e.target.value))} />
                        </div>
                    </>
                )}
                {activeModule === 'p2_reading' && (
                    <>
                        <Select label="题型" value={p2RType} onChange={e => setP2RType(e.target.value)} options={QuestionTypes.READING.map(t => ({value: t, label: t}))} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="总题" type="number" value={p2RTotal} onChange={e => setP2RTotal(Number(e.target.value))} />
                            <Input label="正确" type="number" value={p2RCorrect} onChange={e => setP2RCorrect(Number(e.target.value))} />
                        </div>
                    </>
                )}
                {activeModule === 'p2_writing' && (
                    <>
                        <div className="flex gap-2"><TabButton id="t1" label="Task 1" active={p2WTask === 'Task 1'} onClick={() => setP2WTask('Task 1')} /><TabButton id="t2" label="Task 2" active={p2WTask === 'Task 2'} onClick={() => setP2WTask('Task 2')} /></div>
                        <Select 
                            label="题材" 
                            value={p2WTopic} 
                            onChange={e => setP2WTopic(e.target.value)} 
                            options={(p2WTask === 'Task 1' ? QuestionTypes.WRITING_TASK1 : QuestionTypes.WRITING_TASK2).map(t => ({value: t, label: t}))}
                        />
                        <Input label="得分" type="number" step="0.5" value={p2WScore} onChange={e => setP2WScore(Number(e.target.value))} />
                    </>
                )}
                {activeModule === 'p2_speaking' && (
                    <>
                        <Select label="Part" value={p2SPart} onChange={e => setP2SPart(e.target.value as any)} options={QuestionTypes.SPEAKING_PART.map(p => ({value: p, label: p}))} />
                        <Input 
                            label={p2SPart === 'Part 1' ? "Pool/Topic (可选)" : "核心话题 (Core Topic)"}
                            value={p2STopic} 
                            onChange={e => setP2STopic(e.target.value)} 
                            placeholder={p2SPart === 'Part 1' ? "例如：Hometown / Work" : "例如：Describe a person who..."}
                        />
                        <p className="text-xs text-gray-400">
                            {p2SPart === 'Part 1' ? "Part 1 通常包含多个小话题，可填主要的一个。" : "Part 2/3 通常围绕同一核心话题展开，请保持话题名称一致以便统计。"}
                        </p>
                        <Input label="得分" type="number" step="0.5" value={p2SScore} onChange={e => setP2SScore(Number(e.target.value))} />
                    </>
                )}
                {activeModule === 'mock' && (
                     <>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="书号" value={mBook} onChange={e => setMBook(e.target.value)} />
                            <Input label="Test" value={mTest} onChange={e => setMTest(e.target.value)} />
                        </div>
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

      <Button type="submit" className="w-full text-lg font-bold" icon={<Save size={20} />}>
         {initialData ? '保存修改' : '确认提交'}
      </Button>
    </form>
  );
};
