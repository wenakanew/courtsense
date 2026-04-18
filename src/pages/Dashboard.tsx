import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Mic, FileText, Plus, Search, Paperclip, Send, UserCircle, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getUserChats, createNewChat, ChatSession, addMessageToChat, getUserProfile, saveUserProfile, deleteUserAccountData, UserProfile } from "@/lib/db";
import { analyzeDocument, chatWithCourtSense } from "@/lib/gemini";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const Dashboard = () => {
    const { user, loading, signOut } = useAuth();
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [promptInput, setPromptInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Account & Onboarding State
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [countryInput, setCountryInput] = useState("");
    const [showSettings, setShowSettings] = useState(false);

    const { isConnected, isSpeaking, connect, disconnect } = useGeminiLive();

    useEffect(() => {
        if (user) {
            getUserChats(user.uid).then(loaded => {
                setChats(loaded);
                if (loaded.length > 0 && !activeChatId) {
                    setActiveChatId(loaded[0].id || null);
                }
            });
            getUserProfile(user.uid).then(p => {
                if (!p || !p.country) {
                    setShowCountryModal(true);
                } else {
                    setProfile(p);
                }
            });
        }
    }, [user, activeChatId]);

    const saveCountry = async () => {
        if (!user || !countryInput.trim()) return;
        await saveUserProfile(user.uid, countryInput.trim());
        setProfile({ uid: user.uid, country: countryInput.trim(), createdAt: Date.now() });
        setShowCountryModal(false);
        toast.success("Preferences saved!");
    };

    const handleNewChat = async () => {
        if (!user) return;
        const id = await createNewChat(user.uid, "Draft Analysis " + new Date().toLocaleDateString());
        const updatedChats = await getUserChats(user.uid);
        setChats(updatedChats);
        setActiveChatId(id);
    };

    const handleSendMessage = async () => {
        const val = promptInput.trim();
        if (!val || !user) return;
        setPromptInput("");
        setIsProcessing(true);

        let targetChatId = activeChatId;

        try {
            if (!targetChatId) {
                targetChatId = await createNewChat(user.uid, "Draft Analysis " + new Date().toLocaleDateString());
                setActiveChatId(targetChatId);
                const freshChats = await getUserChats(user.uid);
                setChats(freshChats);
            }

            await addMessageToChat(targetChatId, "user", val);
            setChats(prev => prev.map(c => c.id === targetChatId ? { ...c, messages: [...c.messages, { role: "user", content: val, createdAt: Date.now() }] } : c));

            // Fetch historical messages for context
            let history: { role: "user" | "ai", content: string }[] = [];
            const currentChat = chats.find(c => c.id === targetChatId);
            if (currentChat) {
                history = currentChat.messages.map(m => ({ role: m.role as "user" | "ai", content: m.content }));
            }

            // Build context for Gemini
            const contextPrefix = profile?.country ? `Jurisdiction: ${profile.country}. ` : "";
            const reply = await chatWithCourtSense(history, val, contextPrefix);

            await addMessageToChat(targetChatId, "ai", reply);

            const updatedChats = await getUserChats(user.uid);
            setChats(updatedChats);
        } catch (err) {
            toast.error("Failed to generate response.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center font-display text-accent">Loading...</div>;
    if (!user) return <Navigate to="/" />;

    const activeChat = chats.find(c => c.id === activeChatId);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <SiteHeader />

            {/* Onboarding Modal */}
            {showCountryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
                        <h2 className="text-xl font-display font-semibold mb-2">Welcome to CourtSense!</h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            To help our AI provide absolutely accurate legal context, please let us know your country/jurisdiction.
                        </p>
                        <input
                            type="text"
                            placeholder="e.g. United States, UK, Canada..."
                            value={countryInput}
                            onChange={e => setCountryInput(e.target.value)}
                            className="w-full rounded-md border border-border bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent mb-4"
                            onKeyDown={e => { if (e.key === 'Enter') saveCountry(); }}
                        />
                        <Button variant="brass" onClick={saveCountry} className="w-full">Save & Continue</Button>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                <PanelGroup direction="horizontal">
                    {/* Column 1: Sidebar */}
                    <Panel defaultSize={20} minSize={15} maxSize={30}>
                        <aside className="h-full border-r border-border/60 bg-card p-4 flex flex-col gap-4">
                            <Button variant="brass" onClick={handleNewChat} className="w-full justify-start gap-2 shadow-sm relative overflow-hidden">
                                <Plus className="h-4 w-4 relative z-10" />
                                <span className="relative z-10">New Chat</span>
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/10 to-transparent"></div>
                            </Button>
                            <div className="relative mt-2">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search past cases..."
                                    className="w-full rounded-md border border-border/80 bg-background/50 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-shadow"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto pr-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-2 pl-1">
                                    History
                                </p>
                                <div className="flex flex-col gap-1">
                                    {chats.map(chat => (
                                        <Button
                                            key={chat.id}
                                            variant={activeChatId === chat.id ? "secondary" : "ghost"}
                                            onClick={() => setActiveChatId(chat.id || null)}
                                            className={`justify-start text-xs font-normal truncate ${activeChatId === chat.id ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground'}`}
                                        >
                                            {chat.title}
                                        </Button>
                                    ))}
                                    {chats.length === 0 && (
                                        <p className="text-xs text-muted-foreground/60 p-2 text-center mt-4">No past analyses.</p>
                                    )}
                                </div>
                            </div>

                            {/* Account Settings Base */}
                            <div className="mt-auto pt-4 border-t border-border/40 relative">
                                <Button onClick={() => setShowSettings(!showSettings)} variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
                                    <UserCircle className="h-4 w-4" />
                                    Account Settings
                                </Button>
                                {showSettings && (
                                    <div className="absolute bottom-14 left-0 w-full rounded-xl border border-border bg-card p-2 shadow-lg z-50 animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="px-2 py-1 mb-1 border-b border-border/40">
                                            <p className="text-xs font-semibold">My Account</p>
                                            <p className="text-[10px] text-muted-foreground">Location: {profile?.country}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => { setShowSettings(false); signOut(); }} className="w-full justify-start gap-2 text-xs text-muted-foreground">
                                            <LogOut className="h-3.5 w-3.5" />
                                            Logout
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={async () => {
                                                setShowSettings(false);
                                                if (confirm("Delete account and all data? This cannot be undone.")) {
                                                    await deleteUserAccountData(user.uid);
                                                    await signOut();
                                                    toast.success("Account deleted.");
                                                }
                                            }}
                                            className="w-full justify-start gap-2 text-xs text-risk-high hover:bg-risk-high/10"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete Account
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-border/40 hover:bg-accent/50 cursor-col-resize transition-colors" />

                    {/* Column 2: AI Chat Area */}
                    <Panel defaultSize={50} minSize={30}>
                        <main className="h-full flex flex-col relative bg-muted/5">
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
                                {!activeChat || activeChat.messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center opacity-70 animate-in fade-in zoom-in duration-500">
                                        <div className="rounded-full bg-accent/10 p-5 mb-5 shadow-inner">
                                            <FileText className="h-10 w-10 text-accent" />
                                        </div>
                                        <h2 className="text-2xl font-display font-semibold mb-3">CourtSense AI Assistant</h2>
                                        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                                            Upload a document or ask a legal question below to get a plain-English translation and context-aware advice over {profile?.country || "your jurisdiction"}.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto pb-4">
                                        {activeChat.messages.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                                    ? 'bg-accent text-accent-foreground rounded-tr-sm'
                                                    : 'bg-card border border-border/60 text-foreground rounded-tl-sm'
                                                    }`}>
                                                    {msg.role === 'user' ? (
                                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                                    ) : (
                                                        <div className="text-sm leading-relaxed [&>p]:mb-3 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:mb-3 [&>ol]:list-decimal [&>ol]:ml-5 [&>strong]:font-semibold [&>h3]:font-bold [&>h3]:mb-1 [&>h2]:font-bold [&>h2]:mb-2">
                                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isProcessing && (
                                            <div className="flex justify-start">
                                                <div className="bg-card border border-border/60 text-foreground rounded-2xl rounded-tl-sm p-4 w-16 flex items-center justify-center shadow-sm">
                                                    <div className="flex space-x-1.5 align-middle">
                                                        <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                        <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Message Input Fields */}
                            <div className="p-4 md:p-6 border-t border-border/40 bg-background/60 backdrop-blur-md">
                                <div className="max-w-3xl mx-auto relative flex items-end gap-2 rounded-2xl border border-border/80 bg-card p-2 shadow-sm focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20 transition-all duration-300">
                                    <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-accent hover:bg-accent/10 h-10 w-10 rounded-xl transition-colors">
                                        <Paperclip className="h-5 w-5" />
                                    </Button>
                                    <textarea
                                        value={promptInput}
                                        onChange={(e) => setPromptInput(e.target.value)}
                                        placeholder="Ask a legal question, or upload a file..."
                                        className="flex-1 max-h-32 min-h-[44px] resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />
                                    <div className="flex items-center gap-1.5">
                                        <Button size="icon" onClick={handleSendMessage} disabled={isProcessing || (!promptInput.trim() && !activeChat)} className="shrink-0 bg-accent text-accent-foreground h-10 w-10 rounded-xl hover:bg-accent/90 shadow-sm transition-all active:scale-95 disabled:opacity-50">
                                            <Send className="h-4 w-4 ml-0.5" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-center text-[10px] text-muted-foreground/70 mt-3 font-medium tracking-wide">
                                    CourtSense AI can make mistakes. Not a substitute for a lawyer.
                                </p>
                            </div>
                        </main>
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-border/40 hover:bg-accent/50 cursor-col-resize transition-colors" />

                    {/* Column 3: sts Voice Mode */}
                    <Panel defaultSize={30} minSize={20} maxSize={40}>
                        <aside className={`h-full border-l border-border/60 p-6 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-sm transition-colors duration-500 ${isConnected ? 'bg-accent/5' : 'bg-card/80'}`}>
                            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent"></div>
                            <h3 className="absolute top-8 font-display font-semibold text-lg text-foreground w-full text-center">
                                {isConnected ? "Connected to CourtSense" : "Live Audio Agent"}
                            </h3>

                            {/* Pulsing Bubble */}
                            <div className="relative flex items-center justify-center w-64 h-64 group mt-8">
                                {isConnected ? (
                                    <>
                                        <div className="absolute inset-0 bg-risk-low/20 rounded-full animate-ping opacity-70 [animation-duration:3s]"></div>
                                        <div className={`absolute inset-4 bg-risk-low/30 rounded-full ${isSpeaking ? 'animate-bounce' : 'animate-pulse'} [animation-duration:1s]`}></div>
                                        <div className="absolute inset-10 bg-risk-low/40 rounded-full blur-xl animate-pulse"></div>
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-accent/5 rounded-full animate-ping opacity-70 [animation-duration:3s]"></div>
                                        <div className="absolute inset-6 bg-accent/10 rounded-full animate-pulse [animation-duration:2s]"></div>
                                        <div className="absolute inset-10 bg-accent/20 rounded-full blur-xl"></div>
                                    </>
                                )}

                                <Button
                                    onClick={() => {
                                        if (isConnected) {
                                            disconnect();
                                        } else {
                                            const contextContent = activeChat ? activeChat.messages.map(m => m.role + ": " + m.content).join("\n") : "No previous context provided.";
                                            connect(`Country jurisdiction: ${profile?.country || "Earth"}\n\nChat context: ${contextContent}`);
                                        }
                                    }}
                                    className={`relative z-10 w-36 h-36 rounded-full text-foreground shadow-xl transition-all duration-500 flex flex-col items-center justify-center gap-3 border-4 ${isConnected
                                        ? 'bg-gradient-to-br from-risk-low to-green-600 border-risk-low/50 shadow-risk-low/50 shadow-2xl scale-[1.05]'
                                        : 'bg-gradient-to-br from-background to-card border-accent/20 group-hover:border-accent/40 hover:shadow-2xl hover:scale-[1.02]'
                                        }`}
                                >
                                    <div className={`p-4 rounded-full transition-colors duration-500 ${isConnected ? 'text-white' : 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-amber-50'}`}>
                                        <Mic className={`h-8 w-8 ${isConnected && isSpeaking ? 'animate-bounce' : ''}`} />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isConnected ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                        {isConnected ? "DISCONNECT" : "CONNECT"}
                                    </span>
                                </Button>
                            </div>

                            <div className="mt-14 text-center max-w-[280px]">
                                <div className={`inline-flex items-center gap-2 mb-3 rounded-full px-3 py-1 ring-1 ${isConnected ? 'bg-risk-low/20 ring-risk-low/50' : 'bg-muted/50 ring-border'}`}>
                                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-risk-low animate-none' : 'bg-risk-low/80 animate-pulse'}`}></div>
                                    <span className={`text-[10px] font-semibold tracking-wider uppercase ${isConnected ? 'text-risk-low font-bold' : 'text-muted-foreground'}`}>
                                        {isConnected ? 'LIVE SESSION ACTIVE' : profile?.country || "jurisdiction"}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {isConnected ? "Speak normally into your microphone. CourtSense is analyzing your question in real-time." : "The voice agent securely links to your document. Talk to it to ask questions directly about "}
                                    {!isConnected && <strong>{activeChat?.title || "your active case"}</strong>}
                                    {!isConnected && "."}
                                </p>
                            </div>
                        </aside>
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
};

export default Dashboard;
