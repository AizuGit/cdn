"use client";

import Link from "next/link";
import { useState } from "react";
import { aizu } from "../../instrumentation-client";

export default function About() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    aizu.event("form_field_interaction", {
      field_name: name,
      page: "about",
      action: "input_change",
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    aizu.event("contact_form_submitted", {
      page: "about",
      has_name: !!formData.name,
      has_email: !!formData.email,
      has_message: !!formData.message,
      message_length: formData.message.length,
    });

    // Simulate form submission
    alert("Thank you for your message! This is just a demo.");
    setFormData({ name: "", email: "", message: "" });
  };

  const handleTeamMemberClick = (memberName: string, role: string) => {
    aizu.event("team_member_clicked", {
      member_name: memberName,
      member_role: role,
      page: "about",
    });
  };

  const handleBackToHome = () => {
    aizu.event("navigation_link_clicked", {
      destination: "home",
      source: "about_page",
    });
  };

  const handleNavigateToProducts = () => {
    aizu.event("navigation_link_clicked", {
      destination: "products",
      source: "about_page",
    });
  };

  const teamMembers = [
    {
      name: "Alice Johnson",
      role: "CEO & Founder",
      bio: "10+ years in analytics",
    },
    { name: "Bob Smith", role: "CTO", bio: "Former Google engineer" },
    {
      name: "Carol Davis",
      role: "Head of Design",
      bio: "UX expert with design awards",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Navigation */}
        <nav className="mb-12 flex justify-between items-center">
          <Link
            href="/"
            onClick={handleBackToHome}
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to Home
          </Link>
          <Link
            href="/products"
            onClick={handleNavigateToProducts}
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            View Products →
          </Link>
        </nav>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
            About Aizu Analytics
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            We're building the future of privacy-focused web analytics
          </p>
        </div>

        {/* Company Info */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Our Mission
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              We believe that understanding your users shouldn't come at the
              cost of their privacy. Aizu Analytics provides powerful insights
              while respecting user privacy and complying with global
              regulations.
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Founded in 2024, we're committed to making analytics accessible,
              accurate, and ethical for businesses of all sizes.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              Why Choose Us?
            </h2>
            <ul className="space-y-2">
              {[
                "100% GDPR & CCPA compliant",
                "Real-time data processing",
                "No cookies required",
                "Lightweight tracking script",
                "Custom event tracking",
                "Open source friendly",
              ].map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center text-zinc-600 dark:text-zinc-400"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-black dark:text-white mb-8 text-center">
            Meet Our Team
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                onClick={() => handleTeamMemberClick(member.name, member.role)}
                className="bg-white dark:bg-zinc-900 rounded-lg p-6 text-center shadow-sm border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="w-20 h-20 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-1">
                  {member.name}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 mb-2">
                  {member.role}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-6 text-center">
            Get in Touch
          </h2>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white"
                required
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white"
                required
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-black dark:bg-white text-white dark:text-black py-3 px-6 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
