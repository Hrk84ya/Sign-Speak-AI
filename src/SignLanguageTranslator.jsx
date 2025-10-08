import React, { useState, useRef, useEffect } from 'react';
import { Camera, Square, Play, Volume2, RefreshCw, Info } from 'lucide-react';
import { Hands } from '@mediapipe/hands';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

const SignLanguageTranslator = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [detectedGesture, setDetectedGesture] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const gestureBufferRef = useRef([]);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  
  // ASL alphabet mapping
  const signMapping = {
    'fist': 'A',
    'peace': 'V', 
    'thumbs_up': 'Good',
    'open_palm': 'Stop',
    'pointing': 'I',
    'L_shape': 'L',
    'ok_sign': 'O'
  };

  useEffect(() => {
    initializeMediaPipe();
    return () => {
      stopCamera();
    };
  }, []);

  const initializeMediaPipe = () => {
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);
    handsRef.current = hands;
  };

  const onResults = (results) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw video frame
    if (videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      for (const landmarks of results.multiHandLandmarks) {
        drawHandLandmarks(ctx, landmarks, canvas.width, canvas.height);
        const gesture = recognizeGesture(landmarks);
        if (gesture) {
          processGesture(gesture);
        }
      }
    } else {
      setDetectedGesture('');
      setConfidence(0);
    }
  };

  const startCamera = async () => {
    try {
      if (videoRef.current && handsRef.current) {
        const camera = new MediaPipeCamera(videoRef.current, {
          onFrame: async () => {
            if (handsRef.current && videoRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        
        cameraRef.current = camera;
        await camera.start();
        setIsRecording(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    setIsRecording(false);
  };

  const recognizeGesture = (landmarks) => {
    // Convert normalized coordinates to actual positions
    const points = landmarks.map(landmark => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z
    }));

    // Gesture recognition based on hand landmarks
    const gesture = classifyHandGesture(points);
    return gesture;
  };

  const classifyHandGesture = (landmarks) => {
    // Hand landmark indices (MediaPipe format)
    const THUMB_TIP = 4, THUMB_IP = 3, THUMB_MCP = 2, THUMB_CMC = 1;
    const INDEX_TIP = 8, INDEX_PIP = 6, INDEX_MCP = 5;
    const MIDDLE_TIP = 12, MIDDLE_PIP = 10, MIDDLE_MCP = 9;
    const RING_TIP = 16, RING_PIP = 14, RING_MCP = 13;
    const PINKY_TIP = 20, PINKY_PIP = 18, PINKY_MCP = 17;
    const WRIST = 0;

    // Helper function to check if finger is extended (improved)
    const isFingerExtended = (tip, pip, mcp) => {
      const tipY = landmarks[tip].y;
      const pipY = landmarks[pip].y;
      const mcpY = landmarks[mcp].y;
      
      // Finger is extended if tip is above pip and pip is above mcp
      return tipY < pipY && pipY < mcpY;
    };

    // Improved thumb detection
    const isThumbExtended = () => {
      const thumbTip = landmarks[THUMB_TIP];
      const thumbIp = landmarks[THUMB_IP];
      const thumbMcp = landmarks[THUMB_MCP];
      const thumbCmc = landmarks[THUMB_CMC];
      
      // For right hand: thumb extended means tip is to the right of other joints
      // For left hand: thumb extended means tip is to the left of other joints
      // We'll check both directions and use the stronger signal
      
      const rightHandThumb = thumbTip.x > thumbIp.x && thumbIp.x > thumbMcp.x;
      const leftHandThumb = thumbTip.x < thumbIp.x && thumbIp.x < thumbMcp.x;
      
      // Also check vertical extension (thumb pointing up)
      const verticalThumb = thumbTip.y < thumbIp.y && thumbIp.y < thumbMcp.y;
      
      return rightHandThumb || leftHandThumb || verticalThumb;
    };

    // Helper function to calculate distance
    const distance = (p1, p2) => {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };

    // Check if fingers are curled (for fist detection)
    const isFingerCurled = (tip, pip, mcp) => {
      const tipY = landmarks[tip].y;
      const pipY = landmarks[pip].y;
      const mcpY = landmarks[mcp].y;
      
      // Finger is curled if tip is below or at same level as pip
      return tipY >= pipY || Math.abs(tipY - pipY) < 0.02;
    };

    // Check finger states
    const thumbExtended = isThumbExtended();
    const indexExtended = isFingerExtended(INDEX_TIP, INDEX_PIP, INDEX_MCP);
    const middleExtended = isFingerExtended(MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP);
    const ringExtended = isFingerExtended(RING_TIP, RING_PIP, RING_MCP);
    const pinkyExtended = isFingerExtended(PINKY_TIP, PINKY_PIP, PINKY_MCP);
    
    // Check if fingers are curled
    const indexCurled = isFingerCurled(INDEX_TIP, INDEX_PIP, INDEX_MCP);
    const middleCurled = isFingerCurled(MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP);
    const ringCurled = isFingerCurled(RING_TIP, RING_PIP, RING_MCP);
    const pinkyCurled = isFingerCurled(PINKY_TIP, PINKY_PIP, PINKY_MCP);

    // Count extended and curled fingers
    const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;
    const curledCount = [indexCurled, middleCurled, ringCurled, pinkyCurled].filter(Boolean).length;

    // Update debug info
    const debugData = {
      thumbExtended,
      fingers: {
        index: { extended: indexExtended, curled: indexCurled },
        middle: { extended: middleExtended, curled: middleCurled },
        ring: { extended: ringExtended, curled: ringCurled },
        pinky: { extended: pinkyExtended, curled: pinkyCurled }
      },
      counts: { extended: extendedCount, curled: curledCount }
    };
    setDebugInfo(debugData);

    // Gesture classification with improved logic
    
    // Thumbs up: thumb extended, all other fingers curled
    if (thumbExtended && curledCount >= 3 && extendedCount <= 1) {
      return { name: 'thumbs_up', confidence: 0.9 };
    }
    
    // Fist: all fingers curled, thumb may or may not be extended
    if (curledCount >= 4 && extendedCount === 0) {
      return { name: 'fist', confidence: 0.9 };
    }
    
    // Peace sign: index and middle extended, others curled
    if (indexExtended && middleExtended && ringCurled && pinkyCurled && extendedCount === 2) {
      return { name: 'peace', confidence: 0.85 };
    }
    
    // Pointing: only index extended
    if (indexExtended && middleCurled && ringCurled && pinkyCurled && extendedCount === 1) {
      return { name: 'pointing', confidence: 0.8 };
    }
    
    // Open palm: all fingers extended
    if (extendedCount >= 4) {
      return { name: 'open_palm', confidence: 0.85 };
    }
    
    // L shape: thumb and index extended, others curled
    if (thumbExtended && indexExtended && middleCurled && ringCurled && pinkyCurled) {
      return { name: 'L_shape', confidence: 0.8 };
    }
    
    // OK sign: thumb and index finger touching, others extended
    const thumbIndexDistance = distance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]);
    if (thumbIndexDistance < 0.05 && middleExtended && ringExtended && pinkyExtended) {
      return { name: 'ok_sign', confidence: 0.8 };
    }

    return null;
  };

  const processGesture = (gesture) => {
    setDetectedGesture(gesture.name);
    setConfidence(gesture.confidence);
    
    // Add to buffer for sequence detection
    gestureBufferRef.current.push(gesture.name);
    if (gestureBufferRef.current.length > 10) {
      gestureBufferRef.current.shift();
    }
    
    // Check for consistent gesture (held for ~5 frames)
    const recentGestures = gestureBufferRef.current.slice(-5);
    const mostCommon = getMostCommon(recentGestures);
    
    if (recentGestures.filter(g => g === mostCommon).length >= 4) {
      translateGesture(mostCommon);
    }
  };





  const drawHandLandmarks = (ctx, landmarks, width, height) => {
    if (!landmarks) return;
    
    // Draw connections between landmarks
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    ];
    
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    });
    
    // Draw landmark points
    landmarks.forEach((point, i) => {
      ctx.fillStyle = i === 0 ? '#ff0000' : '#00ff00';
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const getMostCommon = (arr) => {
    const counts = {};
    arr.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  const translateGesture = (gesture) => {
    const translation = signMapping[gesture];
    if (translation && translation !== translatedText.slice(-translation.length)) {
      const newText = translatedText + translation + ' ';
      setTranslatedText(newText);
      
      // Add to history
      setHistory(prev => [...prev, {
        gesture,
        translation,
        timestamp: new Date().toLocaleTimeString()
      }].slice(-10));
    }
  };

  const speakText = () => {
    if (!translatedText.trim()) return;
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthesis.speak(utterance);
  };

  const clearText = () => {
    setTranslatedText('');
    setHistory([]);
    gestureBufferRef.current = [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
                <Camera className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  SignSpeak AI
                </h1>
                <p className="text-sm text-gray-600">Real-time ASL Translation</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 group ${
                  showDebug ? 'bg-indigo-100 text-indigo-600' : ''
                }`}
                title="Toggle Debug Info"
              >
                <span className="text-sm font-mono font-bold">{'{}'}</span>
              </button>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              >
                <Info size={20} className="text-gray-600 group-hover:text-indigo-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Panel */}
        {showInfo && (
          <div className="mb-8 animate-in slide-in-from-top duration-300">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Info className="text-blue-600" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">How to Use SignSpeak AI</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-indigo-600">1</span>
                    </div>
                    <p className="text-gray-700">Click "Start Camera" to begin gesture recognition</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-indigo-600">2</span>
                    </div>
                    <p className="text-gray-700">Position your hand clearly in front of the camera</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-indigo-600">3</span>
                    </div>
                    <p className="text-gray-700">Hold each gesture steady for 2-3 seconds</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-purple-600">4</span>
                    </div>
                    <p className="text-gray-700">Watch translations appear in real-time</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-purple-600">5</span>
                    </div>
                    <p className="text-gray-700">Use the speaker button for text-to-speech</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium">💡 Powered by MediaPipe AI for accurate hand tracking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Video Feed */}
          <div className="xl:col-span-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Camera className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Live Camera Feed</h2>
                      <p className="text-indigo-100 text-sm">AI-powered gesture recognition</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {!isRecording ? (
                      <button
                        onClick={startCamera}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Play size={20} />
                        Start Camera
                      </button>
                    ) : (
                      <button
                        onClick={stopCamera}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                      >
                        <Square size={20} />
                        Stop Camera
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden aspect-video shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                  />
                  {!isRecording && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="p-4 bg-white/10 rounded-full mb-4 mx-auto w-fit">
                          <Camera size={48} className="opacity-60" />
                        </div>
                        <p className="text-xl font-medium mb-2">Camera Ready</p>
                        <p className="text-gray-300">Click "Start Camera" to begin</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Recording indicator */}
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">LIVE</span>
                    </div>
                  )}
                </div>
                
                {/* Detection Status */}
                {isRecording && (
                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          <p className="text-sm font-medium text-indigo-700">Detected Gesture</p>
                        </div>
                        <p className="text-xl font-bold text-indigo-800">
                          {detectedGesture ? detectedGesture.replace('_', ' ').toUpperCase() : 'SCANNING...'}
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <p className="text-sm font-medium text-green-700">Confidence Level</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold text-green-800">
                            {(confidence * 100).toFixed(1)}%
                          </p>
                          <div className="flex-1 bg-green-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${confidence * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <p className="text-sm font-medium text-purple-700">Status</p>
                        </div>
                        <p className="text-xl font-bold text-purple-800">
                          {detectedGesture ? 'RECOGNIZED' : 'WAITING'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Debug Panel */}
                    {showDebug && debugInfo && (
                      <div className="bg-gray-900 text-green-400 p-4 rounded-xl border border-gray-700 font-mono text-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-300 font-semibold">Debug Information</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-yellow-400 mb-2">Thumb: {debugInfo.thumbExtended ? '👍 Extended' : '👎 Curled'}</div>
                            <div className="space-y-1">
                              {Object.entries(debugInfo.fingers).map(([finger, state]) => (
                                <div key={finger} className="flex justify-between">
                                  <span className="capitalize">{finger}:</span>
                                  <span className={state.extended ? 'text-green-400' : 'text-red-400'}>
                                    {state.extended ? '↑ Extended' : '↓ Curled'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-cyan-400 mb-2">Finger Counts:</div>
                            <div className="space-y-1">
                              <div>Extended: <span className="text-green-400">{debugInfo.counts.extended}</span></div>
                              <div>Curled: <span className="text-red-400">{debugInfo.counts.curled}</span></div>
                            </div>
                            <div className="mt-3 text-xs text-gray-400">
                              Tip: Thumbs up needs thumb extended + 3+ fingers curled
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Translation Output */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 mt-8 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Volume2 className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Translation Output</h2>
                      <p className="text-emerald-100 text-sm">Real-time ASL to text conversion</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={speakText}
                      disabled={!translatedText.trim() || isSpeaking}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                    >
                      <Volume2 size={18} />
                      {isSpeaking ? 'Speaking...' : 'Speak'}
                    </button>
                    <button
                      onClick={clearText}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-semibold"
                    >
                      <RefreshCw size={18} />
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="min-h-40 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 relative overflow-hidden">
                  {translatedText ? (
                    <div className="relative z-10">
                      <p className="text-2xl text-gray-800 leading-relaxed font-medium">
                        {translatedText}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live translation active</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <div className="text-6xl mb-4">✋</div>
                        <p className="text-xl text-gray-600 font-medium mb-2">Ready to translate</p>
                        <p className="text-gray-500">Start making gestures to see translations appear here</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-4 left-4 w-8 h-8 border-2 border-indigo-400 rounded-full animate-ping"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-purple-400 rounded-full animate-ping animation-delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 border-2 border-emerald-400 rounded-full animate-ping animation-delay-2000"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Gesture Reference */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-2xl">👋</span>
                  Gesture Guide
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {Object.entries(signMapping).map(([gesture, meaning]) => (
                  <div key={gesture} className="group hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 p-3 rounded-xl transition-all duration-200 border border-transparent hover:border-violet-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 capitalize group-hover:text-violet-700 transition-colors">
                        {gesture.replace('_', ' ')}
                      </span>
                      <span className="text-lg font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        {meaning}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <div>
                    <p className="text-xs font-semibold text-blue-800 mb-1">Pro Tips:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Hold gestures for 2-3 seconds</li>
                      <li>• Ensure good lighting</li>
                      <li>• Keep hand clearly visible</li>
                      <li>• Maintain steady position</li>
                      <li>• Use debug mode ({'{}'}) for troubleshooting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Translation History */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  Recent History
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">🕐</div>
                      <p className="text-gray-500 text-sm font-medium">No translations yet</p>
                      <p className="text-gray-400 text-xs mt-1">Start gesturing to build history</p>
                    </div>
                  ) : (
                    history.map((item, idx) => (
                      <div key={idx} className="group p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-amber-50 hover:to-orange-50 rounded-xl border border-gray-200 hover:border-amber-200 transition-all duration-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-700 capitalize group-hover:text-amber-700 transition-colors">
                            {item.gesture.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                            {item.timestamp}
                          </span>
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                          {item.translation}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Stats Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Session Stats
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Gestures Detected</span>
                  <span className="text-xl font-bold text-emerald-600">{history.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Status</span>
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                    isRecording 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isRecording ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Confidence</span>
                  <span className="text-lg font-bold text-teal-600">
                    {confidence > 0 ? `${(confidence * 100).toFixed(0)}%` : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default SignLanguageTranslator;