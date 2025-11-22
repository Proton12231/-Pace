
import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { StudyLog, StudyPhase } from '../types';
import { ApexOptions } from 'apexcharts';
import { Filter } from 'lucide-react';

interface ChartsProps {
  logs: StudyLog[];
  currentPhase: StudyPhase;
}

type TimeRange = 'all' | 'month' | 'week';

// --- Utility: Filter Logs ---
const filterLogsByRange = (logs: StudyLog[], range: TimeRange): StudyLog[] => {
  if (range === 'all') return logs;
  const now = new Date();
  const limit = new Date();
  if (range === 'week') limit.setDate(now.getDate() - 7);
  if (range === 'month') limit.setDate(now.getDate() - 30);
  return logs.filter(l => new Date(l.date) >= limit);
};

// --- Component: Chart Card Wrapper (With Independent Filter) ---
interface ChartCardProps {
  title: string;
  logs: StudyLog[];
  renderChart: (filteredLogs: StudyLog[]) => React.ReactNode;
  height?: number;
  colSpan?: string; // Allow grid control
}

const ChartCard: React.FC<ChartCardProps> = ({ title, logs, renderChart, height = 350, colSpan = "lg:col-span-1" }) => {
  const [range, setRange] = useState<TimeRange>('all');

  const filteredData = useMemo(() => filterLogsByRange(logs, range), [logs, range]);

  return (
    <div className={`bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 ${colSpan}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-600 rounded-full"></span>
            {title}
        </h3>
        <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
          {(['all', 'month', 'week'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                range === r 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === 'all' ? '全部' : r === 'month' ? '本月' : '本周'}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full" style={{ minHeight: height }}>
        {filteredData.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200" style={{ height: height }}>
                <Filter size={32} className="mb-2 opacity-20" />
                <p className="text-sm">该时间段暂无数据</p>
             </div>
        ) : (
            renderChart(filteredData)
        )}
      </div>
    </div>
  );
};

// --- Global Options ---
const commonOptions: ApexOptions = {
  chart: {
    fontFamily: 'Inter, sans-serif',
    toolbar: { show: true },
    zoom: { enabled: true },
    animations: { enabled: true }
  },
  grid: { borderColor: '#f3f4f6', strokeDashArray: 4 },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  theme: { mode: 'light' }
};

// --- Main Charts Component ---
export const Charts: React.FC<ChartsProps> = ({ logs, currentPhase }) => {
  const phaseLogs = useMemo(() => logs.filter(l => l.phase === currentPhase), [logs, currentPhase]);

  // -------------------------
  // Phase 1: Vocab
  // -------------------------
  const renderVocabChart = (data: StudyLog[]) => {
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const chartData = {
        series: [
            { name: '今日背诵', data: sorted.map(l => l.vocabData?.learned || 0) },
            { name: '今日遗忘', data: sorted.map(l => l.vocabData?.forgotten || 0) }
        ],
        options: {
            ...commonOptions,
            colors: ['#4f46e5', '#ef4444'],
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3, stops: [0, 90, 100] } },
            xaxis: { 
                categories: sorted.map(l => new Date(l.date).toLocaleDateString('zh-CN', {month: 'short', day: 'numeric'})),
            },
            tooltip: { x: { format: 'MM/dd' } }
        } as ApexOptions
    };
    return <Chart options={chartData.options} series={chartData.series} type="area" height={320} />;
  };

  // -------------------------
  // Phase 1: Reading (Dual Line)
  // -------------------------
  const renderReadingChart = (data: StudyLog[]) => {
    const sorted = [...data].filter(l => l.readingIntensiveData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const chartData = {
        series: [
            { name: '生词数', type: 'line', data: sorted.map(l => l.readingIntensiveData?.unknownWordCount || 0) },
            { name: '精读时长(min)', type: 'line', data: sorted.map(l => l.readingIntensiveData?.duration || 0) }
        ],
        options: {
            ...commonOptions,
            colors: ['#f59e0b', '#10b981'], // Yellow for words, Green for time
            stroke: { width: [3, 3], curve: 'smooth' },
            xaxis: { categories: sorted.map(l => l.readingIntensiveData?.articleTitle?.substring(0, 12) + '...' || new Date(l.date).toLocaleDateString()) },
            yaxis: [
                { 
                    title: { text: '生词数量', style: { color: '#f59e0b' } },
                    labels: { style: { colors: '#f59e0b' } }
                },
                { 
                    opposite: true, 
                    title: { text: '时长 (分钟)', style: { color: '#10b981' } },
                    labels: { style: { colors: '#10b981' } }
                }
            ],
            tooltip: {
                shared: true,
                intersect: false,
            }
        } as ApexOptions
    };
    return <Chart options={chartData.options} series={chartData.series} type="line" height={320} />;
  };

  // -------------------------
  // Phase 1: Corpus (Detailed + Round Summary)
  // -------------------------
  
  // Chart 1: X = Section (3.1, 3.2...), Y = Accuracy, Series = Round 1, Round 2...
  const renderCorpusDetailedChart = (data: StudyLog[]) => {
      const corpusLogs = data.filter(l => l.corpusData);
      
      // 1. Get Unique Sections & Sort them (Numerically: 3.1, 3.2 ... 3.9, 3.10, 4.1 ...)
      const uniqueSections = Array.from(new Set(corpusLogs.map(l => `${l.corpusData?.chapter}.${l.corpusData?.section}`)));
      uniqueSections.sort((a, b) => {
          const [chA, secA] = a.split('.').map(Number);
          const [chB, secB] = b.split('.').map(Number);
          if (chA !== chB) return chA - chB;
          return secA - secB;
      });

      // 2. Get Unique Rounds
      const rounds = Array.from(new Set(corpusLogs.map(l => l.corpusData?.round || 1))).sort((a, b) => a - b);

      // 3. Build Series
      const series = rounds.map(r => ({
          name: `第 ${r} 轮`,
          data: uniqueSections.map(sec => {
              // Find log for this round and this section
              const found = corpusLogs.find(l => 
                  l.corpusData?.round === r && 
                  `${l.corpusData.chapter}.${l.corpusData.section}` === sec
              );
              return found ? found.corpusData?.accuracy : null; // Return null for missing data points so line skips or breaks
          })
      }));

      const options: ApexOptions = {
          ...commonOptions,
          chart: { ...commonOptions.chart, type: 'line' },
          colors: ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b'], // Different colors for rounds
          xaxis: { 
              categories: uniqueSections,
              title: { text: '篇章 (章.节)' }
          },
          yaxis: { max: 100, title: { text: '正确率 %' } },
          stroke: { width: 2 },
          markers: { size: 4, hover: { size: 6 } },
          annotations: {
            yaxis: [{ y: 90, borderColor: '#10b981', label: { borderColor: '#10b981', style: { color: '#fff', background: '#10b981' }, text: '目标 90%' } }]
          },
          legend: { position: 'top' }
      };

      return <Chart options={options} series={series} type="line" height={350} />;
  };

  // Chart 2: X = Round, Y = Average Accuracy
  const renderCorpusRoundTrendChart = (data: StudyLog[]) => {
      const corpusLogs = data.filter(l => l.corpusData);
      const roundStats: Record<number, { total: number; count: number }> = {};

      corpusLogs.forEach(l => {
          const r = l.corpusData?.round || 1;
          if (!roundStats[r]) roundStats[r] = { total: 0, count: 0 };
          roundStats[r].total += l.corpusData?.accuracy || 0;
          roundStats[r].count += 1;
      });

      const rounds = Object.keys(roundStats).map(Number).sort((a, b) => a - b);
      const averages = rounds.map(r => Math.round(roundStats[r].total / roundStats[r].count));

      const options: ApexOptions = {
          ...commonOptions,
          chart: { ...commonOptions.chart, type: 'line' },
          colors: ['#10b981'],
          xaxis: { 
              categories: rounds.map(r => `第 ${r} 轮`),
              title: { text: '练习轮次' }
          },
          yaxis: { max: 100, title: { text: '平均正确率 %' } },
          stroke: { curve: 'straight', width: 3 },
          markers: { size: 6 }
      };

      return <Chart options={options} series={[{ name: '平均正确率', data: averages }]} type="line" height={300} />;
  };


  // -------------------------
  // Phase 2
  // -------------------------
  const renderPhase2Radar = (data: StudyLog[]) => {
      const typeStats: Record<string, {correct: number, total: number}> = {};
      data.forEach(l => {
        if (l.p2ListeningData) {
          const t = l.p2ListeningData.questionType;
          if (!typeStats[t]) typeStats[t] = {correct: 0, total: 0};
          typeStats[t].correct += l.p2ListeningData.correctCount;
          typeStats[t].total += l.p2ListeningData.totalCount;
        }
        if (l.p2ReadingData) {
            const t = l.p2ReadingData.questionType;
            if (!typeStats[t]) typeStats[t] = {correct: 0, total: 0};
            typeStats[t].correct += l.p2ReadingData.correctCount;
            typeStats[t].total += l.p2ReadingData.totalCount;
        }
      });

      const categories = Object.keys(typeStats);
      const seriesData = categories.map(k => Math.round((typeStats[k].correct / typeStats[k].total) * 100));

      if (categories.length === 0) return <p className="text-center text-gray-400 pt-10">暂无题型数据</p>;

      const options: ApexOptions = {
          ...commonOptions,
          chart: { ...commonOptions.chart, toolbar: { show: false } },
          xaxis: { categories: categories },
          yaxis: { min: 0, max: 100, tickAmount: 4 },
          fill: { opacity: 0.2 },
          colors: ['#8b5cf6'],
          markers: { size: 4 }
      };

      return <Chart options={options} series={[{ name: '正确率', data: seriesData }]} type="radar" height={350} />;
  };

  const renderWritingTrend = (data: StudyLog[]) => {
      const sorted = [...data].filter(l => l.p2WritingData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const chartData = {
          series: [
              { name: 'Task 1', data: sorted.map(l => ({ x: new Date(l.date).getTime(), y: l.p2WritingData?.taskType === 'Task 1' ? l.p2WritingData.score : null })) },
              { name: 'Task 2', data: sorted.map(l => ({ x: new Date(l.date).getTime(), y: l.p2WritingData?.taskType === 'Task 2' ? l.p2WritingData.score : null })) }
          ],
          options: {
              ...commonOptions,
              chart: { ...commonOptions.chart, type: 'scatter' },
              stroke: { width: 2, curve: 'monotoneCubic' }, 
              colors: ['#3b82f6', '#d946ef'],
              xaxis: { type: 'datetime' },
              yaxis: { min: 4, max: 9, tickAmount: 10 },
              markers: { size: 6 }
          } as ApexOptions
      };
      return <Chart options={chartData.options} series={chartData.series} type="line" height={320} />;
  };

  // -------------------------
  // Phase 3
  // -------------------------
  const renderMockChart = (data: StudyLog[]) => {
      const sorted = [...data].filter(l => l.mockData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const chartData = {
          series: [
              { name: '总分 Overall', data: sorted.map(l => l.mockData?.overallScore || 0) },
              { name: '听力 Listening', data: sorted.map(l => l.mockData?.listeningScore || 0) },
              { name: '阅读 Reading', data: sorted.map(l => l.mockData?.readingScore || 0) },
              { name: '写作 Writing', data: sorted.map(l => l.mockData?.writingScore || 0) },
              { name: '口语 Speaking', data: sorted.map(l => l.mockData?.speakingScore || 0) }
          ],
          options: {
              ...commonOptions,
              colors: ['#000000', '#818cf8', '#34d399', '#fbbf24', '#f472b6'],
              stroke: { width: [4, 2, 2, 2, 2], dashArray: [0, 5, 5, 5, 5] },
              xaxis: { categories: sorted.map(l => `${l.mockData?.book} ${l.mockData?.test}`) },
              yaxis: { min: 4, max: 9, tickAmount: 10 },
              legend: { position: 'top' }
          } as ApexOptions
      };
      return <Chart options={chartData.options} series={chartData.series} type="line" height={380} />;
  };


  // -------------------------
  // Render Layout
  // -------------------------
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {currentPhase === StudyPhase.PHASE_1 && (
        <>
           {/* Top Row: Vocab & Reading */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <ChartCard title="背单词记忆曲线" logs={phaseLogs.filter(l => l.vocabData)} renderChart={renderVocabChart} />
             <ChartCard title="阅读精读 (生词 vs 时长)" logs={phaseLogs.filter(l => l.readingIntensiveData)} renderChart={renderReadingChart} />
          </div>
          
          {/* Bottom Row: Corpus Specifics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <ChartCard 
                title="语料库各章听写正确率 (多轮对比)" 
                logs={phaseLogs.filter(l => l.corpusData)} 
                renderChart={renderCorpusDetailedChart} 
                colSpan="lg:col-span-2"
             />
             <ChartCard 
                title="语料库每轮平均正确率" 
                logs={phaseLogs.filter(l => l.corpusData)} 
                renderChart={renderCorpusRoundTrendChart} 
             />
          </div>
        </>
      )}

      {currentPhase === StudyPhase.PHASE_2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <ChartCard title="听/读 题型薄弱点分析" logs={phaseLogs} renderChart={renderPhase2Radar} />
           <ChartCard title="写作分数趋势 (Task 1 vs Task 2)" logs={phaseLogs.filter(l => l.p2WritingData)} renderChart={renderWritingTrend} />
        </div>
      )}

      {currentPhase === StudyPhase.PHASE_3 && (
        <ChartCard title="全真模考全科走势图" logs={phaseLogs.filter(l => l.mockData)} renderChart={renderMockChart} height={450} />
      )}
    </div>
  );
};
