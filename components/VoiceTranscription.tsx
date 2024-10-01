'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Copy, RotateCw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type TranscriptionItem = {
  transcription: string
  rephrased: string
}

export default function VoiceTranscription() {
  const [isRecording, setIsRecording] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Ready to record')
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorderRef.current = new MediaRecorder(stream)
          mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data)
          }
          mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
            await handleTranscription(audioBlob)
            audioChunksRef.current = []
          }
        })
        .catch(error => {
          console.error('Error accessing microphone:', error)
          setStatusMessage('Error: Unable to access microphone')
        })
    }
  }, [])

  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      setStatusMessage('Processing...')
    } else {
      mediaRecorderRef.current?.start()
      setStatusMessage('Recording...')
    }
    setIsRecording(!isRecording)
  }

  const handleTranscription = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')
      
      const transcriptionResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })
      const transcriptionData = await transcriptionResponse.json()

      const rephrasingResponse = await fetch('/api/rephrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcriptionData.text }),
      })
      const rephrasingData = await rephrasingResponse.json()

      setTranscriptions(prev => [{
        transcription: transcriptionData.text,
        rephrased: rephrasingData.text,
      }, ...prev])
      setStatusMessage('Ready to record')
    } catch (error) {
      console.error('Error during transcription or rephrasing:', error)
      setStatusMessage('Error: Failed to process audio')
    }
  }

  const handleRephrase = async (index: number) => {
    setStatusMessage('Rephrasing...')
    try {
      const response = await fetch('/api/rephrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcriptions[index].transcription }),
      })
      const data = await response.json()
      const updatedTranscriptions = [...transcriptions]
      updatedTranscriptions[index].rephrased = data.text
      setTranscriptions(updatedTranscriptions)
      setStatusMessage('Ready to record')
    } catch (error) {
      console.error('Error during rephrasing:', error)
      setStatusMessage('Error: Failed to rephrase')
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setStatusMessage('Copied to clipboard')
    setTimeout(() => setStatusMessage('Ready to record'), 2000)
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 text-white">
      <h1 className="text-2xl font-bold text-center">Voice Transcription</h1>
      
      {transcriptions.map((item, index) => (
        <Card key={index} className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M12 8c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2s2-.9 2-2v-4c0-1.1-.9-2-2-2z" />
                <path d="M17 12v2c0 2.8-2.2 5-5 5s-5-2.2-5-5v-2" />
              </svg>
              Transcription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">{item.transcription}</p>
          </CardContent>
        </Card>
      ))}

      {transcriptions.map((item, index) => (
        <Card key={`rephrased-${index}`} className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="m7 7 10 10-5 5V2l5 5L7 17" />
              </svg>
              Rephrased
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">{item.rephrased}</p>
            <div className="flex justify-end mt-2 space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleRephrase(index)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(item.rephrased)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="fixed bottom-4 left-0 right-0 flex justify-center">
        <Button
          className={`rounded-full w-16 h-16 ${
            isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
          onClick={toggleRecording}
        >
          <Mic className="h-8 w-8 text-white" />
        </Button>
      </div>

      <div className="fixed bottom-20 left-0 right-0 text-center">
        <p className="text-sm text-gray-400">{statusMessage}</p>
      </div>
    </div>
  )
}