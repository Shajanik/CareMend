
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomButton from '../components/CustomButton';
import { API_CONFIG } from '../config/api';
import { getStoredUser } from '../config/authService';

interface Props {
  disease: 'Osteoporosis';
  onBack: () => void;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  type: 'text' | 'image' | 'audio' | 'video';
  isMe: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  avatar?: string;
  isBot?: boolean;
  userId?: number;
  createdAt?: string;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
  isBot?: boolean;
}

// Simulated Socket.IO-like event system
class ChatSocket {
  private listeners: { [event: string]: Function[] } = {};
  private connected = true;

  emit(event: string, data: any) {
    console.log(`[Socket] Emitting ${event}:`, data);
    
    // Simulate server processing delay
    setTimeout(() => {
      if (event === 'send_message') {
        this.trigger('message_sent', { 
          id: data.id, 
          status: 'sent',
          timestamp: new Date().toISOString()
        });
        
        // Simulate server response with context-aware reply
        setTimeout(() => {
          const response = this.generateContextualResponse(data.message);
          this.trigger('new_message', response);
        }, Math.random() * 2000 + 1000);
      }
    }, 100);
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private trigger(event: string, data: any) {
    console.log(`[Socket] Received ${event}:`, data);
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  private generateContextualResponse(userMessage: string): Message {
    const message = userMessage.toLowerCase();
    let response = '';
    let sender = '';
    let avatar = '';

    // Context-aware responses based on message content
    if (message.includes('pain') || message.includes('hurt')) {
      response = "I understand dealing with pain can be really challenging. Have you discussed pain management options with your doctor? Many of us here have found relief through various approaches.";
      sender = "Dr. Sarah Wilson";
      avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=DrSarah&backgroundColor=dcfce7";
    } else if (message.includes('exercise') || message.includes('workout')) {
      response = "Exercise is so important for bone health! 💪 I've been doing weight-bearing exercises and they've really helped. What kind of activities are you considering?";
      sender = "Emma Smith";
      avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc";
    } else if (message.includes('medication') || message.includes('medicine')) {
      response = "Medication management is crucial. Make sure to follow your doctor's instructions and don't hesitate to ask about side effects. We're here to support you through your treatment journey.";
      sender = "Dr. Sarah Wilson";
      avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=DrSarah&backgroundColor=dcfce7";
    } else if (message.includes('diet') || message.includes('calcium') || message.includes('vitamin')) {
      response = "Nutrition plays a huge role in bone health! I've been focusing on calcium-rich foods and vitamin D. Have you worked with a nutritionist? They can be really helpful.";
      sender = "John Doe";
      avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=c7d2fe";
    } else if (message.includes('test') || message.includes('scan') || message.includes('results')) {
      response = "Test results can be nerve-wracking! Remember that early detection and monitoring are positive steps. Your healthcare team is there to guide you through understanding and acting on the results.";
      sender = "Dr. Sarah Wilson";
      avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=DrSarah&backgroundColor=dcfce7";
    } else if (message.includes('scared') || message.includes('worried') || message.includes('anxious')) {
      response = "It's completely normal to feel anxious about health concerns. You're not alone in this journey - this community is here to support you. Have you considered speaking with a counselor who specializes in health anxiety?";
      sender = "Emma Smith";
      avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc";
    } else if (message.includes('thank') || message.includes('grateful')) {
      response = "Your positive attitude is inspiring! 🌟 It's wonderful to see community members supporting each other. That's what makes this forum so special.";
      sender = "John Doe";
      avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=c7d2fe";
    } else if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      response = "Hello and welcome! 👋 It's great to have you here. Feel free to share what's on your mind - we're all here to support each other.";
      sender = "Emma Smith";
      avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc";
    } else {
      // Default contextual responses
      const responses = [
        {
          text: "That's a really important point you've raised. Many of us in the community have similar experiences. What has your doctor recommended?",
          sender: "Dr. Sarah Wilson",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=DrSarah&backgroundColor=dcfce7"
        },
        {
          text: "Thanks for sharing that with us. It's helpful to hear different perspectives and experiences from the community. 💙",
          sender: "Emma Smith", 
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc"
        },
        {
          text: "I can relate to what you're going through. The support in this community has been invaluable for my own journey. Feel free to ask any questions!",
          sender: "John Doe",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=c7d2fe"
        }
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      response = randomResponse.text;
      sender = randomResponse.sender;
      avatar = randomResponse.avatar;
    }

    return {
      id: Date.now().toString() + '_bot',
      sender,
      text: response,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      isMe: false,
      status: 'read',
      avatar,
      isBot: true
    };
  }

  disconnect() {
    this.connected = false;
    this.listeners = {};
  }

  get isConnected() {
    return this.connected;
  }
}

// Global socket instance (simulating Flask-SocketIO connection)
const socket = new ChatSocket();

const CommunityForum: React.FC<Props> = ({ disease, onBack }) => {
  const [isJoined, setIsJoined] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Simulate Flask static file serving for avatars
  const getStaticAvatarUrl = useCallback((filename: string) => {
    // Simulating Flask's url_for('static', filename='images/...')
    return `/static/images/${filename}`;
  }, []);

  // Enhanced avatar fallback system (simulating Flask static files)
  const getAvatarUrl = useCallback((sender: string, customAvatar?: string) => {
    if (customAvatar) return customAvatar;
    
    // Simulate Flask static avatar files
    const staticAvatars: { [key: string]: string } = {
      'Emma Smith': 'emma_avatar.png',
      'John Doe': 'john_avatar.png', 
      'Dr. Sarah Wilson': 'dr_sarah_avatar.png',
      'You': 'user_avatar.png'
    };

    if (staticAvatars[sender]) {
      return getStaticAvatarUrl(staticAvatars[sender]);
    }

    // Fallback to generated avatar
    const seed = sender.replace(/\s+/g, '').toLowerCase();
    const colors = ['ffd5dc', 'c7d2fe', 'dcfce7', 'fed7d7', 'fef3c7', 'e0e7ff'];
    const colorIndex = seed.length % colors.length;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${colors[colorIndex]}`;
  }, [getStaticAvatarUrl]);

  // Enhanced Avatar component with Flask-style fallback handling
  const AvatarImage: React.FC<{ 
    src?: string; 
    alt: string; 
    className: string; 
    sender: string;
    showOnline?: boolean;
  }> = ({ src, alt, className, sender, showOnline = true }) => {
    const [imgError, setImgError] = useState(false);
    const [imgLoading, setImgLoading] = useState(true);
    const [fallbackAttempts, setFallbackAttempts] = useState(0);
    
    const getAvatarSrc = () => {
      if (fallbackAttempts === 0 && src) return src;
      if (fallbackAttempts === 1) return getAvatarUrl(sender);
      // Final fallback - placeholder avatar
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(sender)}&background=a32626&color=fff&size=128`;
    };
    
    const handleImageError = () => {
      console.log(`[Avatar] Failed to load image for ${sender}, attempt ${fallbackAttempts + 1}`);
      if (fallbackAttempts < 2) {
        setFallbackAttempts(prev => prev + 1);
        setImgError(false);
        setImgLoading(true);
      } else {
        setImgError(true);
        setImgLoading(false);
      }
    };
    
    return (
      <div className={`${className} relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0`}>
        {imgLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#a32626] rounded-full animate-spin"></div>
          </div>
        )}
        <img 
          src={getAvatarSrc()}
          alt={alt}
          className="w-full h-full object-cover transition-opacity duration-200"
          onError={handleImageError}
          onLoad={() => {
            setImgLoading(false);
            setImgError(false);
          }}
          style={{ opacity: imgLoading ? 0 : 1 }}
        />
        {/* Online status indicator */}
        {showOnline && !imgError && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
        )}
      </div>
    );
  };

  // Simulate Flask-SocketIO message handling
  const handleSocketMessage = useCallback((data: any) => {
    console.log('[Socket] Received new message:', data);
    setMessages(prev => [...prev, data]);
  }, []);

  const handleMessageSent = useCallback((data: any) => {
    console.log('[Socket] Message sent confirmation:', data);
    setMessages(prev => prev.map(msg => 
      msg.id === data.id ? { ...msg, status: 'sent' } : msg
    ));
  }, []);

  // Socket.IO connection simulation
  useEffect(() => {
    console.log('[Socket] Connecting to Flask-SocketIO server...');
    
    // Simulate Flask-SocketIO event listeners
    socket.on('new_message', handleSocketMessage);
    socket.on('message_sent', handleMessageSent);
    
    // Simulate connection status
    setIsConnected(socket.isConnected);
    
    return () => {
      socket.off('new_message', handleSocketMessage);
      socket.off('message_sent', handleMessageSent);
    };
  }, [handleSocketMessage, handleMessageSent]);

  // Load current user from localStorage
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
      console.log('[Forum] Current user loaded:', user);
    }
  }, []);

  // Load messages from database when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      if (!isJoined) return;
      
      setIsLoadingMessages(true);
      try {
        console.log('[Forum] Loading messages from database...');
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/forum/posts?per_page=100`);
        
        if (!response.ok) {
          throw new Error('Failed to load messages');
        }
        
        const data = await response.json();
        console.log('[Forum] Loaded posts from database:', data);
        
        // Always start with welcome messages from community members
        const welcomeMessages: Message[] = [
          { 
            id: 'welcome1', 
            sender: 'Emma Smith', 
            text: "Hello everyone! 👋 Hope you're all having a strong and healthy day. Just wanted to share some positive energy with our amazing community!", 
            time: "10:30 AM", 
            type: 'text', 
            isMe: false,
            status: 'read',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc',
            isBot: true
          },
          { 
            id: 'welcome2', 
            sender: 'John Doe', 
            text: "Just got my bone density test results back and they're looking much better than last year! 📈 Feeling optimistic and grateful for all the support here.", 
            time: "11:15 AM", 
            type: 'text', 
            isMe: false,
            status: 'read',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=c7d2fe',
            isBot: true
          },
          { 
            id: 'welcome3', 
            sender: 'Dr. Sarah Wilson', 
            text: "That's wonderful news, John! 🎉 Consistent care and lifestyle changes really do make a difference. Keep up the great work everyone!", 
            time: "11:18 AM", 
            type: 'text', 
            isMe: false,
            status: 'read',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrSarah&backgroundColor=dcfce7',
            isBot: true
          }
        ];
        
        if (data.success && data.posts) {
          // Convert database posts to Message format
          const loadedMessages: Message[] = data.posts.map((post: any) => {
            // Fix date parsing - backend returns createdAt in ISO format
            let postDate: Date;
            try {
              // Backend returns 'createdAt' not 'created_at'
              const dateString = post.createdAt || post.created_at;
              postDate = new Date(dateString);
              // Check if date is valid
              if (isNaN(postDate.getTime())) {
                console.warn('[Forum] Invalid date for post:', post.id, dateString);
                postDate = new Date(); // Fallback to current time
              }
            } catch (e) {
              console.error('[Forum] Error parsing date:', e);
              postDate = new Date(); // Fallback to current time
            }
            
            const isCurrentUser = currentUser && post.userId === currentUser.id;
            
            return {
              id: post.id.toString(),
              sender: isCurrentUser ? 'You' : (post.user?.fullName || post.user?.username || 'Anonymous'),
              text: post.content,
              time: postDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'text' as const,
              isMe: isCurrentUser,
              status: 'read' as const,
              avatar: isCurrentUser 
                ? getAvatarUrl('You')
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username || 'user'}&backgroundColor=c7d2fe`,
              userId: post.userId,
              createdAt: post.createdAt
            };
          });
          
          // Combine welcome messages with database messages
          setMessages([...welcomeMessages, ...loadedMessages]);
          console.log('[Forum] Messages loaded successfully:', loadedMessages.length, 'database messages +', welcomeMessages.length, 'welcome messages');
        } else {
          // Only welcome messages if no database posts
          setMessages(welcomeMessages);
        }
      } catch (error) {
        console.error('[Forum] Error loading messages:', error);
        // Show welcome messages on error
        const welcomeMessages: Message[] = [
          { 
            id: 'welcome1', 
            sender: 'Emma Smith', 
            text: "Hello everyone! 👋 Hope you're all having a strong and healthy day. Just wanted to share some positive energy with our amazing community!", 
            time: "10:30 AM", 
            type: 'text', 
            isMe: false,
            status: 'read',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc',
            isBot: true
          },
          { 
            id: 'welcome2', 
            sender: 'John Doe', 
            text: "Just got my bone density test results back and they're looking much better than last year! 📈 Feeling optimistic and grateful for all the support here.", 
            time: "11:15 AM", 
            type: 'text', 
            isMe: false,
            status: 'read',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=c7d2fe',
            isBot: true
          },
          { 
            id: 'welcome3', 
            sender: 'Dr. Sarah Wilson', 
            text: "That's wonderful news, John! 🎉 Consistent care and lifestyle changes really do make a difference. Keep up the great work everyone!", 
            time: "11:18 AM", 
            type: 'text', 
            isMe: false,
            status: 'read',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrSarah&backgroundColor=dcfce7',
            isBot: true
          }
        ];
        setMessages(welcomeMessages);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    if (isJoined) {
      loadMessages();
    }
  }, [isJoined, getAvatarUrl]);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome1', 
      sender: 'Emma Smith', 
      text: "Hello everyone! 👋 Hope you're all having a strong and healthy day. Just wanted to share some positive energy with our amazing community!", 
      time: "10:30 AM", 
      type: 'text', 
      isMe: false,
      status: 'read',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=ffd5dc',
      isBot: true
    },
    { 
      id: 'welcome2', 
      sender: 'John Doe', 
      text: "Just got my bone density test results back and they're looking much better than last year! 📈 Feeling optimistic and grateful for all the support here.", 
      time: "11:15 AM", 
      type: 'text', 
      isMe: false,
      status: 'read',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=c7d2fe',
      isBot: true
    },
    { 
      id: 'welcome3', 
      sender: 'Dr. Sarah Wilson', 
      text: "That's wonderful news, John! 🎉 Consistent care and lifestyle changes really do make a difference. Keep up the great work everyone!", 
      time: "11:18 AM", 
      type: 'text', 
      isMe: false,
      status: 'read',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrSarah&backgroundColor=dcfce7',
      isBot: true
    }
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isJoined]);

  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Simulate connection status changes
  useEffect(() => {
    const connectionInterval = setInterval(() => {
      // Randomly simulate connection issues (very rarely)
      if (Math.random() < 0.02) { // 2% chance
        setIsConnected(false);
        setTimeout(() => setIsConnected(true), 2000);
      }
    }, 10000);

    return () => clearInterval(connectionInterval);
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Enhanced message sending with Flask-SocketIO simulation AND database persistence
  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !isConnected || !currentUser) return;
    
    const messageId = Date.now().toString();
    const messageText = inputText.trim();
    
    // Create user message (instantly append to UI like real chat apps)
    const newMessage: Message = {
      id: messageId,
      sender: 'You',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      isMe: true,
      status: 'sending',
      avatar: getAvatarUrl('You'),
      userId: currentUser.id
    };
    
    // Instantly add message to UI (like WhatsApp/Telegram)
    console.log('[Frontend] Sending message:', messageText);
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsTyping(false);
    
    try {
      // Save to database
      console.log('[Forum] Saving message to database...');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/forum/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          content: messageText,
          postType: 'text'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Forum] Failed to save message:', errorData);
        throw new Error(errorData.error || 'Failed to save message');
      }
      
      const data = await response.json();
      console.log('[Forum] Message saved to database:', data);
      
      // Update message status to 'sent'
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'sent', id: data.post.id.toString() } : msg
      ));
      
      // Emit to Flask-SocketIO backend for real-time updates (optional)
      socket.emit('send_message', {
        id: data.post.id,
        message: messageText,
        sender: 'You',
        timestamp: new Date().toISOString(),
        room: 'osteoporosis_forum'
      });
      
    } catch (error) {
      console.error('[Forum] Error saving message:', error);
      // Update message status to show error
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'sent' } : msg
      ));
      // Still keep the message in UI even if save failed
    }
    
  }, [inputText, isConnected, currentUser, getAvatarUrl]);

  // Handle input changes with typing indicator
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);
    
    // Simulate typing indicator to other users
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', { sender: 'You', room: 'osteoporosis_forum' });
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      socket.emit('typing_stop', { sender: 'You', room: 'osteoporosis_forum' });
    }
  }, [isTyping]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleJoin = () => {
    setIsJoined(true);
  };

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Dr. Sarah Wilson replied to your message', time: '2 min ago', icon: 'fa-user-md', read: false },
    { id: 2, text: 'Emma Smith liked your post', time: '15 min ago', icon: 'fa-heart', read: false },
    { id: 3, text: 'New research article posted in the forum', time: '1 hr ago', icon: 'fa-flask', read: true },
  ]);

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()) || m.sender.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  if (!isJoined) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 px-8 overflow-hidden relative"
      >
        <button
          onClick={onBack}
          className="btn-back absolute top-6 left-6"
          aria-label="Go back"
        >
          <i className="fas fa-arrow-left icon-md"></i>
        </button>

        <div className="max-w-lg w-full flex flex-col items-center text-center gap-6">

          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-24 h-24 rounded-[1.75rem] flex items-center justify-center text-white text-4xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #a32626 0%, #8b1e1e 100%)' }}
          >
            <i className="fas fa-bone"></i>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col gap-1"
          >
            <h1 className="text-[#a32626] text-4xl font-black uppercase tracking-tight leading-none">
              Osteoporosis
            </h1>
            <span className="text-2xl text-gray-600 font-bold uppercase tracking-wide">Community</span>
            <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-sm mx-auto mt-1">
              Join patients, caregivers, and healthcare professionals. Share experiences, get expert advice, and stay updated with the latest research.
            </p>
          </motion.div>

          {/* Members card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white backdrop-blur-sm px-8 py-5 rounded-2xl border border-gray-200 shadow-xl w-full"
          >
            <div className="flex justify-center -space-x-2 mb-3">
              {['emma1','john2','sarah3','mike4','lisa5','david6'].map((seed, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.07, type: 'spring' }}
                  className="w-10 h-10 rounded-xl border-2 border-white shadow overflow-hidden bg-gray-100"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                    alt="member"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
            <p className="text-gray-700 font-bold text-sm">Join 2,412 active members</p>
            <div className="flex items-center justify-center gap-5 text-xs text-gray-400 mt-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>847 online now</span>
              </div>
              <div className="flex items-center gap-1.5">
                <i className="fas fa-comments text-blue-400 text-xs"></i>
                <span>24/7 support</span>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.button
            onClick={handleJoin}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="btn-primary w-full max-w-xs"
          >
            <i className="fas fa-sign-in-alt icon-md"></i>
            Enter Community
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Modern Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full flex items-center justify-between py-6 px-8 bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-[100] shadow-sm"
      >
        <div className="flex items-center space-x-6">
          <motion.button 
            onClick={onBack} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 flex items-center justify-center text-[#a32626] text-xl hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <i className="fas fa-arrow-left"></i>
          </motion.button>
          
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #a32626 0%, #8b1e1e 100%)' }}>
              <i className="fas fa-bone"></i>
            </div>
            <div>
              <h1 className="text-[#a32626] font-black text-2xl tracking-tight">Osteoporosis Forum</h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? `${onlineUsers.length + 2409} members online` : 'Reconnecting...'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative">
          {/* Search */}
          <div className="relative flex items-center">
            <AnimatePresence>
              {searchOpen && (
                <motion.input
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 180, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  autoFocus
                  type="text"
                  placeholder="Search messages or people..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-9 px-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#a32626] bg-white mr-1"
                />
              )}
            </AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => { setSearchOpen(o => !o); setSearchQuery(''); setNotifOpen(false); }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 ${searchOpen ? 'text-[#a32626] bg-red-50' : 'text-gray-400 hover:text-[#a32626] hover:bg-red-50'}`}
            >
              <i className="fas fa-search text-base"></i>
            </motion.button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => { setNotifOpen(o => !o); setSearchOpen(false); }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 relative ${notifOpen ? 'text-[#a32626] bg-red-50' : 'text-gray-400 hover:text-[#a32626] hover:bg-red-50'}`}
            >
              <i className="fas fa-bell text-base"></i>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {notifications.filter(n => !n.read).length}
              </div>
            </motion.button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-black text-sm text-gray-800">Notifications</span>
                    <span
                      className="text-[10px] font-bold text-[#a32626] uppercase tracking-wide cursor-pointer hover:underline"
                      onClick={() => setNotifications(n => n.map(x => ({ ...x, read: true })))}
                    >
                      Mark all read
                    </span>
                  </div>
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-red-50/40' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fdf0f0' }}>
                        <i className={`fas ${n.icon} text-xs`} style={{ color: '#a32626' }}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 leading-snug">{n.text}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-[#a32626] flex-shrink-0 mt-1"></div>}
                    </div>
                  ))}
                  <div className="px-4 py-2 text-center">
                    <span className="text-xs font-bold text-gray-400 cursor-pointer hover:text-[#a32626]">View all notifications</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Community Information & Events */}
        <aside className="hidden lg:flex lg:w-80 flex-col bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Webinars Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                  <i className="fas fa-video text-lg"></i>
                </div>
                <h3 className="font-black text-blue-900 text-lg">Upcoming Webinars</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <p className="font-bold text-sm text-gray-800">Bone Health 101</p>
                  <p className="text-xs text-gray-500 mt-1">May 22, 2026 • 2:00 PM</p>
                  <p className="text-xs text-blue-600 font-semibold mt-2">Dr. Sarah Wilson</p>
                </div>
                <div className="bg-white rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <p className="font-bold text-sm text-gray-800">Nutrition for Strong Bones</p>
                  <p className="text-xs text-gray-500 mt-1">May 25, 2026 • 3:30 PM</p>
                  <p className="text-xs text-blue-600 font-semibold mt-2">Nutritionist Emma</p>
                </div>
                <button className="w-full mt-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors">
                  View All Webinars
                </button>
              </div>
            </motion.div>

            {/* Health Awareness Events */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-5 border border-green-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white">
                  <i className="fas fa-calendar-check text-lg"></i>
                </div>
                <h3 className="font-black text-green-900 text-lg">Health Events</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <p className="font-bold text-sm text-gray-800">Bone Density Screening</p>
                  <p className="text-xs text-gray-500 mt-1">May 20-21, 2026</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Free</span>
                </div>
                <div className="bg-white rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <p className="font-bold text-sm text-gray-800">Exercise Workshop</p>
                  <p className="text-xs text-gray-500 mt-1">May 23, 2026 • 10:00 AM</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Registered</span>
                </div>
              </div>
            </motion.div>

            {/* Announcements */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border border-purple-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white">
                  <i className="fas fa-bullhorn text-lg"></i>
                </div>
                <h3 className="font-black text-purple-900 text-lg">Announcements</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-3 border-l-4 border-purple-500 hover:shadow-md transition-shadow cursor-pointer">
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">New Feature</p>
                  <p className="font-bold text-sm text-gray-800 mt-1">Message Search Now Available</p>
                  <p className="text-xs text-gray-500 mt-1">Find past discussions easily</p>
                </div>
                <div className="bg-white rounded-xl p-3 border-l-4 border-purple-500 hover:shadow-md transition-shadow cursor-pointer">
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">Update</p>
                  <p className="font-bold text-sm text-gray-800 mt-1">Community Guidelines Updated</p>
                  <p className="text-xs text-gray-500 mt-1">Please review the latest rules</p>
                </div>
              </div>
            </motion.div>

            {/* Featured Discussions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border border-orange-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                  <i className="fas fa-star text-lg"></i>
                </div>
                <h3 className="font-black text-orange-900 text-lg">Featured Discussions</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-800">Best Exercises for Bone Health</p>
                      <p className="text-xs text-gray-500 mt-1">Started by John Doe</p>
                    </div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">Hot</span>
                  </div>
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                    <span><i className="fas fa-comment mr-1"></i>24 replies</span>
                    <span><i className="fas fa-heart mr-1"></i>156 likes</span>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-800">Calcium-Rich Foods Guide</p>
                      <p className="text-xs text-gray-500 mt-1">Started by Emma Smith</p>
                    </div>
                    <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">Trending</span>
                  </div>
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                    <span><i className="fas fa-comment mr-1"></i>18 replies</span>
                    <span><i className="fas fa-heart mr-1"></i>203 likes</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Community Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-5 border border-pink-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-pink-500 flex items-center justify-center text-white">
                  <i className="fas fa-heart text-lg"></i>
                </div>
                <h3 className="font-black text-pink-900 text-lg">Community Highlights</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-white rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <p className="text-xs font-bold text-pink-600 uppercase tracking-wide">Success Story</p>
                  <p className="font-bold text-sm text-gray-800 mt-1">Member's 6-Month Journey</p>
                  <p className="text-xs text-gray-500 mt-1">Improved bone density by 12%</p>
                </div>
                <div className="bg-white rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <p className="text-xs font-bold text-pink-600 uppercase tracking-wide">Member Spotlight</p>
                  <p className="font-bold text-sm text-gray-800 mt-1">Dr. Sarah Wilson - Expert Q&A</p>
                  <p className="text-xs text-gray-500 mt-1">Ask your health questions</p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-5 border border-gray-300"
            >
              <h3 className="font-black text-gray-900 text-lg mb-4">Community Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-[#a32626]">2.4k</p>
                  <p className="text-xs text-gray-600 font-semibold mt-1">Active Members</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-blue-600">847</p>
                  <p className="text-xs text-gray-600 font-semibold mt-1">Online Now</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-green-600">12.5k</p>
                  <p className="text-xs text-gray-600 font-semibold mt-1">Total Posts</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-purple-600">98%</p>
                  <p className="text-xs text-gray-600 font-semibold mt-1">Satisfaction</p>
                </div>
              </div>
            </motion.div>

          </div>
        </aside>

        {/* Enhanced Chat Area */}
        <main className="flex-1 flex flex-col bg-gray-50 relative">
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-6 md:px-12 pt-8 pb-32 scroll-smooth"
          >
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center">
                <span className="bg-white text-gray-500 text-sm font-semibold px-6 py-3 rounded-full border border-gray-200 shadow-sm">
                  Today
                </span>
              </div>
              
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-[#a32626] rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-semibold">Loading messages...</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredMessages.map((msg, index) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ scale: 1.01 }}
                    className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} max-w-[75%] md:max-w-[60%]`}>
                      {!msg.isMe && (
                        <div className="flex items-center space-x-3 mb-3 ml-4">
                          <AvatarImage
                            src={msg.avatar}
                            alt={msg.sender}
                            className="w-10 h-10 rounded-xl shadow-md"
                            sender={msg.sender}
                          />
                          <span className="text-gray-700 font-semibold text-base">{msg.sender}</span>
                          {msg.sender.includes('Dr.') && (
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                              <i className="fas fa-user-md mr-1"></i>Verified
                            </span>
                          )}
                        </div>
                      )}
                      
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className={`p-6 rounded-2xl shadow-sm relative transition-all duration-300 hover:shadow-lg ${
                          msg.isMe 
                            ? 'bg-gradient-to-br from-[#a32626] to-[#8b1e1e] text-white rounded-tr-lg' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-lg'
                        }`}
                      >
                        <p className="font-medium text-base leading-relaxed">{msg.text}</p>
                        
                        <div className={`flex items-center mt-4 space-x-2 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-sm font-medium ${msg.isMe ? 'text-white/70' : 'text-gray-500'}`}>
                            {msg.time}
                          </span>
                          {msg.isMe && (
                            <div className="flex items-center space-x-1">
                              {msg.status === 'sending' && (
                                <div className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin"></div>
                              )}
                              {msg.status === 'sent' && (
                                <i className="fas fa-check text-white/50 text-sm"></i>
                              )}
                              {msg.status === 'delivered' && (
                                <i className="fas fa-check-double text-white/70 text-sm"></i>
                              )}
                              {msg.status === 'read' && (
                                <i className="fas fa-check-double text-blue-300 text-sm"></i>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              )}
              
              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center space-x-3 ml-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-md">
                        <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse"></div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl rounded-tl-lg border border-gray-100 shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Scroll to Bottom Button */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={scrollToBottom}
                className="absolute bottom-32 right-8 w-14 h-14 bg-[#a32626] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center z-50"
              >
                <i className="fas fa-arrow-down text-lg"></i>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Enhanced Input Bar */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-[100]"
          >
            <div className={`bg-white/95 backdrop-blur-md rounded-3xl flex items-center px-6 py-4 shadow-2xl border transition-all duration-300 ${
              inputFocused ? 'border-[#a32626] shadow-[0_0_0_3px_rgba(163,38,38,0.1)]' : 'border-gray-200/50'
            }`}>
              <input 
                type="text" 
                value={inputText}
                onChange={handleInputChange}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts, ask questions, or offer support..." 
                className="flex-1 bg-transparent border-none focus:outline-none text-gray-700 font-medium text-lg placeholder-gray-400"
                disabled={!isConnected}
              />

              <div className="flex items-center space-x-3 ml-4">
                 <motion.button 
                   onClick={() => fileInputRef.current?.click()} 
                   whileHover={{ scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                   className="text-gray-400 hover:text-[#a32626] transition-all duration-200 p-2"
                 >
                   <i className="fas fa-paperclip text-lg"></i>
                 </motion.button>
                 <motion.button 
                   onClick={() => fileInputRef.current?.click()} 
                   whileHover={{ scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                   className="text-gray-400 hover:text-[#a32626] transition-all duration-200 p-2"
                 >
                   <i className="fas fa-image text-lg"></i>
                 </motion.button>
                 <motion.button 
                   onClick={handleSendMessage}
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   disabled={!inputText.trim() || !isConnected}
                   className="w-14 h-14 text-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                   style={{ background: 'linear-gradient(135deg, #a32626 0%, #8b1e1e 100%)' }}
                 >
                   {inputText.trim() ? (
                     <i className="fas fa-paper-plane text-lg"></i>
                   ) : (
                     <i className="fas fa-paper-plane text-lg"></i>
                   )}
                 </motion.button>
              </div>
              
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" />
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default CommunityForum;



