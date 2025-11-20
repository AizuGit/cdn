"use client";

import { useState } from "react";

interface LoadTestConfig {
  numUsers: number;
  contactsPerUser: number;
  groupsPerUser: number;
  concurrentRequests: number;
}

interface TestResult {
  success: boolean;
  operation: string;
  duration: number;
  error?: string;
}

interface LoadTestStats {
  total: number;
  successful: number;
  failed: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  opsPerSecond: number;
  operationStats: Record<
    string,
    {
      count: number;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
    }
  >;
}

const FIRST_NAMES = [
  "John",
  "Jane",
  "Michael",
  "Sarah",
  "David",
  "Emily",
  "Chris",
  "Ashley",
  "James",
  "Jessica",
  "Robert",
  "Jennifer",
  "William",
  "Amanda",
  "Richard",
  "Stephanie",
  "Joseph",
  "Nicole",
  "Thomas",
  "Elizabeth",
];

const LAST_NAMES = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
];

const COMPANIES = [
  "Acme Corp",
  "TechFlow Inc",
  "DataSync LLC",
  "CloudVision",
  "InnovateLab",
  "FutureWorks",
  "DigitalBridge",
  "SmartSystems",
  "NextGen Solutions",
  "AlphaTech",
  "BetaWorks",
  "GammaCorp",
];

const JOB_TITLES = [
  "Software Engineer",
  "Product Manager",
  "Data Analyst",
  "UX Designer",
  "DevOps Engineer",
  "Marketing Manager",
  "Sales Representative",
  "Customer Success Manager",
  "Backend Developer",
];

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Marketing",
  "Sales",
  "Customer Success",
  "HR",
  "Finance",
  "Operations",
];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateUserId(): string {
  return `user_${Math.random().toString(36).substr(2, 9)}`;
}

function generateGroupId(): string {
  return `group_${Math.random().toString(36).substr(2, 9)}`;
}

function generateEmail(
  firstName: string,
  lastName: string,
  company: string
): string {
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generateContactData() {
  const firstName = randomChoice(FIRST_NAMES);
  const lastName = randomChoice(LAST_NAMES);
  const company = randomChoice(COMPANIES);

  return {
    $email: generateEmail(firstName, lastName, company),
    $full_name: `${firstName} ${lastName}`,
    $first_name: firstName,
    $last_name: lastName,
    $company: company,
    $job_title: randomChoice(JOB_TITLES),
    $phone: `+1-555-${randomInt(1000, 9999)}`,
    department: randomChoice(DEPARTMENTS),
    level: randomChoice(["junior", "mid", "senior", "staff", "principal"]),
    start_date: new Date(Date.now() - randomInt(30, 1095) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    salary: randomInt(50000, 200000),
    employee_id: `EMP${randomInt(1000, 9999)}`,
  };
}

function generateGroupData() {
  const company = randomChoice(COMPANIES);
  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Manufacturing",
    "Retail",
    "Education",
    "Consulting",
  ];
  const industry = randomChoice(industries);

  return {
    $name: company,
    $description: `${industry} company specializing in innovative solutions and services`,
    $industry: industry,
    $size: randomInt(10, 5000).toString(),
    $website: `https://${company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    $email: `info@${company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
    $phone: `+1-${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(
      1000,
      9999
    )}`,
    employee_count: randomInt(10, 5000),
    annual_revenue: randomInt(1000000, 500000000),
    location: randomChoice([
      "San Francisco",
      "New York",
      "Austin",
      "Seattle",
      "Boston",
      "Chicago",
      "Los Angeles",
      "Miami",
    ]),
    founded_year: randomInt(1990, 2020),
    plan_type: randomChoice(["startup", "growth", "enterprise"]),
    billing_tier: randomChoice(["basic", "premium", "enterprise"]),
  };
}

export default function LoadTestPage() {
  const [config, setConfig] = useState<LoadTestConfig>({
    numUsers: 10,
    contactsPerUser: 100,
    groupsPerUser: 20,
    concurrentRequests: 5,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<TestResult[]>([]);
  const [stats, setStats] = useState<LoadTestStats | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev.slice(-49),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const makeAPICall = async (data: any): Promise<TestResult> => {
    const startTime = Date.now();

    try {
      const response = await fetch("/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();
      const endTime = Date.now();

      return {
        success: true,
        operation: data.type,
        duration: endTime - startTime,
      };
    } catch (error) {
      const endTime = Date.now();
      return {
        success: false,
        operation: data.type,
        duration: endTime - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const executeBatch = async (operations: any[], batchSize: number) => {
    const allResults: TestResult[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const promises = batch.map((op) => makeAPICall(op));
      const batchResults = await Promise.all(promises);

      allResults.push(...batchResults);
      setProgress({ current: i + batch.length, total: operations.length });
      setResults((prev) => [...prev, ...batchResults]);

      // Small delay between batches
      if (i + batchSize < operations.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return allResults;
  };

  const generateUserOperations = (userId: string) => {
    const operations = [];
    const groupIds: string[] = [];
    const contactIds = [userId];
    const companies: {
      groupId: string;
      companyName: string;
      domain: string;
    }[] = [];

    // Create companies/organizations first
    for (let i = 0; i < config.groupsPerUser; i++) {
      const groupId = generateGroupId();
      const groupData = generateGroupData();
      groupIds.push(groupId);

      companies.push({
        groupId,
        companyName: groupData.$name,
        domain: groupData.$email.split("@")[1],
      });

      operations.push({
        type: "addOrUpdateGroup",
        userId, // The user creating the company
        groupId,
        properties: groupData,
        options: {
          anonymousUserId: `anon_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Create main user contact (company founder/admin)
    const mainUserCompany = randomChoice(companies);
    const mainUserData = generateContactData();
    mainUserData.$company = mainUserCompany.companyName;
    mainUserData.$email = `${mainUserData.$first_name.toLowerCase()}.${mainUserData.$last_name.toLowerCase()}@${
      mainUserCompany.domain
    }`;
    mainUserData.$job_title = randomChoice([
      "CEO",
      "CTO",
      "Founder",
      "VP Engineering",
      "Head of Product",
    ]);

    operations.push({
      type: "addOrUpdateContact",
      userId,
      properties: mainUserData,
      options: {
        anonymousUserId: `anon_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      },
    });

    // Create additional contacts (employees)
    for (let i = 1; i < config.contactsPerUser; i++) {
      const contactId = generateUserId();
      contactIds.push(contactId);

      // Assign employee to a random company
      const employeeCompany = randomChoice(companies);
      const employeeData = generateContactData();
      employeeData.$company = employeeCompany.companyName;
      employeeData.$email = `${employeeData.$first_name.toLowerCase()}.${employeeData.$last_name.toLowerCase()}@${
        employeeCompany.domain
      }`;

      operations.push({
        type: "addOrUpdateContact",
        userId: contactId,
        properties: employeeData,
        options: {
          anonymousUserId: `anon_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        },
      });

      // Add employee to their company group
      operations.push({
        type: "addOrUpdateGroup",
        userId: contactId,
        groupId: employeeCompany.groupId,
        properties: {
          $name: employeeCompany.companyName, // Required field to avoid null constraint
          member_since: new Date().toISOString(),
          role: "employee",
        },
        options: {
          anonymousUserId: `anon_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Add payments
    const numPayments = randomInt(5, 15);
    for (let i = 0; i < numPayments; i++) {
      operations.push({
        type: "payment",
        userId: randomChoice(contactIds),
        paymentProperties: {
          payment_id: `pay_${Math.random().toString(36).substr(2, 9)}`,
          amount: randomChoice([9.99, 19.99, 29.99, 49.99, 99.99]),
          currency: "USD",
          payment_method: randomChoice(["credit_card", "stripe", "paypal"]),
          payment_status: randomChoice(["completed", "pending", "failed"]),
          product_id: `prod_${randomChoice([
            "basic",
            "premium",
            "enterprise",
          ])}_monthly`,
        },
        options: {
          anonymousUserId: `anon_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Add subscriptions
    const numSubscriptions = randomInt(3, 8);
    for (let i = 0; i < numSubscriptions; i++) {
      const isGroupSubscription = Math.random() > 0.7;

      operations.push({
        type: "subscription",
        userId: isGroupSubscription ? undefined : randomChoice(contactIds),
        groupId:
          isGroupSubscription && groupIds.length > 0
            ? randomChoice(groupIds)
            : undefined,
        subscriptionProperties: {
          external_subscription_id: `sub_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          plan_id: `plan_${randomChoice([
            "basic",
            "premium",
            "enterprise",
          ])}_${randomChoice(["monthly", "yearly"])}`,
          plan_name: `${randomChoice(["Basic", "Premium", "Enterprise"])} Plan`,
          status: randomChoice(["active", "trialing", "cancelled"]),
          subscriber_type: isGroupSubscription ? "group" : "contact",
          amount: randomChoice([9.99, 29.99, 99.99]),
          currency: "USD",
          billing_cycle: randomChoice(["monthly", "yearly"]),
          started_at: new Date().toISOString(),
          provider: "stripe",
        },
        options: {
          anonymousUserId: `anon_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Add custom events
    const numEvents = randomInt(20, 50);
    for (let i = 0; i < numEvents; i++) {
      const eventName = randomChoice([
        "feature_used",
        "user_login",
        "file_uploaded",
        "report_generated",
        "settings_changed",
      ]);

      operations.push({
        type: "track",
        eventName,
        userId: randomChoice(contactIds),
        properties: {
          feature_name: randomChoice([
            "analytics",
            "reporting",
            "collaboration",
          ]),
          usage_count: randomInt(1, 10),
          session_duration: randomInt(60, 3600),
          device_type: randomChoice(["desktop", "mobile", "tablet"]),
        },
        options: {
          anonymousUserId: `anon_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return operations;
  };

  const calculateStats = (results: TestResult[]): LoadTestStats => {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const durations = successful.map((r) => r.duration);
    const sortedDurations = [...durations].sort((a, b) => a - b);

    const operationStats: Record<string, any> = {};
    successful.forEach((r) => {
      if (!operationStats[r.operation]) {
        operationStats[r.operation] = [];
      }
      operationStats[r.operation].push(r.duration);
    });

    Object.keys(operationStats).forEach((op) => {
      const times = operationStats[op];
      operationStats[op] = {
        count: times.length,
        avgDuration:
          times.reduce((a: number, b: number) => a + b, 0) / times.length,
        minDuration: Math.min(...times),
        maxDuration: Math.max(...times),
      };
    });

    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      avgDuration:
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      p95Duration:
        durations.length > 0
          ? sortedDurations[Math.floor(durations.length * 0.95)]
          : 0,
      opsPerSecond: 0, // Will be calculated after test completion
      operationStats,
    };
  };

  const runLoadTest = async () => {
    setIsRunning(true);
    setResults([]);
    setStats(null);
    setLogs([]);
    setProgress({ current: 0, total: 0 });

    const startTime = Date.now();
    addLog(`Starting load test with ${config.numUsers} users`);

    try {
      // Generate all operations
      let allOperations: any[] = [];

      for (let i = 0; i < config.numUsers; i++) {
        const userId = generateUserId();
        const userOps = generateUserOperations(userId);
        allOperations.push(...userOps);
        addLog(`Generated ${userOps.length} operations for user ${i + 1}`);
      }

      addLog(`Total operations to execute: ${allOperations.length}`);

      // Execute operations
      const testResults = await executeBatch(
        allOperations,
        config.concurrentRequests
      );

      const endTime = Date.now();
      const totalDuration = (endTime - startTime) / 1000;

      const finalStats = calculateStats(testResults);
      finalStats.opsPerSecond = finalStats.successful / totalDuration;

      setStats(finalStats);
      addLog(`Load test completed in ${totalDuration.toFixed(2)}s`);
      addLog(
        `Success rate: ${(
          (finalStats.successful / finalStats.total) *
          100
        ).toFixed(2)}%`
      );
    } catch (error) {
      addLog(
        `Load test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Aizu Multi-User Load Test
          </h1>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Users
              </label>
              <input
                type="number"
                value={config.numUsers}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    numUsers: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contacts per User
              </label>
              <input
                type="number"
                value={config.contactsPerUser}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    contactsPerUser: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Groups per User
              </label>
              <input
                type="number"
                value={config.groupsPerUser}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    groupsPerUser: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isRunning}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concurrent Requests
              </label>
              <input
                type="number"
                value={config.concurrentRequests}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    concurrentRequests: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isRunning}
              />
            </div>
          </div>

          {/* Control Button */}
          <div className="mb-8">
            <button
              onClick={runLoadTest}
              disabled={isRunning}
              className={`px-6 py-3 rounded-md font-medium ${
                isRunning
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isRunning ? "🔄 Running Load Test..." : "🚀 Start Load Test"}
            </button>
          </div>

          {/* Progress */}
          {isRunning && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progress
                </span>
                <span className="text-sm text-gray-500">
                  {progress.current} / {progress.total} operations
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width:
                      progress.total > 0
                        ? `${(progress.current / progress.total) * 100}%`
                        : "0%",
                  }}
                ></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Stats */}
            <div className="space-y-6">
              {stats && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-green-900 mb-4">
                    📊 Test Results
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Total Operations:</div>
                      <div className="text-lg">{stats.total}</div>
                    </div>
                    <div>
                      <div className="font-medium">Success Rate:</div>
                      <div className="text-lg">
                        {((stats.successful / stats.total) * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Ops/Second:</div>
                      <div className="text-lg">
                        {stats.opsPerSecond.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Avg Response:</div>
                      <div className="text-lg">
                        {stats.avgDuration.toFixed(2)}ms
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Min Response:</div>
                      <div className="text-lg">{stats.minDuration}ms</div>
                    </div>
                    <div>
                      <div className="font-medium">Max Response:</div>
                      <div className="text-lg">{stats.maxDuration}ms</div>
                    </div>
                    <div>
                      <div className="font-medium">95th Percentile:</div>
                      <div className="text-lg">{stats.p95Duration}ms</div>
                    </div>
                    <div>
                      <div className="font-medium">Failed:</div>
                      <div className="text-lg">{stats.failed}</div>
                    </div>
                  </div>
                </div>
              )}

              {stats && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-blue-900 mb-4">
                    📋 Per-Operation Stats
                  </h2>
                  <div className="space-y-3 text-sm">
                    {Object.entries(stats.operationStats).map(
                      ([operation, opStats]) => (
                        <div
                          key={operation}
                          className="border-b border-blue-200 pb-2"
                        >
                          <div className="font-medium">{operation}</div>
                          <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                            <div>Count: {opStats.count}</div>
                            <div>Avg: {opStats.avgDuration.toFixed(2)}ms</div>
                            <div>Min: {opStats.minDuration}ms</div>
                            <div>Max: {opStats.maxDuration}ms</div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logs */}
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  📝 Test Logs
                </h2>
                <div className="bg-black text-green-400 rounded-md p-4 h-96 overflow-y-auto font-mono text-sm">
                  {logs.length === 0 ? (
                    <div className="text-gray-500 italic">No logs yet...</div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="mb-1">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
