import { base44 } from "@/api/base44Client";
import CriticalityBadge from "@/components/CriticalityBadge";
import StatusBadge from "@/components/StatusBadge";
import { ArrowLeft, Bell } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = () => {
    base44.entities.Notification.list("-created_date", 50)
      .then(setNotifications)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (notif) => {
    if (notif.read) return;
    await base44.entities.Notification.update(notif.id, { read: true });
    loadNotifications();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-7 h-7 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors lg:hidden"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Notificações</h1>
          <p className="text-xs text-gray-500">
            {notifications.filter((n) => !n.read).length} não lidas
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhuma notificação.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markRead(notif)}
              className={`bg-white rounded-xl border p-4 transition-all ${
                notif.read ? "border-gray-100" : "border-gray-200 shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.read ? "bg-gray-200" : "bg-red-500"}`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium mb-1 ${notif.read ? "text-gray-500" : "text-gray-900"}`}
                  >
                    {notif.title}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {notif.area && (
                      <span className="text-xs text-gray-400">
                        {notif.area}
                      </span>
                    )}
                    {notif.status && <StatusBadge status={notif.status} />}
                    {notif.priority && (
                      <CriticalityBadge criticality={notif.priority} />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {moment(notif.created_date).format("DD/MM/YYYY HH:mm")}
                  </p>
                </div>
                {notif.interdiction_id && (
                  <Link
                    to={`/interdiction/${notif.interdiction_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-gray-500 hover:text-gray-800 font-medium flex-shrink-0"
                  >
                    Ver
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
