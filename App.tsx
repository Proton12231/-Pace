
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { CountdownWidget } from './components/CountdownWidget';
import { TodoList } from './components/TodoList';
import { TrackerView } from './components/TrackerView';
import { Charts } from './components/Charts';
import { StudyPhase, GoalConfig, StudyLog, TodoItem } from './types';
import { analyzeStudyProgress } from './services/geminiService';
import { BrainCircuit, Settings as SettingsIcon, Info, Calendar } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Init Goals with Tracking Config
  const [goals, setGoals] = useState<GoalConfig>(() => {
    const saved = localStorage.getItem('ielts_goals_v3');
    const defaultGoals = {
      targetScore: 7.0,
      targetSubScores: { listening: 7.5, reading: 7.5, writing: 6.5, speaking: 6.5 },
      examDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months later
      currentPhase: StudyPhase.PHASE_1,
      tracking: {
        phase1: { vocab: true, reading: true, corpus: true },
        phase2: { listening: true, reading: true, writing: true, speaking: true }
      },
      phaseDates: {
        phase1End: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        phase2End: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    };
    return saved ? { ...defaultGoals, ...JSON.parse(saved) } : defaultGoals;
  });

  const [logs, setLogs] = useState<StudyLog[]>(() => {
    const saved = localStorage.getItem('ielts_logs_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem('ielts_todos_v3');
    return saved ? JSON.parse(saved) : [];
  });

  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => { localStorage.setItem('ielts_goals_v3', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem('ielts_logs_v3', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('ielts_todos_v3', JSON.stringify(todos)); }, [todos]);

  const addLog = (log: StudyLog) => {
    setLogs([log, ...logs]);
  };

  const handleGetAdvice = async () => {
    setLoadingAi(true);
    const result = await analyzeStudyProgress(goals, logs, goals.currentPhase);
    setAiAdvice(result.text);
    setLoadingAi(false);
  };

  const getPhaseStrategyText = (phase: StudyPhase) => {
    switch (phase) {
      case StudyPhase.PHASE_1:
        return (
          <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-3">
                 <Info className="text-indigo-200" /> {phase} 核心策略
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base bg-indigo-700/30 p-4 rounded-xl border border-indigo-500/30">
                 <div>
                    <span className="font-bold text-indigo-200 block mb-1">📖 语料库听写</span>
                    <p>重点攻克3/4/5/11章。每天一节，<span className="text-yellow-300 font-bold">正确率 &lt; 90% 必须重听</span>，直到达标。</p>
                 </div>
                 <div>
                    <span className="font-bold text-indigo-200 block mb-1">🧐 阅读精读</span>
                    <p>每天一篇贝壳阅读。必须产出<span className="text-yellow-300 font-bold">生词本</span>和<span className="text-yellow-300 font-bold">同义替换表</span>。</p>
                 </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          </div>
        );
      case StudyPhase.PHASE_2:
        return (
            <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg mb-6">
               <h2 className="text-xl font-bold flex items-center gap-2 mb-3">
                 <Info className="text-blue-200" /> {phase} 题型突破
              </h2>
              <ul className="list-disc list-inside space-y-1 text-blue-50">
                  <li>听力：专项练习地图题方位词、选择题干扰项排除。</li>
                  <li>写作：小作文积累数据描述词，大作文积累逻辑链（审题为王）。</li>
                  <li>阅读：针对性训练 Heading 和 T/F/NG 题型技巧。</li>
              </ul>
            </div>
        );
      case StudyPhase.PHASE_3:
        return (
            <div className="bg-rose-600 text-white p-6 rounded-2xl shadow-lg mb-6">
               <h2 className="text-xl font-bold flex items-center gap-2 mb-3">
                 <Info className="text-rose-200" /> {phase} 全真冲刺
              </h2>
              <p className="text-rose-50">严格按照考试时间（9:00-12:00）进行全套模考。重点分析错题原因，而非仅仅关注分数。</p>
            </div>
        );
    }
  };

  const renderDashboard = () => (
    <div className="animate-fade-in">
       {/* 1. Top: Current Phase Strategy */}
       {getPhaseStrategyText(goals.currentPhase)}

       {/* 2. Countdown & Targets */}
       <CountdownWidget 
            examDate={goals.examDate} 
            targetScore={goals.targetScore} 
            subScores={goals.targetSubScores}
       />

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3. Left: Activity & AI (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* AI Advisor */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-400">
                        <BrainCircuit /> AI 备考助手
                    </h3>
                    <button 
                        onClick={handleGetAdvice}
                        disabled={loadingAi}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loadingAi ? <span className="animate-spin">⏳</span> : '✨'}
                        {loadingAi ? '深度分析中...' : '生成今日建议'}
                    </button>
                </div>
                {aiAdvice ? (
                    <div className="prose prose-invert prose-sm max-w-none bg-white/5 p-4 rounded-xl border border-white/10">
                        <div dangerouslySetInnerHTML={{ 
                            __html: aiAdvice.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-300">$1</strong>').replace(/\n/g, '<br/>') 
                        }} />
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm italic">
                        点击按钮，AI 将根据您的{goals.currentPhase}数据（如语料库正确率、写作分数趋势）提供个性化诊断。
                    </p>
                )}
              </div>

              {/* Recent Logs Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">近期动态</h3>
                    <button onClick={() => setActiveTab('tracker')} className="text-sm text-indigo-600 font-medium hover:underline">去记录</button>
                  </div>
                  <div className="space-y-3">
                      {logs.slice(0, 3).map(log => (
                          <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div>
                                  <p className="text-sm font-bold text-gray-800">
                                    {log.vocabData && `背单词`}
                                    {log.readingIntensiveData && `阅读精读`}
                                    {log.corpusData && `语料库 C${log.corpusData.chapter}`}
                                    {log.p2ListeningData && `听力-${log.p2ListeningData.questionType}`}
                                    {log.p2WritingData && `写作 ${log.p2WritingData.taskType}`}
                                    {log.mockData && `全真模考`}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">{new Date(log.date).toLocaleDateString('zh-CN')}</p>
                              </div>
                              <span className="text-sm font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                {log.corpusData && `${log.corpusData.accuracy}%`}
                                {log.mockData && `${log.mockData.overallScore}`}
                                {log.vocabData && `+${log.vocabData.learned}`}
                                {log.p2WritingData && `${log.p2WritingData.score}`}
                                {log.p2ListeningData && `${log.p2ListeningData.correctCount}/${log.p2ListeningData.totalCount}`}
                              </span>
                          </div>
                      ))}
                      {logs.length === 0 && <p className="text-gray-400 text-sm">暂无数据，开始您的第一次记录吧！</p>}
                  </div>
              </div>
          </div>

          {/* 4. Right: Todo Widget (1/3 width) */}
          <div className="lg:col-span-1">
             <TodoList 
                todos={todos} 
                setTodos={setTodos} 
                currentPhase={goals.currentPhase} 
                isWidget={true} 
             />
          </div>
       </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <SettingsIcon className="text-gray-400" /> 系统设置
        </h2>
        
        <div className="space-y-8">
            {/* Phase Selection */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">当前阶段</h3>
                <div className="space-y-2">
                    {Object.values(StudyPhase).map(phase => (
                        <label key={phase} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${goals.currentPhase === phase ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input 
                                type="radio" 
                                name="phase" 
                                className="text-indigo-600 focus:ring-indigo-500"
                                checked={goals.currentPhase === phase}
                                onChange={() => setGoals({...goals, currentPhase: phase})}
                            />
                            <span className="ml-3 font-medium text-gray-900">{phase}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Phase Dates Configuration */}
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                   <Calendar size={14}/> 阶段规划
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">阶段一 结束日期</label>
                        <input 
                          type="date" 
                          value={goals.phaseDates?.phase1End || ''} 
                          onChange={e => setGoals({...goals, phaseDates: {...goals.phaseDates, phase1End: e.target.value}})} 
                          className="w-full p-2 border rounded-lg text-sm" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">阶段二 结束日期</label>
                        <input 
                          type="date" 
                          value={goals.phaseDates?.phase2End || ''} 
                          onChange={e => setGoals({...goals, phaseDates: {...goals.phaseDates, phase2End: e.target.value}})} 
                          className="w-full p-2 border rounded-lg text-sm" 
                        />
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">* 日期设置将影响记录表单的日期选择范围。</p>
            </div>

            {/* Targets */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">目标设定</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                   <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">总分目标</label>
                        <input type="number" step="0.5" value={goals.targetScore} onChange={e => setGoals({...goals, targetScore: Number(e.target.value)})} className="w-full p-2 border rounded-lg" />
                   </div>
                   <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">考试日期</label>
                        <input type="date" value={goals.examDate.split('T')[0]} onChange={e => setGoals({...goals, examDate: new Date(e.target.value).toISOString()})} className="w-full p-2 border rounded-lg" />
                   </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {(['listening', 'reading', 'writing', 'speaking'] as const).map(sub => (
                        <div key={sub}>
                            <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{sub}</label>
                            <input type="number" step="0.5" value={goals.targetSubScores[sub]} onChange={e => setGoals({...goals, targetSubScores: {...goals.targetSubScores, [sub]: Number(e.target.value)}})} className="w-full p-2 border rounded-lg text-center" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Module Toggles */}
            <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">功能开关 (自定义当前阶段)</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    {goals.currentPhase === StudyPhase.PHASE_1 && (
                        <>
                           <label className="flex items-center gap-2 p-3 border rounded-lg"><input type="checkbox" checked={goals.tracking.phase1.vocab} onChange={e => setGoals({...goals, tracking: {...goals.tracking, phase1: {...goals.tracking.phase1, vocab: e.target.checked}}})} /> 背单词</label>
                           <label className="flex items-center gap-2 p-3 border rounded-lg"><input type="checkbox" checked={goals.tracking.phase1.reading} onChange={e => setGoals({...goals, tracking: {...goals.tracking, phase1: {...goals.tracking.phase1, reading: e.target.checked}}})} /> 阅读精读</label>
                           <label className="flex items-center gap-2 p-3 border rounded-lg"><input type="checkbox" checked={goals.tracking.phase1.corpus} onChange={e => setGoals({...goals, tracking: {...goals.tracking, phase1: {...goals.tracking.phase1, corpus: e.target.checked}}})} /> 语料库</label>
                        </>
                    )}
                     {goals.currentPhase === StudyPhase.PHASE_2 && (
                        <>
                           <label className="flex items-center gap-2 p-3 border rounded-lg"><input type="checkbox" checked={goals.tracking.phase2.listening} onChange={e => setGoals({...goals, tracking: {...goals.tracking, phase2: {...goals.tracking.phase2, listening: e.target.checked}}})} /> 听力题型</label>
                           <label className="flex items-center gap-2 p-3 border rounded-lg"><input type="checkbox" checked={goals.tracking.phase2.reading} onChange={e => setGoals({...goals, tracking: {...goals.tracking, phase2: {...goals.tracking.phase2, reading: e.target.checked}}})} /> 阅读题型</label>
                           <label className="flex items-center gap-2 p-3 border rounded-lg"><input type="checkbox" checked={goals.tracking.phase2.writing} onChange={e => setGoals({...goals, tracking: {...goals.tracking, phase2: {...goals.tracking.phase2, writing: e.target.checked}}})} /> 写作专项</label>
                           <label className="flex items-center gap-2 p-3 border rounded-lg"><input type="checkbox" checked={goals.tracking.phase2.speaking} onChange={e => setGoals({...goals, tracking: {...goals.tracking, phase2: {...goals.tracking.phase2, speaking: e.target.checked}}})} /> 口语专项</label>
                        </>
                    )}
                    {goals.currentPhase === StudyPhase.PHASE_3 && <p className="text-gray-500 col-span-2 bg-gray-50 p-2 rounded">全真模考阶段自动启用所有追踪项。</p>}
                </div>
            </div>
        </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'tracker': return (
        <TrackerView 
          logs={logs} 
          onAddLog={addLog} 
          currentPhase={goals.currentPhase} 
          trackingConfig={goals.tracking}
          phaseDates={goals.phaseDates || { phase1End: '', phase2End: '' }} // Fallback if old state
        />
      );
      case 'todos': return <TodoList todos={todos} setTodos={setTodos} currentPhase={goals.currentPhase} isWidget={false} />;
      case 'analytics': return <Charts logs={logs} currentPhase={goals.currentPhase} />;
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
