import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { AndroidForegroundServiceManager } from './src/native/AndroidForegroundService';
import { IOSAppIntentManager } from './src/native/IOSAppIntentBridge';

export default function App() {
  const [assistantState, setAssistantState] = useState<'idle' | 'listening' | 'speaking' | 'translating'>('idle');
  const [messages, setMessages] = useState<Array<{ id: string; role: string; text: string }>>([
    { id: '1', role: 'assistant', text: 'Hello! I am Aura, your multilingual AI companion. Tap the microphone or say "Hey Assistant" to begin.' },
  ]);
  const [currentMode, setCurrentMode] = useState<'assistant' | 'text_to_text' | 'voice_to_voice'>('assistant');

  useEffect(() => {
    // Platform-specific background setup
    if (Platform.OS === 'android') {
      const androidService = new AndroidForegroundServiceManager();
      androidService.startService({
        notificationTitle: 'Aura Voice AI Active',
        notificationBody: 'Listening for "Hey Assistant"',
        wakeWordKeyword: 'Hey Assistant',
      });
    } else if (Platform.OS === 'ios') {
      IOSAppIntentManager.donateShortcuts();
    }
  }, []);

  const handleMicPress = () => {
    if (assistantState === 'listening') {
      setAssistantState('speaking');
      setMessages(prev => [
        ...prev,
        { id: String(Date.now()), role: 'user', text: '¿Dónde puedo tomar el tren hacia Madrid?' },
        { id: String(Date.now() + 1), role: 'assistant', text: 'You can take the train to Madrid from the central platform at station 4.' },
      ]);
      setTimeout(() => setAssistantState('idle'), 2500);
    } else {
      setAssistantState('listening');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Mobile Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Aura Voice AI</Text>
          <Text style={styles.headerSubtitle}>
            {Platform.OS === 'android' ? 'Foreground Service Active' : 'Siri Shortcuts Ready'}
          </Text>
        </View>
        <View style={[styles.badge, assistantState === 'listening' ? styles.badgeActive : styles.badgeIdle]}>
          <Text style={styles.badgeText}>
            {assistantState === 'listening' ? 'LISTENING' : assistantState === 'speaking' ? 'SPEAKING' : 'READY'}
          </Text>
        </View>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeContainer}>
        {(['assistant', 'text_to_text', 'voice_to_voice'] as const).map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => setCurrentMode(m)}
            style={[styles.modeButton, currentMode === m && styles.modeButtonActive]}
          >
            <Text style={[styles.modeButtonText, currentMode === m && styles.modeButtonTextActive]}>
              {m === 'assistant' ? 'Assistant' : m === 'text_to_text' ? 'Translate' : 'Voice-to-Voice'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Messages */}
      <ScrollView style={styles.chatScroll} contentContainerStyle={styles.chatContent}>
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                msg.role === 'user' ? styles.userText : styles.assistantText,
              ]}
            >
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleMicPress}
          activeOpacity={0.8}
          style={[
            styles.micButton,
            assistantState === 'listening' ? styles.micButtonListening : styles.micButtonIdle,
          ]}
        >
          <Text style={styles.micButtonIcon}>
            {assistantState === 'listening' ? '⏹' : '🎙️'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.hintText}>
          {assistantState === 'listening' ? 'Tap to finish query' : 'Tap to speak or use Siri / Foreground Service'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeIdle: {
    backgroundColor: '#1e293b',
  },
  badgeActive: {
    backgroundColor: '#ef4444',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: '#131c2e',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 14,
    padding: 3,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 11,
  },
  modeButtonActive: {
    backgroundColor: '#6366f1',
  },
  modeButtonText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 14,
    borderRadius: 18,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#192238',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#e2e8f0',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#6366f1',
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  micButtonIdle: {
    backgroundColor: '#6366f1',
  },
  micButtonListening: {
    backgroundColor: '#ef4444',
  },
  micButtonIcon: {
    fontSize: 28,
  },
  hintText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 10,
  },
});
