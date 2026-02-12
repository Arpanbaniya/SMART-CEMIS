import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Send, Trash2, Download, FileIcon, X, Edit2, Save } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { chatroomService, ChatMessage, ChatFile } from '@/services/chatroomService';
import './chatroom.css';

export function ChatroomPage() {
  const { user } = useAuth();
  const socket = useSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    phone: '',
    bio: '',
    preference: 'physical'
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const msgs = await chatroomService.getMessages();
        setMessages(msgs);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, []);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile', { credentials: 'include' });
        if (response.ok) {
          const profileData = await response.json();
          setProfile(profileData);
          setEditForm({
            phone: profileData.phone || '',
            bio: profileData.bio || '',
            preference: profileData.preference || 'physical'
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };

    loadProfile();
  }, []);

  // Socket connections
  useEffect(() => {
    if (!socket) return;

    socket.emit('joinChatroom');

    socket.on('newMessage', (data: any) => {
      setMessages(prev => [...prev, data]);
      scrollToBottom();
    });

    socket.on('messageRemoved', (data: any) => {
      setMessages(prev =>
        prev.map(msg =>
          msg._id === data.messageId
            ? { ...msg, isDeleted: true }
            : msg
        )
      );
    });

    socket.on('adminJoined', () => {
      setError(null);
    });

    return () => {
      socket.emit('leaveChatroom');
      socket.off('newMessage');
      socket.off('messageRemoved');
      socket.off('adminJoined');
    };
  }, [socket]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() && selectedFiles.length === 0) return;

    setIsSending(true);
    try {
      if (selectedFiles.length > 0) {
        await chatroomService.sendMessageWithFiles(input, selectedFiles);
      } else {
        await chatroomService.sendMessage(input);
      }

      // Don't add to state - let the server broadcast it back via socket
      setInput('');
      setSelectedFiles([]);
      // scrollToBottom is called when socket 'newMessage' event fires
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string | undefined) => {
    if (!messageId) return;

    try {
      await chatroomService.deleteMessage(messageId);
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId
            ? { ...msg, isDeleted: true }
            : msg
        )
      );
      socket?.emit('messageDeleted', { messageId, deletedBy: user?.id });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete message');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProfileSave = async () => {
    if (!profile || profile.role === 'super_admin') return;
    
    try {
      setIsSavingProfile(true);
      await apiRequest('PATCH', '/api/profile', editForm);
      setProfile({ ...profile, ...editForm });
      setIsEditingProfile(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const canDeleteMessage = (msg: ChatMessage) => {
    const isSuperAdmin = user?.role === 'super_admin';
    const isOwner = msg.userId === user?.id;
    return isSuperAdmin || isOwner;
  };

  const isImageFile = (file: ChatFile) => {
    return file.mimeType.startsWith('image/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">Admin Chatroom</h1>
          <p className="text-blue-100 mt-1">Communication hub for admins and student admins</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full h-full p-6 flex gap-6">
          {/* Profile Sidebar */}
          {profile && profile.role !== 'super_admin' && (
            <div className="w-64 flex-shrink-0">
              <Card className="bg-slate-800 border-slate-700 sticky top-0">
                <CardHeader className="border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-blue-200">My Profile</CardTitle>
                    {!isEditingProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-400 hover:text-blue-300"
                        onClick={() => setIsEditingProfile(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <ScrollArea className="h-96">
                  <CardContent className="p-4 space-y-4">
                    {/* Display Mode */}
                    {!isEditingProfile ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-slate-400 text-xs">Full Name</Label>
                          <p className="text-slate-200 font-semibold">
                            {user?.firstName} {user?.lastName || ''}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-400 text-xs">Email</Label>
                          <p className="text-slate-200 text-sm break-all">{user?.email}</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-400 text-xs">Phone</Label>
                          <p className="text-slate-200">{profile.phone || 'Not provided'}</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-slate-400 text-xs">Preference</Label>
                          <p className="text-slate-200">
                            {profile.preference === 'physical'
                              ? 'Physical Activities'
                              : profile.preference === 'innovative'
                              ? 'Innovative/Tech'
                              : 'Both'}
                          </p>
                        </div>

                        {profile.bio && (
                          <div className="space-y-2">
                            <Label className="text-slate-400 text-xs">Bio</Label>
                            <p className="text-slate-200 text-sm">{profile.bio}</p>
                          </div>
                        )}

                        <div className="text-xs text-slate-400 pt-2 border-t border-slate-700">
                          Role: <span className="text-blue-300">{profile.role}</span>
                        </div>
                      </>
                    ) : (
                      /* Edit Mode */
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-slate-300">
                            Phone
                          </Label>
                          <Input
                            id="phone"
                            value={editForm.phone}
                            onChange={(e) =>
                              setEditForm({ ...editForm, phone: e.target.value })
                            }
                            className="bg-slate-700 border-slate-600 text-white"
                            placeholder="Enter phone number"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preference" className="text-slate-300">
                            Preference
                          </Label>
                          <Select
                            value={editForm.preference}
                            onValueChange={(value) =>
                              setEditForm({ ...editForm, preference: value })
                            }
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              <SelectItem value="physical">Physical Activities</SelectItem>
                              <SelectItem value="innovative">Innovative/Tech</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio" className="text-slate-300">
                            Bio
                          </Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) =>
                              setEditForm({ ...editForm, bio: e.target.value })
                            }
                            className="bg-slate-700 border-slate-600 text-white min-h-20 resize-none"
                            placeholder="Tell us about yourself"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={handleProfileSave}
                            disabled={isSavingProfile}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            onClick={() => setIsEditingProfile(false)}
                            disabled={isSavingProfile}
                            variant="outline"
                            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </ScrollArea>
              </Card>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages Area */}
          <Card className="flex-1 flex flex-col bg-slate-800 border-slate-700 shadow-2xl mb-6">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-blue-200">Chat Messages</CardTitle>
            </CardHeader>

            <ScrollArea className="flex-1" ref={scrollRef}>
              <CardContent className="p-6 space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg._id}
                      className="p-4 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors group"
                    >
                      {msg.isDeleted ? (
                        <p className="text-slate-400 italic">This message was deleted</p>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-blue-300">{msg.username}</p>
                              <p className="text-xs text-slate-400">
                                {msg.userRole === 'super_admin' ? '👑 SuperAdmin' : '👤 Student Admin'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-slate-400">
                                {new Date(msg.createdAt || '').toLocaleString()}
                              </p>
                              {canDeleteMessage(msg) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-red-400 hover:bg-red-950"
                                  onClick={() => handleDeleteMessage(msg._id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-200 mb-3 break-words">{msg.content}</p>

                          {msg.files && msg.files.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              {msg.files.map((file, idx) => (
                                <div key={idx}>
                                  {isImageFile(file) ? (
                                    <div className="relative group">
                                      <img
                                        src={chatroomService.getFileUrl(file.filePath)}
                                        alt={file.originalFileName}
                                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
                                      />
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                                        onClick={() =>
                                          chatroomService.downloadFile(
                                            file.filePath,
                                            file.originalFileName
                                          )
                                        }
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        Download
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-slate-600 rounded-lg flex items-center gap-2">
                                      <FileIcon className="h-4 w-4 text-blue-400" />
                                      <span className="text-xs text-slate-200 truncate flex-1">
                                        {file.originalFileName}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() =>
                                          chatroomService.downloadFile(
                                            file.filePath,
                                            file.originalFileName
                                          )
                                        }
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </ScrollArea>
          </Card>

          {/* Error Alert */}
          {error && (
            <Card className="bg-red-950 border-red-800 mb-4">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-200 font-semibold">Error</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
              <p className="text-sm font-semibold text-blue-300 mb-2">Attached files ({selectedFiles.length}):</p>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-600 px-3 py-1 rounded-lg text-sm text-slate-200"
                  >
                    <FileIcon className="h-3 w-3" />
                    <span className="truncate max-w-xs">{file.name}</span>
                    <button
                      onClick={() => removeFile(idx)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isSending}
                    className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-450"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                    className="border-slate-600 text-blue-300 hover:bg-blue-950"
                  >
                    📎 Attach
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!input.trim() && selectedFiles.length === 0) || isSending}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
