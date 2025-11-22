
import React, { useState, useMemo } from 'react';
import { TodoItem, StudyPhase } from '../types';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Filter, ListTodo, Copy, X, History } from 'lucide-react';

interface TodoListProps {
  todos: TodoItem[];
  setTodos: (todos: TodoItem[]) => void;
  currentPhase: StudyPhase;
  isWidget?: boolean;
}

export const TodoList: React.FC<TodoListProps> = ({ todos, setTodos, currentPhase, isWidget = false }) => {
  const [newTodo, setNewTodo] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    const item: TodoItem = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
      date: todayStr,
      phase: currentPhase
    };
    setTodos([item, ...todos]);
    setNewTodo('');
  };

  const toggleComplete = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
      setTodos(todos.filter(t => t.id !== id));
  };

  const copyScheduleToToday = (sourceDate: string, tasks: TodoItem[]) => {
    if (tasks.length === 0) return;
    const existingTodayTexts = new Set(todos.filter(t => t.date === todayStr).map(t => t.text));
    const newTasks = tasks
        .filter(t => !existingTodayTexts.has(t.text))
        .map((t, index) => ({
            id: Date.now().toString() + index,
            text: t.text,
            completed: false,
            date: todayStr,
            phase: currentPhase
        }));

    if (newTasks.length === 0) {
        alert('这些任务今天已经存在了，无需重复添加。');
        return;
    }
    setTodos([...newTasks, ...todos]);
  };

  const displayedTodos = useMemo(() => {
    let filtered = [...todos];
    if (isWidget) {
      return filtered.filter(t => t.date === todayStr);
    } else {
      if (filterPhase !== 'all') {
        filtered = filtered.filter(t => t.phase === filterPhase);
      }
      if (filterDate) {
        filtered = filtered.filter(t => t.date === filterDate);
      }
      return filtered;
    }
  }, [todos, isWidget, filterPhase, filterDate, todayStr]);

  const groupedTodos = useMemo(() => {
    if (isWidget) return {};
    return displayedTodos.reduce((acc, todo) => {
      if (!acc[todo.date]) acc[todo.date] = [];
      acc[todo.date].push(todo);
      return acc;
    }, {} as Record<string, TodoItem[]>);
  }, [displayedTodos, isWidget]);

  const sortedDates = Object.keys(groupedTodos).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const stats = {
    total: displayedTodos.length,
    completed: displayedTodos.filter(t => t.completed).length
  };

  if (isWidget) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <ListTodo className="text-indigo-600" size={20}/> 今日待办
            </h3>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {stats.completed}/{stats.total}
            </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[100px]">
            {displayedTodos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm py-8">
                    <p>今日暂无任务</p>
                    <p className="text-xs opacity-70 mt-1">请前往待办页规划</p>
                </div>
            ) : (
                displayedTodos.map(todo => (
                    <div key={todo.id} className="group flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-all">
                        <button onClick={() => toggleComplete(todo.id)} className="mt-0.5 flex-shrink-0 transition-colors">
                            {todo.completed ? <CheckCircle2 className="text-green-500" size={18} /> : <Circle className="text-gray-300 hover:text-indigo-500" size={18} />}
                        </button>
                        <span className={`text-sm leading-snug flex-1 break-all ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {todo.text}
                        </span>
                    </div>
                ))
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <History className="text-indigo-600" /> 备考日程时间轴
                </h2>
                <p className="text-gray-500 text-sm mt-1">回顾过往足迹，复制高效计划。</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
                <div className="relative">
                    <Filter size={14} className="absolute left-3 top-3 text-gray-400"/>
                    <select 
                        value={filterPhase} 
                        onChange={e => setFilterPhase(e.target.value)}
                        className="pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-indigo-100 cursor-pointer text-gray-600 appearance-none min-w-[120px]"
                    >
                        <option value="all">所有阶段</option>
                        {Object.values(StudyPhase).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-3 text-gray-400"/>
                    <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="pl-8 pr-8 py-2 bg-gray-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-indigo-100 text-gray-600 min-w-[140px]"
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
            </div>
        </div>

        {/* Add New Input */}
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-2xl shadow-md border border-indigo-100 flex gap-4 items-center focus-within:ring-2 focus-within:ring-indigo-100 transition-all sticky top-4 z-20">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                <Plus size={24} />
            </div>
            <input 
                type="text"
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                placeholder="添加今日 (Today) 的任务..."
                className="flex-1 text-lg bg-transparent border-none focus:ring-0 placeholder-gray-400"
            />
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex-shrink-0 shadow-lg shadow-indigo-200">
                添加
            </button>
        </form>

        {/* Timeline View */}
        <div className="relative pl-4 md:pl-8">
            {/* Continuous Vertical Line */}
            <div className="absolute left-[23px] md:left-[39px] top-6 bottom-6 w-0.5 bg-gray-200"></div>

            {sortedDates.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 ml-8 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
                    <ListTodo size={48} className="mb-4 opacity-20" />
                    <p>暂无日程记录</p>
                    {filterDate && <p className="text-xs mt-1 text-indigo-400 cursor-pointer" onClick={() => setFilterDate('')}>清除日期筛选</p>}
                 </div>
            ) : (
                <div className="space-y-12">
                    {sortedDates.map(dateKey => {
                        const isToday = dateKey === todayStr;
                        const tasks = groupedTodos[dateKey];
                        const completedCount = tasks.filter(t => t.completed).length;
                        const allCompleted = completedCount === tasks.length && tasks.length > 0;
                        
                        return (
                            <div key={dateKey} className="relative group">
                                {/* Timeline Node */}
                                <div className={`absolute -left-[9px] md:-left-[9px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10 transition-colors ${
                                    isToday 
                                        ? 'bg-indigo-600 ring-4 ring-indigo-100' 
                                        : allCompleted 
                                            ? 'bg-green-500' 
                                            : 'bg-gray-400'
                                }`}></div>

                                <div className="ml-8 md:ml-12">
                                    {/* Date Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-baseline gap-3">
                                            <h3 className={`text-xl font-bold tracking-tight ${isToday ? 'text-indigo-700' : 'text-gray-800'}`}>
                                                {isToday ? '今天 (Today)' : new Date(dateKey).toLocaleDateString('zh-CN', {weekday: 'long', month: 'long', day: 'numeric'})}
                                            </h3>
                                            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {completedCount}/{tasks.length}
                                            </span>
                                        </div>

                                        {!isToday && (
                                            <button 
                                                onClick={() => copyScheduleToToday(dateKey, tasks)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                                            >
                                                <Copy size={12} />
                                                复制到今天
                                            </button>
                                        )}
                                    </div>

                                    {/* Task List Box */}
                                    <div className={`rounded-2xl border ${
                                        isToday 
                                            ? 'bg-white border-indigo-100 shadow-md ring-1 ring-indigo-50' 
                                            : 'bg-gray-50/50 border-gray-200'
                                        } overflow-hidden transition-all hover:shadow-md`}>
                                        {tasks.map((todo, index) => (
                                            <div 
                                                key={todo.id} 
                                                className={`flex items-start gap-4 p-3.5 ${index !== tasks.length - 1 ? 'border-b border-gray-100' : ''} group/item hover:bg-black/[0.02] transition-colors`}
                                            >
                                                <button onClick={() => toggleComplete(todo.id)} className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-indigo-600 transition-colors">
                                                    {todo.completed ? 
                                                        <CheckCircle2 size={20} className="text-green-500" /> : 
                                                        <Circle size={20} />
                                                    }
                                                </button>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-base leading-snug break-words ${todo.completed ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-700'}`}>
                                                        {todo.text}
                                                    </p>
                                                    {todo.phase && !isToday && (
                                                        <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded font-medium">
                                                            {todo.phase.split('：')[0]}
                                                        </span>
                                                    )}
                                                </div>

                                                <button 
                                                    onClick={() => deleteTodo(todo.id)} 
                                                    className="opacity-0 group-hover/item:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                                    title="删除"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};
