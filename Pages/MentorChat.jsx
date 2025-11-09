import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/entities/ChatMessage";
import { MentorshipRequest } from "@/entities/MentorshipRequest";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Send, 
  Paperclip,
  Video,
  Phone,
  FileText,
  Download,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function MentorChatPage() {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [mentorshipRequest, setMentorshipRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const requestId = urlParams.get('request_id');

  useEffect(() => {
    if (requestId) {
      loadChatData();
    } else {
      setIsLoading(false);
    }
  }, [requestId]);

  const loadChatData = async () => {
    try {
      const [user, request] = await Promise.all([
        User.me(),
        MentorshipRequest.get(requestId)
      ]);
      setCurrentUser(user);
      setMentorshipRequest(request);

      const otherUserId = user.id === request.student_id ? request.mentor_id : request.student_id;
      const otherUserProfile = await User.get(otherUserId);
      setOtherUser(otherUserProfile);

      const chatMessages = await ChatMessage.filter({ mentorship_request_id: requestId }, 'created_date');
      setMessages(chatMessages);
    } catch (error) {
      console.error("Error loading chat data:", error);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const newMessage = await ChatMessage.create({
        mentorship_request_id: requestId,
        sender_id: currentUser.id,
        receiver_id: otherUser.id,
        content: currentMessage,
      });
      setMessages(prev => [...prev, newMessage]);
      setCurrentMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
    setIsSending(false);
  };
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSending(true);
    try {
      const { file_url } = await UploadFile({ file });
      const newMessage = await ChatMessage.create({
        mentorship_request_id: requestId,
        sender_id: currentUser.id,
        receiver_id: otherUser.id,
        content: ``, // Content can be empty for file messages
        file_url: file_url,
        file_name: file.name,
      });
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading Chat...</p>
      </div>
    );
  }

  if (!mentorshipRequest) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-red-500">Could not find mentorship session.</p>
        <Link to={createPageUrl("Mentors")}>
          <Button className="mt-4">Back to Mentors</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Mentors")}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Avatar className="w-10 h-10 ring-2 ring-blue-200">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold">
                {otherUser.full_name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{otherUser.full_name}</h1>
              <p className="text-sm text-green-600">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setShowCallDialog(true)}>
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowCallDialog(true)}>
              <Video className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.sender_id === currentUser.id ? 'flex-row-reverse' : 'flex-row'}`}>
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className={message.sender_id === currentUser.id ? 'bg-blue-500 text-white' : 'bg-gray-300'}>
                {message.sender_id === currentUser.id ? currentUser.full_name?.slice(0,1) : otherUser.full_name?.slice(0,1)}
              </AvatarFallback>
            </Avatar>
            <div className={`max-w-[75%]`}>
              <div className={`inline-block p-3 rounded-2xl shadow-sm ${message.sender_id === currentUser.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                {message.file_url ? (
                  <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    <FileText className="w-8 h-8 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{message.file_name || "Shared File"}</p>
                      <p className="text-xs opacity-80">Click to view/download</p>
                    </div>
                    <Download className="w-5 h-5" />
                  </a>
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
              </div>
              <p className={`text-xs text-gray-500 mt-1 px-1 ${message.sender_id === currentUser.id ? 'text-right' : 'text-left'}`}>
                {new Date(message.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto flex gap-3 items-center">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current.click()} disabled={isSending}>
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button onClick={handleSendMessage} disabled={!currentMessage.trim() || isSending}>
            {isSending ? '...' : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      
      {/* Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice/Video Call</DialogTitle>
            <DialogDescription>
              This platform does not have a built-in calling feature. Please use an external service like Google Meet, Zoom, or a simple phone call to connect with your mentor.
              <br/><br/>
              You can share meeting links directly in the chat.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowCallDialog(false)}>Got it</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}