"use client";
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import * as faceapi from 'face-api.js';
import Link from 'next/link';

export default function Home() {
  const [session, setSession] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [mood, setMood] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  // 1. CHECK IF USER IS LOGGED IN
  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load Face Models (Only if logged in)
  useEffect(() => {
    if (session) { 
      const loadModels = async () => {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        console.log('Models Loaded');
      };
      loadModels();
    }
  }, [session]);

  // 3. UPDATED Login Function (Redirects to Home)
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}`, // <--- Changed this to fix the error!
      },
    });
  };

  // 4. Logout Function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCameraActive(false); 
    setMood(null);
  };

  const startVideo = () => {
    setCameraActive(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error(err));
  };

  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current, 
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();

        if (detections.length > 0) {
          const expressions = detections[0].expressions;
          const maxMood = Object.keys(expressions).reduce((a, b) => 
            expressions[a] > expressions[b] ? a : b
          );
          setMood(maxMood);
        }
      }
    }, 500);
  };

  const saveMood = async () => {
    if (!mood) return;
    setLoading(true);

    try {
      // Save to Supabase
      const { error } = await supabase
        .from('entries')
        .insert([{ 
          mood: mood, 
          note: note,
          // user_email: session.user.email // (We can enable this later!)
        }]);

      if (error) throw error;

      // Ask Gemini for a joke
      const response = await fetch('/api/cheer-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: mood }),
      });
      
      const data = await response.json();
      alert(`Saved: ${mood}\n\nAI says: "${data.message}"`);
      setNote('');

    } catch (error) {
      console.error('Error:', error);
      alert('Error saving mood!');
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIN SCREEN (Shown when NOT logged in) ---
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-5">
        <h1 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Emotion Tracker 🔐
        </h1>
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center max-w-md w-full border border-gray-700">
          <p className="text-gray-300 mb-6 text-lg">
            Your private AI journal. Sign in to track your moods securely.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition transform hover:scale-105"
          >
            {/* Simple Google Icon SVG */}
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN APP (Shown when Logged In) ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-5">
      
      <div className="w-full max-w-2xl flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-purple-400">
          Hello, {session.user.user_metadata.full_name?.split(' ')[0]}! 👋
        </h1>
        <button 
          onClick={handleLogout} 
          className="text-sm border border-red-500 text-red-400 px-3 py-1 rounded hover:bg-red-500 hover:text-white transition"
        >
          Sign Out
        </button>
      </div>

      <Link href="/history">
        <button className="mb-6 px-4 py-1 bg-gray-700 rounded-full text-sm hover:bg-gray-600 transition">
          📊 View My History
        </button>
      </Link>

      <div className="relative border-4 border-purple-500 rounded-lg overflow-hidden shadow-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          onPlay={handleVideoOnPlay}
          height={480} 
          width={640} 
        />
        <canvas ref={canvasRef} className="absolute top-0 left-0" />
      </div>

      <div className="mt-6 text-center space-y-4">
        <p className="text-2xl">
          Current Mood: <span className="font-bold text-yellow-400 capitalize">{mood || "Scanning..."}</span>
        </p>

        {!cameraActive && (
          <button 
            onClick={startVideo} 
            className="bg-green-600 px-6 py-2 rounded-lg font-bold hover:bg-green-500 transition"
          >
            Turn On Camera 📸
          </button>
        )}

        <div className="flex flex-col gap-2 w-full max-w-md mx-auto">
          <input 
            type="text" 
            placeholder="Add a note (optional)..." 
            className="p-3 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-purple-500"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          
          <button 
            onClick={saveMood} 
            disabled={loading}
            className="bg-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-purple-500 disabled:opacity-50 transition"
          >
            {loading ? "Asking AI..." : "Save Mood & Get Joke ✨"}
          </button>
        </div>
      </div>
    </div>
  );
}