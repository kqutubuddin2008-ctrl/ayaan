import { create } from 'zustand';
import { initialMessages, users } from '../data/mockData';

export const useCommunicationStore = create((set) => ({
  activeRoom: 'war-room',
  messages: initialMessages,
  presence: users,
  setActiveRoom: (roomId) => set({ activeRoom: roomId }),
  addMessage: (message) => set((state) => ({ messages: state.messages.some((item) => item.id === message.id) ? state.messages : [...state.messages, message] })),
  updateMessage: (messageId, patch) => set((state) => ({ messages: state.messages.map((message) => (message.id === messageId ? { ...message, ...patch } : message)) })),
  setPresence: (presence) => set({ presence })
}));
