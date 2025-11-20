"use client";

import Image from "next/image";
import { aizu } from "../instrumentation-client";

export default function Home() {
  const handleDeployClick = () => {
    aizu.event("deploy_button_clicked", {
      location: "home_page",
      button_text: "Deploy Now",
      target: "vercel",
    });
  };

  const handleDocsClick = () => {
    aizu.event("docs_button_clicked", {
      location: "home_page",
      button_text: "Documentation",
      target: "nextjs_docs",
    });
  };

  const handleNavigateToProducts = () => {
    aizu.event("navigation_link_clicked", {
      destination: "products",
      source: "home_page",
    });
  };

  const handleNavigateToAbout = () => {
    aizu.event("navigation_link_clicked", {
      destination: "about",
      source: "home_page",
    });
  };

  const handleIdentifyUser = () => {
    aizu.identify("user123", {
      $email: "john@example.com",
      $first_name: "John",
      $last_name: "Doe",
      $full_name: "John Doe",
      $phone: "+1-555-0123",
      $company: "Acme Corp",
      $job_title: "Senior Engineer",
      $avatar_url: "https://example.com/avatar.jpg",
      // Custom properties
      subscription_plan: "premium",
      account_type: "business",
      signup_date: "2024-01-15",
      total_orders: 42,
      preferred_language: "en",
    });
  };

  const handleGroupIdentify = () => {
    aizu.groupIdentify("company123", {
      $name: "Acme Corporation",
      $description: "Leading software company",
      $company: "Acme Corp",
      $website: "https://acme.com",
      $industry: "Technology",
      $size: "100-500",
      $email: "contact@acme.com",
      $phone: "+1-555-0199",
      // Custom properties
      annual_revenue: "10M-50M",
      founded_year: 2015,
      headquarters: "San Francisco",
      employee_count: 250,
      technologies: ["React", "Node.js", "PostgreSQL"],
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {/* Logo */}
        <div className="mb-8">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
        </div>

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to Aizu Analytics Demo
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            This is a Next.js example demonstrating Aizu analytics tracking.
            Navigate around and check your analytics dashboard to see the events
            being tracked.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <button
            onClick={handleIdentifyUser}
            className="flex h-12 w-full items-center justify-center rounded-full bg-blue-600 px-5 text-white transition-colors hover:bg-blue-700 md:w-[158px]"
          >
            Identify User
          </button>
          <button
            onClick={handleGroupIdentify}
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-blue-600 px-5 text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20 md:w-[158px]"
          >
            Group Identify
          </button>
        </div>
      </main>
    </div>
  );
}
