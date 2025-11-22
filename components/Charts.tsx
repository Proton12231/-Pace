
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

// --- Component: Chart Card Wrapper ---
interface ChartCardProps {
  title: string;
  logs: StudyLog[];
  renderChart: (filteredLogs: StudyLog[]) => React.ReactNode;
  height?: number;
  colSpan?: string;
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
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true }
  },
  grid: { borderColor: '#f3f4f6', strokeDashArray: 4 },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  theme: { mode: 'light' }
};

export const Charts: React.FC<ChartsProps> = ({ logs, currentPhase }) => {
  const phaseLogs = useMemo(() => logs.filter(l => l.phase === currentPhase), [logs, currentPhase]);

  // --- Phase 1 Charts ---
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
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
            xaxis: { categories: sorted.map(l => new Date(l.date).toLocaleDateString('zh-CN', {month: 'numeric', day: 'numeric'})) }
        } as ApexOptions
    };
    return <Chart options={chartData.options} series={chartData.series} type="area" height={320} />;
  };

  const renderReadingChart = (data: StudyLog[]) => {
    const sorted = [...data].filter(l => l.readingIntensiveData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const chartData = {
        series: [
            { name: '生词数', type: 'line', data: sorted.map(l => l.readingIntensiveData?.unknownWordCount || 0) },
            { name: '精读时长(min)', type: 'line', data: sorted.map(l => l.readingIntensiveData?.duration || 0) }
        ],
        options: {
            ...commonOptions,
            colors: ['#f59e0b', '#10b981'],
            stroke: { width: [3, 3] },
            xaxis: { categories: sorted.map(l => l.readingIntensiveData?.articleTitle?.substring(0, 10) || new Date(l.date).toLocaleDateString()) },
            yaxis: [
                { title: { text: '生词', style: { color: '#f59e0b' } } },
                { opposite: true, title: { text: '时长', style: { color: '#10b981' } } }
            ]
        } as ApexOptions
    };
    return <Chart options={chartData.options} series={chartData.series} type="line" height={320} />;
  };

  const renderCorpusDetailedChart = (data: StudyLog[]) => {
      const corpusLogs = data.filter(l => l.corpusData);
      const uniqueSections = Array.from(new Set(corpusLogs.map(l => `${l.corpusData?.chapter}.${l.corpusData?.section}`)));
      uniqueSections.sort((a, b) => {
          const [chA, secA] = a.split('.').map(Number);
          const [chB, secB] = b.split('.').map(Number);
          if (chA !== chB) return chA - chB;
          return secA - secB;
      });

      const rounds = Array.from(new Set(corpusLogs.map(l => l.corpusData?.round || 1))).sort((a, b) => a - b);
      const series = rounds.map(r => ({
          name: `第 ${r} 轮`,
          data: uniqueSections.map(sec => {
              const found = corpusLogs.find(l => l.corpusData?.round === r && `${l.corpusData.chapter}.${l.corpusData.section}` === sec);
              return found ? found.corpusData?.accuracy : null;
          })
      }));

      const options: ApexOptions = {
          ...commonOptions,
          chart: { ...commonOptions.chart, type: 'line' },
          colors: ['#6366f1', '#ec4899', '#8b5cf6'],
          xaxis: { categories: uniqueSections, title: { text: '章.节' } },
          yaxis: { max: 100 },
          annotations: { yaxis: [{ y: 90, borderColor: '#10b981', label: { text: '达标 90%', style: { background: '#10b981', color: '#fff' } } }] }
      };
      return <Chart options={options} series={series} type="line" height={350} />;
  };

  // --- Phase 2 Charts ---

  // 1. Listening Radar
  const renderListeningRadar = (data: StudyLog[]) => {
      const typeStats: Record<string, {correct: number, total: number}> = {};
      data.filter(l => l.p2ListeningData).forEach(l => {
          const t = l.p2ListeningData!.questionType;
          if (!typeStats[t]) typeStats[t] = {correct: 0, total: 0};
          typeStats[t].correct += l.p2ListeningData!.correctCount;
          typeStats[t].total += l.p2ListeningData!.totalCount;
      });
      const categories = Object.keys(typeStats);
      const seriesData = categories.map(k => Math.round((typeStats[k].correct / typeStats[k].total) * 100));

      if (categories.length === 0) return <div className="flex justify-center items-center h-full text-gray-400">暂无听力数据</div>;

      const options: ApexOptions = {
          ...commonOptions,
          xaxis: { categories },
          yaxis: { min: 0, max: 100, tickAmount: 4 },
          fill: { opacity: 0.2 },
          colors: ['#3b82f6'],
          markers: { size: 4 }
      };
      return <Chart options={options} series={[{ name: '正确率', data: seriesData }]} type="radar" height={350} />;
  };

  // 2. Reading Radar
  const renderReadingRadar = (data: StudyLog[]) => {
      const typeStats: Record<string, {correct: number, total: number}> = {};
      data.filter(l => l.p2ReadingData).forEach(l => {
          const t = l.p2ReadingData!.questionType;
          if (!typeStats[t]) typeStats[t] = {correct: 0, total: 0};
          typeStats[t].correct += l.p2ReadingData!.correctCount;
          typeStats[t].total += l.p2ReadingData!.totalCount;
      });
      const categories = Object.keys(typeStats);
      const seriesData = categories.map(k => Math.round((typeStats[k].correct / typeStats[k].total) * 100));

      if (categories.length === 0) return <div className="flex justify-center items-center h-full text-gray-400">暂无阅读数据</div>;

      const options: ApexOptions = {
          ...commonOptions,
          xaxis: { categories },
          yaxis: { min: 0, max: 100, tickAmount: 4 },
          fill: { opacity: 0.2 },
          colors: ['#10b981'],
          markers: { size: 4 }
      };
      return <Chart options={options} series={[{ name: '正确率', data: seriesData }]} type="radar" height={350} />;
  };

  // 3. Writing Trend (Line)
  const renderWritingTrend = (data: StudyLog[]) => {
      const sorted = [...data].filter(l => l.p2WritingData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Group by date to handle multiple entries per day if necessary, or just sequence them
      const series = [
          { name: 'Task 1', data: sorted.map(l => l.p2WritingData?.taskType === 'Task 1' ? l.p2WritingData.score : null) },
          { name: 'Task 2', data: sorted.map(l => l.p2WritingData?.taskType === 'Task 2' ? l.p2WritingData.score : null) }
      ];

      const options: ApexOptions = {
          ...commonOptions,
          chart: { ...commonOptions.chart, type: 'line' },
          colors: ['#3b82f6', '#d946ef'],
          xaxis: { categories: sorted.map(l => new Date(l.date).toLocaleDateString('zh-CN', {month: 'numeric', day: 'numeric'})) },
          yaxis: { min: 4, max: 9, tickAmount: 10 },
          stroke: { width: 3, curve: 'straight' },
          markers: { size: 5 }
      };
      return <Chart options={options} series={series} type="line" height={320} />;
  };

  // 4. Speaking Trend (Line - P1, P2, P3)
  const renderSpeakingTrend = (data: StudyLog[]) => {
      const sorted = [...data].filter(l => l.p2SpeakingData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const series = [
          { name: 'Part 1', data: sorted.map(l => l.p2SpeakingData?.part === 'Part 1' ? l.p2SpeakingData.score : null) },
          { name: 'Part 2', data: sorted.map(l => l.p2SpeakingData?.part === 'Part 2' ? l.p2SpeakingData.score : null) },
          { name: 'Part 3', data: sorted.map(l => l.p2SpeakingData?.part === 'Part 3' ? l.p2SpeakingData.score : null) }
      ];

      const options: ApexOptions = {
          ...commonOptions,
          chart: { ...commonOptions.chart, type: 'line' },
          colors: ['#60a5fa', '#f472b6', '#a78bfa'],
          xaxis: { categories: sorted.map(l => new Date(l.date).toLocaleDateString('zh-CN', {month: 'numeric', day: 'numeric'})) },
          yaxis: { min: 4, max: 9, tickAmount: 10 },
          stroke: { width: 3, curve: 'straight' },
          markers: { size: 5 }
      };
      return <Chart options={options} series={series} type="line" height={320} />;
  };

  // 5. Speaking Topic Radar (P2 & P3)
  const renderSpeakingTopicRadar = (data: StudyLog[]) => {
      const topicStats: Record<string, {totalScore: number, count: number}> = {};
      
      data.filter(l => l.p2SpeakingData && (l.p2SpeakingData.part === 'Part 2' || l.p2SpeakingData.part === 'Part 3')).forEach(l => {
          const topic = l.p2SpeakingData!.topic || 'Unspecified';
          if (!topicStats[topic]) topicStats[topic] = { totalScore: 0, count: 0 };
          topicStats[topic].totalScore += l.p2SpeakingData!.score;
          topicStats[topic].count += 1;
      });

      const categories = Object.keys(topicStats);
      const seriesData = categories.map(k => parseFloat((topicStats[k].totalScore / topicStats[k].count).toFixed(1)));

      if (categories.length === 0) return <div className="flex justify-center items-center h-full text-gray-400">暂无 P2/P3 话题数据</div>;

      const options: ApexOptions = {
          ...commonOptions,
          xaxis: { categories },
          yaxis: { min: 4, max: 9, tickAmount: 5 },
          fill: { opacity: 0.2 },
          colors: ['#f43f5e'],
          markers: { size: 4 }
      };
      return <Chart options={options} series={[{ name: '平均分', data: seriesData }]} type="radar" height={350} />;
  };

  const renderMockChart = (data: StudyLog[]) => {
      const sorted = [...data].filter(l => l.mockData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const chartData = {
          series: [
              { name: '总分', data: sorted.map(l => l.mockData?.overallScore || 0) },
              { name: 'L', data: sorted.map(l => l.mockData?.listeningScore || 0) },
              { name: 'R', data: sorted.map(l => l.mockData?.readingScore || 0) },
              { name: 'W', data: sorted.map(l => l.mockData?.writingScore || 0) },
              { name: 'S', data: sorted.map(l => l.mockData?.speakingScore || 0) }
          ],
          options: {
              ...commonOptions,
              colors: ['#1f2937', '#818cf8', '#34d399', '#fbbf24', '#f472b6'],
              stroke: { width: [4, 2, 2, 2, 2], dashArray: [0, 5, 5, 5, 5] },
              xaxis: { categories: sorted.map(l => `${l.mockData?.book} ${l.mockData?.test}`) },
              yaxis: { min: 4, max: 9 }
          } as ApexOptions
      };
      return <Chart options={chartData.options} series={chartData.series} type="line" height={380} />;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {currentPhase === StudyPhase.PHASE_1 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <ChartCard title="背单词记忆曲线" logs={phaseLogs.filter(l => l.vocabData)} renderChart={renderVocabChart} />
             <ChartCard title="阅读精读 (生词 vs 时长)" logs={phaseLogs.filter(l => l.readingIntensiveData)} renderChart={renderReadingChart} />
          </div>
          <ChartCard title="语料库各章听写正确率" logs={phaseLogs.filter(l => l.corpusData)} renderChart={renderCorpusDetailedChart} colSpan="w-full" />
        </>
      )}

      {currentPhase === StudyPhase.PHASE_2 && (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="听力题型正确率分布" logs={phaseLogs.filter(l => l.p2ListeningData)} renderChart={renderListeningRadar} />
                <ChartCard title="阅读题型正确率分布" logs={phaseLogs.filter(l => l.p2ReadingData)} renderChart={renderReadingRadar} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="写作分数趋势 (折线)" logs={phaseLogs.filter(l => l.p2WritingData)} renderChart={renderWritingTrend} />
                <ChartCard title="口语分数趋势 (Part 1/2/3)" logs={phaseLogs.filter(l => l.p2SpeakingData)} renderChart={renderSpeakingTrend} />
            </div>

            <ChartCard title="口语话题得分分布 (Part 2/3)" logs={phaseLogs.filter(l => l.p2SpeakingData)} renderChart={renderSpeakingTopicRadar} colSpan="w-full" />
        </>
      )}

      {currentPhase === StudyPhase.PHASE_3 && (
        <ChartCard title="全真模考全科走势图" logs={phaseLogs.filter(l => l.mockData)} renderChart={renderMockChart} height={450} />
      )}
    </div>
  );
};
