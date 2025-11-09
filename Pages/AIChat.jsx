import React, { useState, useEffect, useRef } from "react";
import { InvokeLLM } from "@/integrations/Core";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  Bot, 
  User as UserIcon,
  Sparkles,
  BookOpen,
  Users,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const SUGGESTED_PROMPTS = [
  {
    icon: GraduationCap,
    title: "Campus Life",
    prompt: "Tell me about hostels and campus facilities at IIITA"
  },
  {
    icon: BookOpen,
    title: "Resume Review",
    prompt: "How can I improve my resume for software engineering roles?"
  },
  {
    icon: Users,
    title: "Interview Prep",
    prompt: "Give me tips for preparing for technical interviews"
  },
  {
    icon: Briefcase,
    title: "Career Path",
    prompt: "What career paths should I consider as a CSE student?"
  }
];

export default function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadUser();
    // Welcome message
    setMessages([
      {
        type: 'bot',
        content: `Welcome to the IIITA AI Assistant! 🎓

I'm here to help you with:
• Campus life and facilities information
• Career guidance and resume tips
• Interview preparation strategies
• Course recommendations
• Placement and internship advice
• Alumni networking suggestions

How can I assist you today?`,
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (messageText = currentMessage) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      // Create context about IIITA and the user
      const context = `You are an AI assistant for IIITA (Indian Institute of Information Technology Allahabad) students. 
      You help with campus life, career guidance, academic advice, and placement preparation.
      
      User context: ${currentUser ? `
      - Name: ${currentUser.full_name}
      - Branch: ${currentUser.branch || 'Not specified'}
      - Year: ${currentUser.year || 'Not specified'}
      - Skills: ${currentUser.skills?.join(', ') || 'Not specified'}
      ` : 'User information not available'}
      
      Provide helpful, accurate, and encouraging responses. If you don't know specific IIITA information, be honest about it.`;

      const response = await InvokeLLM({
        prompt: `${context}\n\nUser question: ${messageText}`,
        add_context_from_internet: true
      });

      const botMessage = {
        type: 'bot',
        content: response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = {
        type: 'bot',
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">IIITA AI Assistant</h1>
              <p className="text-gray-600">Your personal career and campus guide</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar className={`w-10 h-10 flex-shrink-0 ${
                message.type === 'user' 
                  ? 'ring-2 ring-blue-200' 
                  : 'ring-2 ring-indigo-200'
              }`}>
                <AvatarFallback className={
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                }>
                  {message.type === 'user' ? (
                    <UserIcon className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div className={`max-w-[80%] ${
                message.type === 'user' ? 'text-right' : 'text-left'
              }`}>
                <div className={`inline-block p-4 rounded-2xl shadow-sm ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {message.content}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-2 px-2">
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-indigo-200">
                <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm text-gray-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts (show only if no messages except welcome) */}
        {messages.length === 1 && (
          <div className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 justify-start text-left hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                  onClick={() => sendMessage(prompt.prompt)}
                >
                  <prompt.icon className="w-5 h-5 mr-3 text-blue-600" />
                  <div>
                    <div className="font-medium">{prompt.title}</div>
                    <div className="text-sm text-gray-500 mt-1">{prompt.prompt}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm p-4 md:p-6">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about IIITA, careers, or academics..."
                className="pr-12 py-3 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                disabled={isLoading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!currentMessage.trim() || isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI responses are generated and may not always be accurate
          </p>
        </div>
      </div>
    </div>
  );
}