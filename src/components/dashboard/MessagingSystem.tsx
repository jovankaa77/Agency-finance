import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, X, Trash2, Eye, EyeOff } from 'lucide-react';
import { Message } from '../../types';
import { firebaseStorage } from '../../utils/firebaseStorage';

interface MessagingSystemProps {
  userType: 'agency' | 'worker';
  agencyId: string;
  agencyName: string;
  workerId?: string;
  workerName?: string;
  workers?: { id: string; name: string }[];
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({
  userType,
  agencyId,
  agencyName,
  workerId,
  workerName,
  workers = []
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userType === 'worker' && workerId) {
      loadMessages();
    }
  }, [userType, workerId]);

  const loadMessages = async () => {
    if (workerId) {
      try {
        const fetchedMessages = await firebaseStorage.getMessages(workerId);
        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWorkerId || !messageTitle.trim() || !messageContent.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const selectedWorker = workers.find(w => w.id === selectedWorkerId);
    if (!selectedWorker) {
      alert('Selected worker not found');
      return;
    }

    setLoading(true);
    try {
      const message: Omit<Message, 'id'> = {
        agencyId,
        workerId: selectedWorkerId,
        workerName: selectedWorker.name,
        agencyName,
        title: messageTitle,
        content: messageContent,
        isRead: false,
        createdAt: new Date()
      };

      await firebaseStorage.sendMessage(message);
      
      // Reset form
      setSelectedWorkerId('');
      setMessageTitle('');
      setMessageContent('');
      setIsModalOpen(false);
      
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await firebaseStorage.markMessageAsRead(messageId);
      await loadMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await firebaseStorage.deleteMessage(messageId);
        await loadMessages();
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  const formatDate = (date: Date | any) => {
    const messageDate = date?.toDate ? date.toDate() : new Date(date);
    return messageDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (userType === 'agency') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Send Message to Workers</h2>
            <p className="text-gray-600 mt-1">Communicate with your team members</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </button>
        </div>

        {workers.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No workers found. Register workers first to send messages.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map(worker => (
              <div key={worker.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{worker.name}</h3>
                    <p className="text-sm text-gray-500">Worker ID: {worker.id.substring(0, 8)}...</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedWorkerId(worker.id);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Send Message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Send Message Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Send Message</h3>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedWorkerId('');
                      setMessageTitle('');
                      setMessageContent('');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Worker *</label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a worker...</option>
                    {workers.map(worker => (
                      <option key={worker.id} value={worker.id}>{worker.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message Title *</label>
                  <input
                    type="text"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter message title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message Content *</label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter your message..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedWorkerId('');
                      setMessageTitle('');
                      setMessageContent('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Worker view - show received messages
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          <p className="text-gray-600 mt-1">Messages from your agency</p>
        </div>
        {unreadCount > 0 && (
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            {unreadCount} unread
          </div>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`p-4 border rounded-lg transition-all ${
                message.isRead 
                  ? 'border-gray-200 bg-white' 
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium ${message.isRead ? 'text-gray-900' : 'text-blue-900'}`}>
                      {message.title}
                    </h3>
                    {!message.isRead && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">From: {message.agencyName}</p>
                  <p className="text-gray-700">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatDate(message.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {!message.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(message.id)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Mark as read"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagingSystem;