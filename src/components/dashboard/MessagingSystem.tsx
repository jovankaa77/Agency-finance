import React, { useState, useEffect } from "react";
import { Send, MessageCircle, X, Trash2, Eye, EyeOff } from "lucide-react";
import { Message } from "../../types";
import { firebaseStorage } from "../../utils/firebaseStorage";

interface MessagingSystemProps {
  userType: "agency" | "worker";
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
  workers = [],
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMessages();
    loadSentMessages();
  }, [userType, workerId, agencyId]);

  const loadMessages = async () => {
    try {
      const userId = userType === "worker" ? workerId! : agencyId;
      const fetchedMessages = await firebaseStorage.getMessages(
        userId,
        userType
      );
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadSentMessages = async () => {
    try {
      const userId = userType === "worker" ? workerId! : agencyId;
      const fetchedSentMessages = await firebaseStorage.getSentMessages(
        userId,
        userType
      );
      setSentMessages(fetchedSentMessages);
    } catch (error) {
      console.error("Error loading sent messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      userType === "agency" &&
      (!selectedWorkerId || !messageTitle.trim() || !messageContent.trim())
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (
      userType === "worker" &&
      (!messageTitle.trim() || !messageContent.trim())
    ) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      let message: Omit<Message, "id">;

      if (userType === "agency") {
        const selectedWorker = workers.find((w) => w.id === selectedWorkerId);
        if (!selectedWorker) {
          alert("Selected worker not found");
          return;
        }

        message = {
          agencyId,
          workerId: selectedWorkerId,
          workerName: selectedWorker.name,
          agencyName,
          fromType: "agency",
          fromName: agencyName,
          toType: "worker",
          toName: selectedWorker.name,
          title: messageTitle,
          content: messageContent,
          isRead: false,
          createdAt: new Date(),
        };
      } else {
        message = {
          agencyId,
          workerId: workerId!,
          workerName: workerName!,
          agencyName,
          fromType: "worker",
          fromName: workerName!,
          toType: "agency",
          toName: agencyName,
          title: messageTitle,
          content: messageContent,
          isRead: false,
          createdAt: new Date(),
        };
      }

      await firebaseStorage.sendMessage(message);

      // Reset form
      setSelectedWorkerId("");
      setMessageTitle("");
      setMessageContent("");
      setIsModalOpen(false);

      // Reload both received and sent messages
      await loadSentMessages();
      alert("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await firebaseStorage.markMessageAsRead(messageId);
      await loadMessages();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await firebaseStorage.deleteMessage(messageId);
        await loadMessages();
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  const formatDate = (date: Date | any) => {
    const messageDate = date?.toDate ? date.toDate() : new Date(date);
    return messageDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  // Filter messages based on user type
  const filteredMessages = messages.filter((message) => {
    if (userType === "agency") {
      return message.toType === "agency";
    } else {
      return message.toType === "worker";
    }
  });

  if (userType === "agency") {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Send messages to workers and view received messages
            </p>
            {filteredMessages.filter((m) => !m.isRead).length > 0 && (
              <p className="text-sm font-medium text-blue-600 mt-1">
                {filteredMessages.filter((m) => !m.isRead).length} unread
                messages from workers
              </p>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </button>
        </div>

        {/* Messages from Workers */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Messages from Workers
          </h3>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <MessageCircle className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No messages from workers yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border rounded-lg transition-all ${
                    message.isRead
                      ? "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                      : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className={`font-medium ${
                            message.isRead
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-blue-900 dark:text-blue-300"
                          }`}
                        >
                          {message.title}
                        </h4>
                        {!message.isRead && (
                          <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        From: {message.fromName}
                      </p>
                      <p className="text-gray-700 dark:text-gray-200">{message.content}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!message.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(message.id)}
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40 rounded transition-colors"
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

        {/* Sent Messages History */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Sent Messages History
          </h3>
          {sentMessages.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <MessageCircle className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No sent messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentMessages.map((message) => (
                <div
                  key={message.id}
                  className="p-4 border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-green-900 dark:text-green-300">
                          {message.title}
                        </h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full text-xs">
                          {message.isRead ? "Read" : "Unread"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        To: {message.toName}
                      </p>
                      <p className="text-gray-700 dark:text-gray-200">{message.content}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40 rounded transition-colors"
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
        {/* Workers List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Send Message to Workers
          </h3>
          {workers.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <MessageCircle className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                No workers found. Register workers first to send messages.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {worker.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Worker ID: {worker.id.substring(0, 8)}...
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedWorkerId(worker.id);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                      title="Send Message"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Send Message Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Send Message
                  </h3>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedWorkerId("");
                      setMessageTitle("");
                      setMessageContent("");
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                {userType === "agency" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Select Worker *
                    </label>
                    <select
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                      required
                    >
                      <option value="">Choose a worker...</option>
                      {workers.map((worker) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {userType === "worker" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      To: Agency
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                      {agencyName}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Message Title *
                  </label>
                  <input
                    type="text"
                    value={messageTitle}
                    onChange={(e) => setMessageTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder="Enter message title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Message Content *
                  </label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 resize-none"
                    placeholder="Enter your message..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedWorkerId("");
                      setMessageTitle("");
                      setMessageContent("");
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Message"}
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Send messages to agency and view received messages
          </p>
        </div>
        <div className="flex items-center gap-3">
          {filteredMessages.filter((m) => !m.isRead).length > 0 && (
            <div className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium">
              {filteredMessages.filter((m) => !m.isRead).length} unread
            </div>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Send className="h-4 w-4 mr-2" />
            Send to Agency
          </button>
        </div>
      </div>

      {/* Messages from Agency */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Messages from Agency
        </h3>
        {filteredMessages.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <MessageCircle className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No messages from agency yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`p-4 border rounded-lg transition-all ${
                  message.isRead
                    ? "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                    : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-medium ${
                          message.isRead
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-blue-900 dark:text-blue-300"
                        }`}
                      >
                        {message.title}
                      </h3>
                      {!message.isRead && (
                        <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      From: {message.fromName}
                    </p>
                    <p className="text-gray-700 dark:text-gray-200">{message.content}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!message.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(message.id)}
                        className="p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded transition-colors"
                        title="Mark as read"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40 rounded transition-colors"
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

      {/* Sent Messages History */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Sent Messages History
        </h3>
        {sentMessages.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <MessageCircle className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No sent messages yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sentMessages.map((message) => (
              <div
                key={message.id}
                className="p-4 border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-green-900 dark:text-green-300">
                        {message.title}
                      </h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full text-xs">
                        {message.isRead ? "Read" : "Unread"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      To: {message.toName}
                    </p>
                    <p className="text-gray-700 dark:text-gray-200">{message.content}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {formatDate(message.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/40 rounded transition-colors"
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

      {/* Send Message Modal for Worker */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Send Message to Agency
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setMessageTitle("");
                    setMessageContent("");
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  To: Agency
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  {agencyName}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Message Title *
                </label>
                <input
                  type="text"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                  placeholder="Enter message title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Message Content *
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 resize-none"
                  placeholder="Enter your message..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setMessageTitle("");
                    setMessageContent("");
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingSystem;
