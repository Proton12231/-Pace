import React, { useState, useEffect, useRef } from "react";
import { Layout } from "./components/Layout";
import { CountdownWidget } from "./components/CountdownWidget";
import { TodoList } from "./components/TodoList";
import { TrackerView } from "./components/TrackerView";
import { Charts } from "./components/Charts";
import { PhaseStrategyCard } from "./components/PhaseStrategyCard";
import {
  StudyPhase,
  GoalConfig,
  StudyLog,
  TodoItem,
  PhaseStrategy,
} from "./types";
import { analyzeStudyProgress } from "./services/geminiService";
import { BrainCircuit, Settings as SettingsIcon, Calendar } from "lucide-react";
import { Input, Button } from "./components/ui/FormComponents";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Init Goals with Tracking Config
  const [goals, setGoals] = useState<GoalConfig>(() => {
    const saved = localStorage.getItem("ielts_goals_v3");
    const defaultGoals = {
      targetScore: 7.0,
      targetSubScores: {
        listening: 7.5,
        reading: 7.5,
        writing: 6.5,
        speaking: 6.5,
      },
      examDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months later
      currentPhase: StudyPhase.PHASE_1,
      tracking: {
        phase1: { vocab: true, reading: true, corpus: true },
        phase2: {
          listening: true,
          reading: true,
          writing: true,
          speaking: true,
        },
      },
      phaseDates: {
        phase1End: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        phase2End: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
    };
    return saved ? { ...defaultGoals, ...JSON.parse(saved) } : defaultGoals;
  });

  const [logs, setLogs] = useState<StudyLog[]>(() => {
    const saved = localStorage.getItem("ielts_logs_v3");
    return saved ? JSON.parse(saved) : [];
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem("ielts_todos_v3");
    return saved ? JSON.parse(saved) : [];
  });

  // Phase Strategies State
  const [phaseStrategies, setPhaseStrategies] = useState<
    Record<StudyPhase, PhaseStrategy>
  >(() => {
    const saved = localStorage.getItem("ielts_strategies_v3");
    const defaultStrategies: Record<StudyPhase, PhaseStrategy> = {
      [StudyPhase.PHASE_1]: {
        title: "基础夯实",
        description: `
          <ul class="list-disc list-inside space-y-2">
            <li><strong>语料库听写</strong>: 重点攻克3/4/5/11章。每天一节，<span class="text-yellow-300 font-bold">正确率 &lt; 90% 必须重听</span>。</li>
            <li><strong>阅读精读</strong>: 每天一篇贝壳阅读/剑桥真题。必须产出<span class="text-yellow-300 font-bold">生词本</span>和<span class="text-yellow-300 font-bold">同义替换表</span>。</li>
            <li><strong>单词</strong>: 每天保持200词的输入量，注重发音。</li>
          </ul>
        `,
        colorTheme: "indigo",
      },
      [StudyPhase.PHASE_2]: {
        title: "技巧突破",
        description: `
          <ul class="list-disc list-inside space-y-2">
            <li><strong>听力</strong>: 专项练习地图题方位词、选择题干扰项排除。</li>
            <li><strong>写作</strong>: 小作文积累数据描述词，大作文积累逻辑链（审题为王）。</li>
            <li><strong>阅读</strong>: 针对性训练 Heading 和 T/F/NG 题型技巧。</li>
          </ul>
        `,
        colorTheme: "blue",
      },
      [StudyPhase.PHASE_3]: {
        title: "全真模考",
        description: `
          <p class="mb-2">严格按照考试时间（9:00-12:00）进行全套模考。</p>
          <ul class="list-disc list-inside">
             <li>重点分析错题原因，而非仅仅关注分数。</li>
             <li>口语需进行录音并回听，检查流利度与语法错误。</li>
          </ul>
        `,
        colorTheme: "rose",
      },
    };
    return saved ? JSON.parse(saved) : defaultStrategies;
  });

  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportData = () => {
    try {
      const payload = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        goals,
        logs,
        todos,
        strategies: phaseStrategies,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ielts-pace-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("导出失败，请稍后重试。");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (parsed.goals) {
        setGoals(parsed.goals as GoalConfig);
      }
      if (Array.isArray(parsed.logs)) {
        setLogs(parsed.logs as StudyLog[]);
      }
      if (Array.isArray(parsed.todos)) {
        setTodos(parsed.todos as TodoItem[]);
      }
      if (parsed.strategies) {
        setPhaseStrategies(
          parsed.strategies as Record<StudyPhase, PhaseStrategy>
        );
      }

      alert("导入成功！当前数据已用备份覆盖。");
    } catch (error) {
      console.error("Import failed", error);
      alert("导入失败：文件格式不正确或已损坏。");
    } finally {
      e.target.value = "";
    }
  };

  useEffect(() => {
    localStorage.setItem("ielts_goals_v3", JSON.stringify(goals));
  }, [goals]);
  useEffect(() => {
    localStorage.setItem("ielts_logs_v3", JSON.stringify(logs));
  }, [logs]);
  useEffect(() => {
    localStorage.setItem("ielts_todos_v3", JSON.stringify(todos));
  }, [todos]);
  useEffect(() => {
    localStorage.setItem(
      "ielts_strategies_v3",
      JSON.stringify(phaseStrategies)
    );
  }, [phaseStrategies]);

  const addLog = (log: StudyLog) => {
    setLogs([log, ...logs]);
  };

  const updateLog = (updatedLog: StudyLog) => {
    setLogs(logs.map((log) => (log.id === updatedLog.id ? updatedLog : log)));
  };

  const deleteLog = (logId: string) => {
    setLogs(logs.filter((log) => log.id !== logId));
  };

  const handleUpdateStrategy = (
    phase: StudyPhase,
    newStrategy: PhaseStrategy
  ) => {
    setPhaseStrategies((prev) => ({ ...prev, [phase]: newStrategy }));
  };

  const handleGetAdvice = async () => {
    setLoadingAi(true);
    const result = await analyzeStudyProgress(goals, logs, goals.currentPhase);
    setAiAdvice(result.text);
    setLoadingAi(false);
  };

  const getLogSummary = (log: StudyLog) => {
    // Replicate TrackerView logic roughly for dashboard summary
    if (log.vocabData)
      return {
        title: "背单词",
        detail: `+${log.vocabData.learned} / -${log.vocabData.forgotten}`,
      };
    if (log.readingIntensiveData)
      return {
        title: "阅读精读",
        detail: `${log.readingIntensiveData.articleTitle || "无标题"}`,
      };
    if (log.corpusData)
      return {
        title: `语料库 C${log.corpusData.chapter}`,
        detail: `${log.corpusData.accuracy}% (${log.corpusData.correctSentences}/${log.corpusData.totalSentences})`,
      };
    if (log.p2ListeningData)
      return {
        title: `听力-${log.p2ListeningData.questionType}`,
        detail: `${Math.round(
          (log.p2ListeningData.correctCount / log.p2ListeningData.totalCount) *
            100
        )}%`,
      };
    if (log.p2ReadingData)
      return {
        title: `阅读-${log.p2ReadingData.questionType}`,
        detail: `${Math.round(
          (log.p2ReadingData.correctCount / log.p2ReadingData.totalCount) * 100
        )}%`,
      };
    if (log.p2WritingData)
      return {
        title: `写作-${log.p2WritingData.taskType}`,
        detail: `${log.p2WritingData.score}分`,
      };
    if (log.p2SpeakingData)
      return {
        title: `口语-${log.p2SpeakingData.part}`,
        detail: `${log.p2SpeakingData.score}分`,
      };
    if (log.mockData)
      return { title: "全真模考", detail: `总分 ${log.mockData.overallScore}` };
    return { title: "学习记录", detail: "已完成" };
  };

  const renderDashboard = () => (
    <div className="animate-fade-in">
      {(() => {
        // --- Dashboard 汇总指标与目标差距计算 ---
        const now = new Date();
        const last7 = new Date(now);
        last7.setDate(now.getDate() - 7);
        const last30 = new Date(now);
        last30.setDate(now.getDate() - 30);

        const getLogDurationMinutes = (log: StudyLog): number => {
          let total = 0;
          if (typeof log.durationMinutes === "number") {
            total += log.durationMinutes;
          }
          if (log.vocabData?.duration) {
            total += log.vocabData.duration;
          }
          if (log.readingIntensiveData?.duration) {
            total += log.readingIntensiveData.duration;
          }
          return total;
        };

        const logsLast7 = logs.filter(
          (l) => new Date(l.date).getTime() >= last7.getTime()
        );
        const logsLast30 = logs.filter(
          (l) => new Date(l.date).getTime() >= last30.getTime()
        );

        const minutesLast7 = logsLast7.reduce(
          (sum, l) => sum + getLogDurationMinutes(l),
          0
        );
        const minutesLast30 = logsLast30.reduce(
          (sum, l) => sum + getLogDurationMinutes(l),
          0
        );

        const formatMinutes = (m: number) => {
          if (!m) return "0 分钟";
          const h = Math.floor(m / 60);
          const min = m % 60;
          if (h === 0) return `${min} 分钟`;
          if (min === 0) return `${h} 小时`;
          return `${h} 小时 ${min} 分钟`;
        };

        const corpusLast30 = logsLast30.filter((l) => l.corpusData);
        const corpusAccuracyAvg =
          corpusLast30.length > 0
            ? Math.round(
                corpusLast30.reduce(
                  (sum, l) => sum + (l.corpusData?.accuracy || 0),
                  0
                ) / corpusLast30.length
              )
            : null;

        const mockLogs = logs.filter((l) => l.mockData);
        const latestMock =
          mockLogs.length > 0
            ? [...mockLogs].sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )[0]
            : null;

        const scoreRows =
          latestMock && latestMock.mockData
            ? [
                {
                  key: "overall",
                  label: "总分",
                  current: latestMock.mockData.overallScore,
                  target: goals.targetScore,
                },
                {
                  key: "listening",
                  label: "听力",
                  current: latestMock.mockData.listeningScore,
                  target: goals.targetSubScores.listening,
                },
                {
                  key: "reading",
                  label: "阅读",
                  current: latestMock.mockData.readingScore,
                  target: goals.targetSubScores.reading,
                },
                {
                  key: "writing",
                  label: "写作",
                  current: latestMock.mockData.writingScore,
                  target: goals.targetSubScores.writing,
                },
                {
                  key: "speaking",
                  label: "口语",
                  current: latestMock.mockData.speakingScore,
                  target: goals.targetSubScores.speaking,
                },
              ]
            : [];

        // 把计算结果挂到 window 以便下方 JSX 使用（避免在 JSX 里写大量逻辑）
        (window as any).__paceDashboardStats = {
          minutesLast7,
          minutesLast30,
          logsLast30Count: logsLast30.length,
          corpusAccuracyAvg,
          latestMock,
          scoreRows,
          formatMinutes,
        };

        return null;
      })()}
      {/* 1. Top: Phase Strategy Card */}
      <PhaseStrategyCard
        phase={goals.currentPhase}
        strategy={phaseStrategies[goals.currentPhase]}
        onUpdate={(s) => handleUpdateStrategy(goals.currentPhase, s)}
      />

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
              <Button
                onClick={handleGetAdvice}
                disabled={loadingAi}
                variant="primary"
                className="!py-1.5 !px-3 !text-sm"
                icon={
                  loadingAi ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <span>✨</span>
                  )
                }
              >
                {loadingAi ? "深度分析中..." : "生成今日建议"}
              </Button>
            </div>
            {aiAdvice ? (
              <div className="prose prose-invert prose-sm max-w-none bg-white/5 p-4 rounded-xl border border-white/10">
                <div
                  dangerouslySetInnerHTML={{
                    __html: aiAdvice
                      .replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong class="text-indigo-300">$1</strong>'
                      )
                      .replace(/\n/g, "<br/>"),
                  }}
                />
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">
                点击按钮，AI 将根据您的{goals.currentPhase}
                数据（如语料库正确率、写作分数趋势）提供个性化诊断。
              </p>
            )}
          </div>

          {/* Recent Logs Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">近期动态</h3>
              <button
                onClick={() => setActiveTab("tracker")}
                className="text-sm text-indigo-600 font-medium hover:underline"
              >
                去记录
              </button>
            </div>
            <div className="space-y-3">
              {logs.slice(0, 3).map((log) => {
                const summary = getLogSummary(log);
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {summary.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(log.date).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <span className="text-sm font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {summary.detail}
                    </span>
                  </div>
                );
              })}
              {logs.length === 0 && (
                <p className="text-gray-400 text-sm">
                  暂无数据，开始您的第一次记录吧！
                </p>
              )}
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

      {/* 5. 汇总统计块 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* 近7天学习时长 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">
            近 7 天学习时长
          </p>
          <p className="mt-2 text-xl font-bold text-gray-900">
            {((window as any).__paceDashboardStats?.minutesLast7 ?? 0) > 0
              ? (window as any).__paceDashboardStats.formatMinutes(
                  (window as any).__paceDashboardStats.minutesLast7
                )
              : "暂无记录"}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            统计字段包括：背单词、阅读精读等显式记录了时长的项目。
          </p>
        </div>

        {/* 近30天语料库平均正确率 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">
            近 30 天语料库平均正确率
          </p>
          {((window as any).__paceDashboardStats?.corpusAccuracyAvg ?? null) !==
          null ? (
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {(window as any).__paceDashboardStats.corpusAccuracyAvg}%
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-400">暂无语料库记录</p>
          )}
          <p className="mt-1 text-[11px] text-gray-400">
            建议长期保持 ≥ 90%，低于该值的章节优先复习。
          </p>
        </div>

        {/* 近30天学习记录数 */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">
            近 30 天学习记录数
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {(window as any).__paceDashboardStats?.logsLast30Count ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            包含所有阶段的记录，建议保持稳定的记录频率，避免“断更”。
          </p>
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
          <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">
            当前阶段
          </h3>
          <div className="space-y-2">
            {Object.values(StudyPhase).map((phase) => (
              <label
                key={phase}
                className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                  goals.currentPhase === phase
                    ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="phase"
                  className="text-indigo-600 focus:ring-indigo-500"
                  checked={goals.currentPhase === phase}
                  onChange={() => setGoals({ ...goals, currentPhase: phase })}
                />
                <span className="ml-3 font-medium text-gray-900">{phase}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Phase Dates Configuration */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
            <Calendar size={14} /> 阶段规划
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="阶段一 结束日期"
              type="date"
              value={goals.phaseDates?.phase1End || ""}
              onChange={(e) =>
                setGoals({
                  ...goals,
                  phaseDates: {
                    ...goals.phaseDates,
                    phase1End: e.target.value,
                  },
                })
              }
            />
            <Input
              label="阶段二 结束日期"
              type="date"
              value={goals.phaseDates?.phase2End || ""}
              onChange={(e) =>
                setGoals({
                  ...goals,
                  phaseDates: {
                    ...goals.phaseDates,
                    phase2End: e.target.value,
                  },
                })
              }
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            * 日期设置将影响记录表单的日期选择范围。
          </p>
        </div>

        {/* Targets */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">
            目标设定
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="总分目标"
              type="number"
              step="0.5"
              value={goals.targetScore}
              onChange={(e) =>
                setGoals({ ...goals, targetScore: Number(e.target.value) })
              }
            />
            <Input
              label="考试日期"
              type="date"
              value={goals.examDate.split("T")[0]}
              onChange={(e) =>
                setGoals({
                  ...goals,
                  examDate: new Date(e.target.value).toISOString(),
                })
              }
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["listening", "reading", "writing", "speaking"] as const).map(
              (sub) => (
                <div key={sub}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 capitalize text-center">
                    {sub}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={goals.targetSubScores[sub]}
                    onChange={(e) =>
                      setGoals({
                        ...goals,
                        targetSubScores: {
                          ...goals.targetSubScores,
                          [sub]: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full p-2 border rounded-lg text-center bg-gray-50"
                  />
                </div>
              )
            )}
          </div>
        </div>

        {/* Module Toggles */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">
            功能开关 (自定义当前阶段)
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {goals.currentPhase === StudyPhase.PHASE_1 && (
              <>
                <label className="flex items-center gap-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={goals.tracking.phase1.vocab}
                    onChange={(e) =>
                      setGoals({
                        ...goals,
                        tracking: {
                          ...goals.tracking,
                          phase1: {
                            ...goals.tracking.phase1,
                            vocab: e.target.checked,
                          },
                        },
                      })
                    }
                  />{" "}
                  背单词
                </label>
                <label className="flex items-center gap-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={goals.tracking.phase1.reading}
                    onChange={(e) =>
                      setGoals({
                        ...goals,
                        tracking: {
                          ...goals.tracking,
                          phase1: {
                            ...goals.tracking.phase1,
                            reading: e.target.checked,
                          },
                        },
                      })
                    }
                  />{" "}
                  阅读精读
                </label>
                <label className="flex items-center gap-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={goals.tracking.phase1.corpus}
                    onChange={(e) =>
                      setGoals({
                        ...goals,
                        tracking: {
                          ...goals.tracking,
                          phase1: {
                            ...goals.tracking.phase1,
                            corpus: e.target.checked,
                          },
                        },
                      })
                    }
                  />{" "}
                  语料库
                </label>
              </>
            )}
            {goals.currentPhase === StudyPhase.PHASE_2 && (
              <>
                <label className="flex items-center gap-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={goals.tracking.phase2.listening}
                    onChange={(e) =>
                      setGoals({
                        ...goals,
                        tracking: {
                          ...goals.tracking,
                          phase2: {
                            ...goals.tracking.phase2,
                            listening: e.target.checked,
                          },
                        },
                      })
                    }
                  />{" "}
                  听力题型
                </label>
                <label className="flex items-center gap-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={goals.tracking.phase2.reading}
                    onChange={(e) =>
                      setGoals({
                        ...goals,
                        tracking: {
                          ...goals.tracking,
                          phase2: {
                            ...goals.tracking.phase2,
                            reading: e.target.checked,
                          },
                        },
                      })
                    }
                  />{" "}
                  阅读题型
                </label>
                <label className="flex items-center gap-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={goals.tracking.phase2.writing}
                    onChange={(e) =>
                      setGoals({
                        ...goals,
                        tracking: {
                          ...goals.tracking,
                          phase2: {
                            ...goals.tracking.phase2,
                            writing: e.target.checked,
                          },
                        },
                      })
                    }
                  />{" "}
                  写作专项
                </label>
                <label className="flex items-center gap-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={goals.tracking.phase2.speaking}
                    onChange={(e) =>
                      setGoals({
                        ...goals,
                        tracking: {
                          ...goals.tracking,
                          phase2: {
                            ...goals.tracking.phase2,
                            speaking: e.target.checked,
                          },
                        },
                      })
                    }
                  />{" "}
                  口语专项
                </label>
              </>
            )}
            {goals.currentPhase === StudyPhase.PHASE_3 && (
              <p className="text-gray-500 col-span-2 bg-gray-50 p-2 rounded">
                全真模考阶段自动启用所有追踪项。
              </p>
            )}
          </div>
        </div>

        {/* Data Backup & Import */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">
            数据备份 & 导入
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            建议每周导出一次备份文件，或在更换电脑、浏览器前手动备份。
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              variant="secondary"
              onClick={handleExportData}
              className="!py-2 !px-4"
            >
              导出当前全部数据 (JSON)
            </Button>
            <Button
              variant="secondary"
              onClick={handleImportClick}
              className="!py-2 !px-4"
            >
              从备份文件导入
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportFileChange}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            *
            导入操作会使用备份中的目标、学习记录、待办和阶段策略覆盖当前数据，请谨慎操作。
          </p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "tracker":
        return (
          <TrackerView
            logs={logs}
            onAddLog={addLog}
            onUpdateLog={updateLog}
            onDeleteLog={deleteLog}
            currentPhase={goals.currentPhase}
            trackingConfig={goals.tracking}
            phaseDates={goals.phaseDates || { phase1End: "", phase2End: "" }}
          />
        );
      case "todos":
        return (
          <TodoList
            todos={todos}
            setTodos={setTodos}
            currentPhase={goals.currentPhase}
            isWidget={false}
          />
        );
      case "analytics":
        return <Charts logs={logs} currentPhase={goals.currentPhase} />;
      case "settings":
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
