import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Plus, Timer, Trash2, Edit2, ArrowRight, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  duration: number; // in seconds
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDuration, setNewProjectDuration] = useState('');
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const generateRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addProject = () => {
    if (!newProjectName || !newProjectDuration) return;
    
    const duration = parseInt(newProjectDuration) * 60; // Convert minutes to seconds
    const newProject = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProjectName,
      duration
    };
    
    setProjects([...projects, newProject]);
    setNewProjectName('');
    setNewProjectDuration('');
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(project => project.id !== id));
  };

  const startEditing = (project: Project) => {
    setEditingProject(project.id);
    setNewProjectName(project.name);
    setNewProjectDuration(String(project.duration / 60));
  };

  const saveEdit = (id: string) => {
    if (!newProjectName || !newProjectDuration) return;
    
    setProjects(projects.map(project => 
      project.id === id 
        ? { ...project, name: newProjectName, duration: parseInt(newProjectDuration) * 60 }
        : project
    ));
    setEditingProject(null);
    setNewProjectName('');
    setNewProjectDuration('');
  };

  const startTracking = (startIndex: number = 0) => {
    if (projects.length === 0) return;
    
    setIsRunning(true);
    setIsPaused(false);
    setCurrentProject(startIndex);
    setTimeLeft(projects[startIndex].duration);
    setBackgroundColor(generateRandomColor());
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const returnToPlanning = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentProject(-1);
    setBackgroundColor('#ffffff');
    if (isFullscreen) {
      toggleFullscreen();
    }
  };

  const playAlarm = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const toggleFullscreen = () => {
    if (!fullscreenRef.current) return;

    if (!document.fullscreenElement) {
      fullscreenRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    let timer: number;
    
    if (isRunning && !isPaused && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      playAlarm();
      
      if (currentProject < projects.length - 1) {
        setCurrentProject(prev => prev + 1);
        setTimeLeft(projects[currentProject + 1].duration);
        setBackgroundColor(generateRandomColor());
      } else {
        setIsRunning(false);
        setCurrentProject(-1);
        setBackgroundColor('#ffffff');
        if (isFullscreen) {
          toggleFullscreen();
        }
      }
    }

    return () => clearInterval(timer);
  }, [isRunning, isPaused, timeLeft, currentProject, projects]);

  return (
    <div 
      dir="rtl"
      className="min-h-screen w-full transition-colors duration-500 ease-in-out"
      style={{ backgroundColor }}
      ref={fullscreenRef}
    >
      {!isRunning ? (
        <div className="container mx-auto p-8">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
            <h1 className="text-4xl font-bold mb-8 flex items-center gap-3 text-indigo-700">
              <Timer className="w-10 h-10" />
              מתזמן פרויקטים
            </h1>
            
            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    שם הפרויקט
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition-all"
                    placeholder="הכנס שם פרויקט"
                  />
                </div>
                
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-2">
                    משך זמן (דקות)
                  </label>
                  <input
                    type="number"
                    value={newProjectDuration}
                    onChange={(e) => setNewProjectDuration(e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200 transition-all"
                    placeholder="הכנס משך זמן"
                    min="1"
                  />
                </div>
              </div>
              
              <button
                onClick={addProject}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg text-lg font-medium flex items-center justify-center gap-2 transition-all transform hover:scale-105"
              >
                <Plus className="w-6 h-6" />
                הוסף פרויקט
              </button>
            </div>

            <div className="space-y-3 mb-8">
              {projects.map((project, index) => (
                <div 
                  key={project.id}
                  className={`bg-gradient-to-l from-indigo-50 to-white p-4 rounded-lg flex items-center justify-between transition-all hover:shadow-md ${
                    editingProject === project.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  {editingProject === project.id ? (
                    <>
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          className="px-3 py-2 border rounded-md"
                          placeholder="שם הפרויקט"
                        />
                        <input
                          type="number"
                          value={newProjectDuration}
                          onChange={(e) => setNewProjectDuration(e.target.value)}
                          className="px-3 py-2 border rounded-md"
                          placeholder="משך זמן (דקות)"
                          min="1"
                        />
                      </div>
                      <button
                        onClick={() => saveEdit(project.id)}
                        className="mr-4 text-green-600 hover:text-green-700"
                      >
                        שמור
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-medium">{project.name}</span>
                        <span className="text-gray-600">{formatTime(project.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startTracking(index)}
                          className="text-green-600 hover:text-green-700 p-2 rounded-full hover:bg-green-50 transition-all"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => startEditing(project)}
                          className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-all"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {projects.length > 0 && (
              <button
                onClick={() => startTracking(0)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg text-xl font-medium flex items-center justify-center gap-3 transition-all transform hover:scale-105"
              >
                <Play className="w-6 h-6" />
                התחל מעקב
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={toggleFullscreen}
              className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all transform hover:scale-105"
            >
              {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
            </button>
            <button
              onClick={togglePause}
              className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all transform hover:scale-105"
            >
              {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
            </button>
            <button
              onClick={returnToPlanning}
              className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all transform hover:scale-105"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
          
          <div className="text-center bg-white/10 p-12 rounded-3xl backdrop-blur-sm">
            <h2 className="text-5xl md:text-7xl font-bold mb-8 text-gray-800">
              {projects[currentProject].name}
            </h2>
            <div className="text-7xl md:text-9xl font-mono font-bold text-gray-800 tracking-wider animate-pulse">
              {formatTime(timeLeft)}
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
              {currentProject > 0 && (
                <button
                  onClick={() => {
                    setCurrentProject(currentProject - 1);
                    setTimeLeft(projects[currentProject - 1].duration);
                    setBackgroundColor(generateRandomColor());
                  }}
                  className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all transform hover:scale-105"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              )}
              {currentProject < projects.length - 1 && (
                <button
                  onClick={() => {
                    setCurrentProject(currentProject + 1);
                    setTimeLeft(projects[currentProject + 1].duration);
                    setBackgroundColor(generateRandomColor());
                  }}
                  className="bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all transform hover:scale-105"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <audio 
        ref={audioRef}
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
      />
    </div>
  );
}

export default App;