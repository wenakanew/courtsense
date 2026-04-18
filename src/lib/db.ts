import { db } from "./firebase";
import { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, query, where, arrayUnion } from "firebase/firestore";

export interface UserProfile {
    uid: string;
    country: string;
    createdAt: number;
}

export interface ChatMessage {
    role: "user" | "ai";
    content: string;
    createdAt: number;
}

export interface ChatSession {
    id?: string;
    userId: string;
    title: string;
    createdAt: number;
    messages: ChatMessage[];
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const saveUserProfile = async (uid: string, country: string) => {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { uid, country, createdAt: Date.now() }, { merge: true });
};

export const deleteUserAccountData = async (uid: string) => {
    await deleteDoc(doc(db, "users", uid));
    const chats = await getUserChats(uid);
    for (const chat of chats) {
        if (chat.id) await deleteDoc(doc(db, "chats", chat.id));
    }
};

export const createNewChat = async (userId: string, title: string = "New Legal Analysis", initialMessage?: string) => {
    const chatsRef = collection(db, "chats");
    const newChat: ChatSession = {
        userId,
        title,
        createdAt: Date.now(),
        messages: initialMessage ? [{ role: "user", content: initialMessage, createdAt: Date.now() }] : []
    };
    const docRef = await addDoc(chatsRef, newChat);
    return docRef.id;
};

export const getUserChats = async (userId: string) => {
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const chats: ChatSession[] = [];
    querySnapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() } as ChatSession);
    });
    return chats.sort((a, b) => b.createdAt - a.createdAt);
};

export const getSingleChat = async (chatId: string) => {
    const docRef = doc(db, "chats", chatId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as ChatSession;
    }
    return null;
};

export const addMessageToChat = async (chatId: string, role: "user" | "ai", content: string) => {
    const docRef = doc(db, "chats", chatId);
    const newMessage: ChatMessage = { role, content, createdAt: Date.now() };
    await updateDoc(docRef, {
        messages: arrayUnion(newMessage)
    });
    return newMessage;
};
