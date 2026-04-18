import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const HOST = "generativelanguage.googleapis.com";
const WS_URL = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

export function useGeminiLive() {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<AudioWorkletNode | null>(null);
    const playbackQueueRef = useRef<AudioBuffer[]>([]);
    const isPlayingRef = useRef(false);

    // Play audio strictly in sequence
    const playNextInQueue = useCallback(() => {
        if (!audioContextRef.current || playbackQueueRef.current.length === 0) {
            isPlayingRef.current = false;
            setIsSpeaking(false);
            return;
        }

        isPlayingRef.current = true;
        setIsSpeaking(true);
        const audioBuffer = playbackQueueRef.current.shift()!;
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            playNextInQueue();
        };
        source.start(0);
    }, []);

    const stopMic = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
    }, []);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        stopMic();
        setIsConnected(false);
        setIsSpeaking(false);
        playbackQueueRef.current = [];
        isPlayingRef.current = false;
    }, [stopMic]);

    const startMic = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioCtx({ sampleRate: 16000 });

            await audioContextRef.current.audioWorklet.addModule('/pcm-processor.js');
            const source = audioContextRef.current.createMediaStreamSource(stream);

            processorRef.current = new AudioWorkletNode(audioContextRef.current, 'pcm-processor');

            processorRef.current.port.onmessage = (event) => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

                const float32Data = event.data;
                const pcm16 = new Int16Array(float32Data.length);
                for (let i = 0; i < float32Data.length; i++) {
                    let s = Math.max(-1, Math.min(1, float32Data[i]));
                    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Fast base64 encode
                const buffer = new Uint8Array(pcm16.buffer);
                const binary = String.fromCharCode(...buffer);

                wsRef.current.send(JSON.stringify({
                    realtimeInput: {
                        mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: btoa(binary) }]
                    }
                }));
            };

            source.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);
        } catch (e) {
            console.error("Mic error", e);
            toast.error("Microphone access denied or Worklet failed.");
            disconnect();
        }
    };

    const playAudioBase64 = useCallback((base64: string) => {
        if (!audioContextRef.current) return;
        try {
            const binaryStr = atob(base64);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);
            const pcm16 = new Int16Array(bytes.buffer);

            // Gemini Live returns 24kHz PCM16 audio
            const audioBuffer = audioContextRef.current.createBuffer(1, pcm16.length, 24000);
            const channelData = audioBuffer.getChannelData(0);
            for (let i = 0; i < pcm16.length; i++) {
                channelData[i] = pcm16[i] / 32768.0;
            }

            playbackQueueRef.current.push(audioBuffer);
            if (!isPlayingRef.current) {
                playNextInQueue();
            }
        } catch (e) {
            console.error("Audio block playback error", e);
        }
    }, [playNextInQueue]);

    const connect = useCallback(async (initialContext?: string) => {
        if (!API_KEY) {
            toast.error("Gemini API key is missing.");
            return;
        }

        if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
            return;
        }

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = async () => {
                setIsConnected(true);
                // Setup Live API session with correct model format
                ws.send(JSON.stringify({
                    setup: {
                        model: "models/gemini-2.5-flash-native-audio-latest",
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: "Aoede" }
                                }
                            }
                        }
                    }
                }));

                if (initialContext) {
                    ws.send(JSON.stringify({
                        clientContent: {
                            turns: [{ role: "user", parts: [{ text: "CRITICAL INSTRUCTIONS: You are an expert Voice AI assistant named CourtSense helping a user navigate a legal letter they uploaded. You must be calm and very brief. Here is what they uploaded and the chat history so far: " + initialContext + "\n\nPlease introduce yourself briefly and ask how you can assist." }] }],
                            turnComplete: true
                        }
                    }));
                }

                await startMic();
            };

            ws.onmessage = async (event) => {
                const text = event.data instanceof Blob ? await event.data.text() : event.data;
                try {
                    const data = JSON.parse(text);
                    if (data.serverContent?.modelTurn?.parts) {
                        const parts = data.serverContent.modelTurn.parts;
                        for (const part of parts) {
                            if (part.inlineData && part.inlineData.data) {
                                playAudioBase64(part.inlineData.data);
                            }
                        }
                    }
                } catch (e) {
                    console.error("Parse WS Msg Error", e);
                }
            };

            ws.onerror = (error) => {
                console.error("WS Error:", error);
                toast.error("WebSocket connection error.");
            };

            ws.onclose = (event) => {
                console.warn("WS Closed:", event.code, event.reason);
                if (event.code !== 1000) {
                    toast.error(`Disconnected: ${event.reason || `Code ${event.code}`}`);
                }
                disconnect();
            };

        } catch (e) {
            console.error(e);
            disconnect();
        }
    }, [disconnect, playAudioBase64]);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return { isConnected, isSpeaking, connect, disconnect };
}
