import React, { useEffect, useState } from "react";
import { Bell, Check, CheckCircle, FileText, Info } from "lucide-react";
import { motion } from "motion/react";
import notificationService from "../../services/notificationService";
import { useAuth } from "../../context/AuthContext";

export function ClientNotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const data = await notificationService.getNotifications(user.userId);
        setNotifications(
          data.map((n) => ({
            ...n,
            date: new Date(n.createdAt).toLocaleString(),
            icon: FileText,
            color: "text-primary",
            bgColor: "bg-primary/10",
          }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const markAsRead = async (id: string) => {
    try {
      if (user?.userId) await notificationService.markNotificationRead(user.userId, id);
    } catch (e) {
      console.error(e);
    }
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllNotificationsRead();
    } catch (e) {
      console.error(e);
    }
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary mb-2">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Aucune nouvelle notification"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Tout marquer comme lu</span>
          </button>
        )}
      </div>

      <div className="flex space-x-2 bg-white rounded-xl p-2 border border-gray-200 w-fit">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Toutes ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "unread" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Non lues ({unreadCount})
        </button>
      </div>

      <div className="space-y-4">
        {filteredNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`bg-white rounded-xl p-6 border transition-all ${
              notification.read ? "border-gray-200" : "border-primary/30 shadow-sm"
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-full ${notification.bgColor} flex items-center justify-center flex-shrink-0`}>
                <notification.icon className={`w-6 h-6 ${notification.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-secondary">
                    {notification.title}
                    {!notification.read && <span className="ml-2 w-2 h-2 bg-primary rounded-full inline-block" />}
                  </h3>
                  <span className="text-sm text-gray-500 ml-4 flex-shrink-0">{notification.date}</span>
                </div>
                <p className="text-gray-600 mb-3">{notification.message}</p>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    Marquer comme lu
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-secondary mb-2">Aucune notification</h3>
          <p className="text-gray-600">
            {filter === "unread"
              ? "Vous êtes à jour ! Aucune nouvelle notification."
              : "Vous n'avez pas encore de notifications."}
          </p>
        </div>
      )}
    </div>
  );
}
