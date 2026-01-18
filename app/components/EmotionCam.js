'use client'
import { useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'

export default function EmotionCam() {
  const videoRef = useRef()
  const [emotion, setEmotion] = useState('Neutral')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(false)

  // Load the Brain (Models)
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models' 
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ])
        setModelsLoaded(true)
      } catch (e) {
        console.error("Error loading models:", e)
      }
    }
    loadModels()
  }, [])

  // Helper function to make the AI speak
  const speak = (text) => {
    // Cancel any current speech so it speaks immediately
    window.speechSynthesis.cancel()
    
    const msg = new SpeechSynthesisUtterance(text)
    msg.rate = 1.0 // Normal speed
    msg.pitch = 1.0 // Normal pitch
    
    msg.onstart = () => setIsSpeaking(true)
    msg.onend = () => setIsSpeaking(false)
    
    window.speechSynthesis.speak(msg)
  }

  const startVideo = () => {
    speak("Camera Activated") // <--- Sound Effect
    setIsCameraOn(true)
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
      .catch((err) => {
        console.error("Camera error:", err)
        speak("Camera Access Denied")
        setIsCameraOn(false)
      })
  }

  const stopVideo = () => {
    speak("Camera Deactivated") // <--- Sound Effect
    setIsCameraOn(false)
    
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const handleVideoPlay = () => {
    setInterval(async () => {
      if (!videoRef.current || !modelsLoaded || !isCameraOn) return

      try {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions()

        if (detections.length > 0) {
          const expressions = detections[0].expressions
          const maxEmotion = Object.keys(expressions).reduce((a, b) => 
            expressions[a] > expressions[b] ? a : b
          )

          // Only speak if the emotion changed to avoid spamming
          if (maxEmotion !== emotion) {
            setEmotion(maxEmotion)
            speak(`You look ${maxEmotion}`)
          }
        }
      } catch (e) {
        // console.log(e)
      }
    }, 2000)
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded-xl bg-white shadow-lg text-black w-full max-w-sm transition-all duration-300">
      <div className="flex justify-between w-full items-center mb-2">
        <h2 className="text-xl font-bold">AI Mirror</h2>
        {/* Status Light */}
        <div className={`w-3 h-3 rounded-full ${isCameraOn ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      </div>
      
      {!modelsLoaded && <p className="text-yellow-600 text-sm font-semibold">Loading Brain...</p>}

      {!isCameraOn ? (
        <div className="h-60 w-full bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <button 
            onClick={startVideo}
            disabled={!modelsLoaded}
            className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:scale-105 active:scale-95"
          >
            {modelsLoaded ? "Turn On Camera 📸" : "Waiting..."}
          </button>
        </div>
      ) : (
        <>
          <div className="relative w-full">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              onPlay={handleVideoPlay}
              className="rounded-lg bg-black border-2 border-blue-500 w-full"
            />
            <div className="absolute bottom-2 left-2 bg-black/60 text-white px-3 py-1 rounded text-sm backdrop-blur-sm border border-white/20">
              <span className="font-bold uppercase text-yellow-400">{emotion}</span>
            </div>
          </div>

          <button 
            onClick={stopVideo}
            className="bg-red-500 text-white px-8 py-2 rounded-full hover:bg-red-600 text-sm font-bold shadow-md hover:scale-105 transition"
          >
            Turn Off
          </button>
        </>
      )}
    </div>
  )
}