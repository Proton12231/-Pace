
export enum StudyPhase {
  PHASE_1 = '阶段一：基础能力构建',
  PHASE_2 = '阶段二：题型强化训练',
  PHASE_3 = '阶段三：全真模考'
}

export type TrackingModule = 
  | 'vocab'             // 背单词
  | 'reading_intensive' // 阅读精读
  | 'corpus'            // 语料库
  | 'p2_listening'      // 听力题型
  | 'p2_reading'        // 阅读题型
  | 'p2_writing'        // 写作
  | 'p2_speaking'       // 口语
  | 'mock';             // 模考

export interface TrackingConfig {
  phase1: {
    vocab: boolean;
    reading: boolean;
    corpus: boolean;
  };
  phase2: {
    listening: boolean;
    reading: boolean;
    writing: boolean;
    speaking: boolean;
  };
}

// 题型与话题常量
export const QuestionTypes = {
  LISTENING: ['地图题', '表格填空', '单选题', '多选题', '流程图', '句子填空', '配对题'],
  READING: ['判断题 (T/F/NG)', 'Heading (标题配对)', '选择题', '填空题', '段落匹配', '简答题'],
  WRITING_TASK1: ['流程图', '地图题', '柱状图', '折线图', '饼图', '表格', '混合图'],
  WRITING_TASK2: ['教育类', '科技类', '环境类', '社会类', '政府类', '犯罪类', '文化类'],
  SPEAKING_PART: ['Part 1', 'Part 2', 'Part 3']
};

export interface GoalConfig {
  targetScore: number;
  targetSubScores: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
  };
  examDate: string; 
  currentPhase: StudyPhase;
  tracking: TrackingConfig;
  phaseDates: {
    phase1End: string;
    phase2End: string;
  };
}

export interface StudyLog {
  id: string;
  date: string;
  phase: StudyPhase;
  durationMinutes?: number; // General duration if applicable
  
  // --- Phase 1 Data ---
  vocabData?: {
    learned: number;
    forgotten: number;
    duration: number;
  };
  readingIntensiveData?: {
    articleTitle?: string;
    unknownWordCount: number;
    chunkCount: number;
    duration: number;
    noteContent?: string;
    chunkImageUrl?: string; // Base64 or blob url (语块截图)
    noteImageUrl?: string;  // Base64 or blob url (手帐/笔记)
  };
  corpusData?: {
    chapter: string; // e.g., "3", "4", "5", "11"
    section: string; // e.g., "1", "2"...
    round: number;   // 1, 2, 3...
    totalSentences: number;
    correctSentences: number;
    accuracy: number; // Calculated
  };

  // --- Phase 2 Data ---
  p2ListeningData?: {
    questionType: string;
    correctCount: number;
    totalCount: number;
  };
  p2ReadingData?: {
    articleTitle?: string; // Optional
    questionType: string;
    correctCount: number;
    totalCount: number;
  };
  p2WritingData?: {
    taskType: 'Task 1' | 'Task 2';
    topicType: string; // from dropdown
    score: number;
  };
  p2SpeakingData?: {
    part: 'Part 1' | 'Part 2' | 'Part 3';
    topic: string;
    score: number;
  };

  // --- Phase 3 Data ---
  mockData?: {
    book: string; // e.g., "剑16"
    test: string; // e.g., "Test 1"
    listeningScore: number; 
    readingScore: number;
    writingScore: number;
    speakingScore: number;
    overallScore: number; // Auto-calc
  };
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  date: string;
  phase: StudyPhase; // Allow filtering by phase history
}

export interface AIAnalysisResult {
  text: string;
}
