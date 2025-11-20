"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { aizu } from "../../instrumentation-client";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState(3);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      aizu.event("dashboard_loaded", {
        load_time: 2000,
        initial_tab: activeTab,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    aizu.event("dashboard_tab_clicked", {
      tab_name: tabName,
      previous_tab: activeTab,
    });
  };

  const handleNotificationClick = () => {
    setNotifications(0);
    aizu.event("notifications_clicked", {
      notification_count: notifications,
      page: "dashboard",
    });
  };

  const handleExportClick = (format: string) => {
    aizu.event("export_data_clicked", {
      export_format: format,
      active_tab: activeTab,
      page: "dashboard",
    });
  };

  const handleRefreshClick = () => {
    setIsLoading(true);
    aizu.event("dashboard_refresh_clicked", {
      active_tab: activeTab,
    });

    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleSettingsClick = () => {
    aizu.event("dashboard_settings_clicked", {
      active_tab: activeTab,
    });
  };

  const handleBackToHome = () => {
    aizu.event("navigation_link_clicked", {
      destination: "home",
      source: "dashboard_page",
    });
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: "📊" },
    { id: "analytics", name: "Analytics", icon: "📈" },
    { id: "events", name: "Events", icon: "🎯" },
    { id: "users", name: "Users", icon: "👥" },
  ];

  const mockData = {
    overview: {
      pageviews: "12,543",
      uniqueVisitors: "3,421",
      bounceRate: "45.2%",
      avgSessionDuration: "2m 34s",
    },
    analytics: {
      topPages: ["/", "/products", "/about"],
      topCountries: ["United States", "Germany", "Canada"],
      devices: ["Desktop 60%", "Mobile 35%", "Tablet 5%"],
    },
    events: [
      { name: "button_clicked", count: 2451 },
      { name: "form_submitted", count: 342 },
      { name: "video_played", count: 156 },
    ],
    users: {
      newUsers: "1,234",
      returningUsers: "2,187",
      userGrowth: "+12.5%",
    },
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              onClick={handleBackToHome}
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ← Home
            </Link>
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Analytics Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleNotificationClick}
              className="relative p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              🔔
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            <button
              onClick={handleSettingsClick}
              className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-white capitalize">
            {activeTab} Data
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleRefreshClick}
              disabled={isLoading}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
            >
              {isLoading ? "⏳" : "🔄"} Refresh
            </button>
            <button
              onClick={() => handleExportClick("csv")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => handleExportClick("pdf")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📄 Export PDF
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Loading dashboard data...
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {activeTab === "overview" && (
              <div className="grid md:grid-cols-4 gap-6">
                {Object.entries(mockData.overview).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800"
                  >
                    <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </h3>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-black dark:text-white mb-4">
                    Top Pages
                  </h3>
                  <ul className="space-y-2">
                    {mockData.analytics.topPages.map((page, index) => (
                      <li
                        key={index}
                        className="text-zinc-600 dark:text-zinc-400"
                      >
                        {page}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-black dark:text-white mb-4">
                    Top Countries
                  </h3>
                  <ul className="space-y-2">
                    {mockData.analytics.topCountries.map((country, index) => (
                      <li
                        key={index}
                        className="text-zinc-600 dark:text-zinc-400"
                      >
                        {country}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <h3 className="font-semibold text-black dark:text-white mb-4">
                    Devices
                  </h3>
                  <ul className="space-y-2">
                    {mockData.analytics.devices.map((device, index) => (
                      <li
                        key={index}
                        className="text-zinc-600 dark:text-zinc-400"
                      >
                        {device}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "events" && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="p-6">
                  <h3 className="font-semibold text-black dark:text-white mb-4">
                    Custom Events
                  </h3>
                  <div className="space-y-3">
                    {mockData.events.map((event, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded"
                      >
                        <span className="text-black dark:text-white">
                          {event.name}
                        </span>
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {event.count.toLocaleString()} events
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="grid md:grid-cols-3 gap-6">
                {Object.entries(mockData.users).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800"
                  >
                    <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </h3>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
