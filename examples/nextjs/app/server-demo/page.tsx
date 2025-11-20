"use client";

import { useState } from "react";

// Type definitions
interface TrackingResponse {
  success?: boolean;
  error?: string;
  details?: string;
  data?: any;
}

interface NamePair {
  first: string;
  last: string;
}

interface TrackingOptions {
  anonymousUserId?: string;
  sessionId?: string;
  timestamp?: string;
  eventName?: string;
  [key: string]: any;
}

export default function ServerDemo() {
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<TrackingResponse | null>(null);

  // Random data generators
  const generateRandomId = (): string => {
    return Math.random().toString(36).substring(2, 11);
  };

  const generateRandomEmail = (): string => {
    const domains = ["gmail.com", "company.com", "startup.io", "business.co"];
    const names = ["john", "sarah", "mike", "emma", "alex", "lisa"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    return `${randomName}.${generateRandomId()}@${randomDomain}`;
  };

  const generateRandomName = (): NamePair => {
    const firstNames = [
      "John",
      "Sarah",
      "Mike",
      "Emma",
      "Alex",
      "Lisa",
      "David",
      "Anna",
    ];
    const lastNames = [
      "Smith",
      "Johnson",
      "Brown",
      "Davis",
      "Wilson",
      "Miller",
      "Taylor",
      "Anderson",
    ];
    return {
      first: firstNames[Math.floor(Math.random() * firstNames.length)],
      last: lastNames[Math.floor(Math.random() * lastNames.length)],
    };
  };

  const generateRandomCompany = (): string => {
    const companies = [
      "TechCorp",
      "StartupLab",
      "InnovateCo",
      "DataSystems",
      "CloudWorks",
      "DevSolutions",
    ];
    return companies[Math.floor(Math.random() * companies.length)];
  };

  const generateRandomPhone = (): string => {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;
    return `+1-${areaCode}-${prefix}-${lineNumber}`;
  };

  // Main tracking function
  const trackServerEvent = async (
    type: string,
    userId?: string,
    groupId?: string,
    properties?: Record<string, unknown>,
    paymentProperties?: Record<string, unknown>,
    subscriptionProperties?: Record<string, unknown>,
    options?: TrackingOptions
  ): Promise<void> => {
    setLoading(true);
    setResponse(null);

    try {
      const payload = {
        type,
        ...(options?.eventName && { eventName: options.eventName }),
        userId,
        groupId,
        properties,
        paymentProperties,
        subscriptionProperties,
        options: {
          anonymousUserId: `anon_${generateRandomId()}`,
          sessionId: `session_${generateRandomId()}`,
          timestamp: new Date().toISOString(),
          ...options,
        },
      };

      const res = await fetch("/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("Tracking error:", error);
      setResponse({
        error: "Network error",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create contact then subscription
  const createSubscriptionWithContact = async (
    subscriptionProperties: Record<string, unknown>
  ): Promise<void> => {
    const userId = `user_${generateRandomId()}`;
    const name = generateRandomName();

    // First create the contact
    await trackServerEvent("addOrUpdateContact", userId, undefined, {
      $email: generateRandomEmail(),
      $full_name: `${name.first} ${name.last}`,
      $first_name: name.first,
      $last_name: name.last,
      $company: generateRandomCompany(),
      $job_title: "Software Engineer",
      $phone: generateRandomPhone(),
    });

    // Small delay to ensure contact is created
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Then create the subscription
    await trackServerEvent(
      "subscription",
      userId,
      undefined,
      undefined,
      undefined,
      subscriptionProperties
    );
  };

  // Helper function to create group then subscription
  const createGroupSubscriptionWithGroup = async (
    subscriptionProperties: Record<string, unknown>
  ): Promise<void> => {
    const userId = `user_${generateRandomId()}`;
    const groupId = `org_${generateRandomId()}`;
    const company = generateRandomCompany();
    const name = generateRandomName();

    // First create the contact
    await trackServerEvent("addOrUpdateContact", userId, undefined, {
      $email: generateRandomEmail(),
      $full_name: `${name.first} ${name.last}`,
      $first_name: name.first,
      $last_name: name.last,
      $company: company,
      $job_title: "CEO",
      $phone: generateRandomPhone(),
    });

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Then create the group
    await trackServerEvent("addOrUpdateGroup", userId, groupId, {
      group_id: groupId,
      $name: company,
      $company: company,
      $website: `https://${company.toLowerCase().replace(/\s+/g, "")}.com`,
      $industry: "Technology",
      $size: Math.floor(Math.random() * 500) + 10,
    });

    // Small delay to ensure group is created
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Then create the subscription
    await trackServerEvent(
      "subscription",
      userId,
      groupId,
      undefined,
      undefined,
      subscriptionProperties
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Aizu Server-Side Demo
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Contact Management */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                Contact Management
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const name = generateRandomName();
                    const userId = `user_${generateRandomId()}`;
                    trackServerEvent("addOrUpdateContact", userId, undefined, {
                      $email: generateRandomEmail(),
                      $full_name: `${name.first} ${name.last}`,
                      $first_name: name.first,
                      $last_name: name.last,
                      $company: generateRandomCompany(),
                      $job_title: "Software Engineer",
                      $phone: generateRandomPhone(),
                    });
                  }}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Random Contact
                </button>

                <button
                  onClick={() => {
                    const userId = `user_${generateRandomId()}`;
                    trackServerEvent("deleteContact", userId);
                  }}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Delete Contact
                </button>
              </div>
            </div>

            {/* Group Management */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-4">
                Group Management
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const userId = `user_${generateRandomId()}`;
                    const groupId = `org_${generateRandomId()}`;
                    const company = generateRandomCompany();
                    trackServerEvent("addOrUpdateGroup", userId, groupId, {
                      group_id: groupId,
                      $name: company,
                      $company: company,
                      $website: `https://${company
                        .toLowerCase()
                        .replace(/\s+/g, "")}.com`,
                      $industry: "Technology",
                      $size: Math.floor(Math.random() * 500) + 10,
                    });
                  }}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Random Group
                </button>

                <button
                  onClick={() => {
                    const userId = `user_${generateRandomId()}`;
                    const groupId = `org_${generateRandomId()}`;
                    trackServerEvent("deleteGroup", userId, groupId, {
                      group_id: groupId,
                    });
                  }}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Delete Group
                </button>
              </div>
            </div>

            {/* Event Tracking */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">
                Event Tracking
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const userId = `user_${generateRandomId()}`;
                    trackServerEvent(
                      "track",
                      userId,
                      undefined,
                      {
                        action: "button_click",
                        page: "dashboard",
                        feature: "analytics",
                        value: Math.floor(Math.random() * 100),
                      },
                      undefined,
                      undefined,
                      { eventName: "user_action" }
                    );
                  }}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Track User Action
                </button>

                <button
                  onClick={() => {
                    const userId = `user_${generateRandomId()}`;
                    trackServerEvent("page", userId, undefined, {
                      url: "/dashboard",
                      title: "Dashboard",
                      referrer: "https://google.com",
                    });
                  }}
                  disabled={loading}
                  className="w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Track Page View
                </button>
              </div>
            </div>

            {/* Payment Tracking */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-orange-900 mb-4">
                Payment Tracking
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const userId = `user_${generateRandomId()}`;
                    trackServerEvent("payment", userId, undefined, undefined, {
                      payment_id: `pay_${generateRandomId()}`,
                      amount: Math.floor(Math.random() * 500) + 10,
                      currency: "USD",
                      payment_method: "stripe",
                      payment_status: "completed",
                      product_id: `prod_${generateRandomId()}`,
                      timestamp: new Date().toISOString(),
                    });
                  }}
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Track Payment
                </button>
              </div>
            </div>

            {/* Subscription Management */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 md:col-span-2">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4">
                Subscription Management
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() =>
                    createSubscriptionWithContact({
                      external_subscription_id: `sub_${generateRandomId()}`,
                      plan_id: "pro_monthly",
                      plan_name: "Pro Monthly",
                      status: "active",
                      subscriber_type: "contact",
                      amount: 29.99,
                      currency: "USD",
                      billing_cycle: "monthly",
                      started_at: new Date().toISOString(),
                      provider: "stripe",
                    })
                  }
                  disabled={loading}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Active Subscription
                </button>

                <button
                  onClick={() =>
                    createSubscriptionWithContact({
                      external_subscription_id: `sub_${generateRandomId()}`,
                      plan_id: "pro_trial",
                      plan_name: "Pro Trial",
                      status: "trialing",
                      subscriber_type: "contact",
                      amount: 0,
                      currency: "USD",
                      billing_cycle: "monthly",
                      started_at: new Date().toISOString(),
                      trial_ends_at: new Date(
                        Date.now() + 14 * 24 * 60 * 60 * 1000
                      ).toISOString(),
                      provider: "stripe",
                    })
                  }
                  disabled={loading}
                  className="bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Trial Subscription
                </button>

                <button
                  onClick={() =>
                    createGroupSubscriptionWithGroup({
                      external_subscription_id: `sub_${generateRandomId()}`,
                      plan_id: "enterprise",
                      plan_name: "Enterprise Plan",
                      status: "active",
                      subscriber_type: "group",
                      amount: 299.99,
                      currency: "USD",
                      billing_cycle: "yearly",
                      started_at: new Date().toISOString(),
                      provider: "stripe",
                    })
                  }
                  disabled={loading}
                  className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Group Subscription
                </button>

                <button
                  onClick={() =>
                    createSubscriptionWithContact({
                      external_subscription_id: `sub_${generateRandomId()}`,
                      plan_id: "premium",
                      plan_name: "Premium Plan",
                      status: "canceled",
                      subscriber_type: "contact",
                      amount: 49.99,
                      currency: "USD",
                      billing_cycle: "monthly",
                      started_at: new Date(
                        Date.now() - 90 * 24 * 60 * 60 * 1000
                      ).toISOString(),
                      canceled_at: new Date().toISOString(),
                      ends_at: new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000
                      ).toISOString(),
                      provider: "stripe",
                    })
                  }
                  disabled={loading}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Canceled Subscription
                </button>

                <button
                  onClick={() =>
                    createSubscriptionWithContact({
                      external_subscription_id: `sub_${generateRandomId()}`,
                      plan_id: "basic",
                      plan_name: "Basic Plan",
                      status: "past_due",
                      subscriber_type: "contact",
                      amount: 9.99,
                      currency: "USD",
                      billing_cycle: "monthly",
                      started_at: new Date(
                        Date.now() - 45 * 24 * 60 * 60 * 1000
                      ).toISOString(),
                      provider: "stripe",
                    })
                  }
                  disabled={loading}
                  className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Past Due
                </button>

                <button
                  onClick={() =>
                    createSubscriptionWithContact({
                      external_subscription_id: `sub_${generateRandomId()}`,
                      plan_id: "lifetime",
                      plan_name: "Lifetime Access",
                      status: "active",
                      subscriber_type: "contact",
                      amount: 999,
                      currency: "USD",
                      billing_cycle: "one_time",
                      started_at: new Date().toISOString(),
                      provider: "manual",
                    })
                  }
                  disabled={loading}
                  className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Lifetime Plan
                </button>
              </div>
            </div>
          </div>

          {/* Response Display */}
          {response && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Response:
              </h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-60">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Processing...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
