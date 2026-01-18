'use client'
import { useState } from 'react'
import EmotionCam from './components/EmotionCam' // Importing the camera
import { supabase } from '../utils/supabaseClient' // Importing the DB

export default function Home() {
  const [note, setNote] = useState('')

  // Function to save manual entries to Supabase
  const saveMood = async (moodName) => {
    const { error } = await supabase
      .from('entries') // Make sure you created this table in Supabase!
      .insert({ mood: moodName, note: note })

    if (error) {
      console.error('Error saving:', error)
      alert('Error saving mood!')
    } else {
      alert(`Saved: ${moodName}`)
      setNote('')
    }
  }

  return (
    <main className="min-h-screen p-4 flex flex-col items-center bg-gray-50 text-gray-800">
      <h1 className="text-3xl font-bold mt-10 mb-6 text-blue-600">Emotion Tracker</h1>

      {/* 1. The AI Camera Section */}
      <section className="mb-12">
        <EmotionCam />
      </section>

      {/* 2. Manual Logging Section */}
      <section className="w-full max-w-md p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-center">Manual Log</h2>
        
        {/* Note Input */}
        <textarea
          className="w-full p-3 mb-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Why do you feel this way?"
          rows="3"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => saveMood('sad')} className="p-4 bg-red-100 rounded-xl hover:bg-red-200 text-3xl transition">😢</button>
          <button onClick={() => saveMood('neutral')} className="p-4 bg-yellow-100 rounded-xl hover:bg-yellow-200 text-3xl transition">😐</button>
          <button onClick={() => saveMood('happy')} className="p-4 bg-green-100 rounded-xl hover:bg-green-200 text-3xl transition">🤩</button>
        </div>
      </section>
    </main>
  )
}