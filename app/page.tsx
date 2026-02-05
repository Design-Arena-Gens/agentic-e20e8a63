'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'

interface Message {
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
          handleUserSpeech(finalTranscript.trim())
        } else {
          setTranscript(prev => prev + interimTranscript)
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const handleUserSpeech = async (text: string) => {
    if (!text || isProcessing) return

    setIsProcessing(true)
    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages })
      })

      const data = await response.json()

      const agentMessage: Message = {
        role: 'agent',
        content: data.response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, agentMessage])

      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`)
        audio.play()
      } else {
        speakText(data.response)
      }
    } catch (error) {
      console.error('Error processing speech:', error)
      const errorMessage: Message = {
        role: 'agent',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      window.speechSynthesis.speak(utterance)
    }
  }

  const startCall = async () => {
    setIsCallActive(true)
    setMessages([{
      role: 'agent',
      content: 'Hello! I\'m your AI call agent. How can I help you today?',
      timestamp: new Date()
    }])

    speakText('Hello! I\'m your AI call agent. How can I help you today?')

    if (recognitionRef.current) {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const endCall = () => {
    setIsCallActive(false)
    setIsRecording(false)

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    setMessages(prev => [...prev, {
      role: 'agent',
      content: 'Call ended. Thank you for using our service!',
      timestamp: new Date()
    }])
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>AI Call Agent</h1>
        <p className={styles.subtitle}>Voice-Enabled AI Assistant</p>

        <div className={styles.callInterface}>
          {!isCallActive ? (
            <button
              className={`${styles.callButton} ${styles.startCall}`}
              onClick={startCall}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>Start Call</span>
            </button>
          ) : (
            <div className={styles.activeCall}>
              <div className={styles.recordingIndicator}>
                {isRecording && (
                  <div className={styles.pulse}>
                    <div className={styles.pulseRing}></div>
                    <div className={styles.pulseDot}></div>
                  </div>
                )}
                <span>{isRecording ? 'Listening...' : 'Call Active'}</span>
              </div>

              <button
                className={`${styles.callButton} ${styles.endCall}`}
                onClick={endCall}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.79 15.41C18.25 15.41 16.72 15.18 15.29 14.73C14.78 14.56 14.21 14.7 13.83 15.08L11.62 17.29C8.38996 15.64 6.37996 13.63 4.72996 10.39L6.94996 8.17C7.32996 7.79 7.46996 7.22 7.29996 6.71C6.84996 5.28 6.61996 3.75 6.61996 2.21C6.61996 1.55 6.06996 1 5.40996 1H2.19996C1.53996 1 0.989961 1.55 0.989961 2.21C0.989961 13.18 9.81996 22 20.79 22C21.45 22 22 21.45 22 20.79V17.62C22 16.96 21.45 16.41 20.79 16.41H19.79V15.41Z"/>
                </svg>
                <span>End Call</span>
              </button>
            </div>
          )}
        </div>

        {isCallActive && (
          <div className={styles.chatContainer}>
            <div className={styles.messages}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${styles.message} ${styles[msg.role]}`}
                >
                  <div className={styles.messageContent}>
                    <strong>{msg.role === 'user' ? 'You' : 'Agent'}:</strong>
                    <p>{msg.content}</p>
                  </div>
                  <span className={styles.timestamp}>
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {isProcessing && (
                <div className={`${styles.message} ${styles.agent}`}>
                  <div className={styles.messageContent}>
                    <strong>Agent:</strong>
                    <p className={styles.typing}>Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🎤</div>
            <h3>Voice Recognition</h3>
            <p>Automatic speech-to-text conversion</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🤖</div>
            <h3>AI Processing</h3>
            <p>Intelligent response generation</p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🔊</div>
            <h3>Text-to-Speech</h3>
            <p>Natural voice responses</p>
          </div>
        </div>
      </div>
    </main>
  )
}
