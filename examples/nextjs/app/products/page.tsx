"use client";

import Link from "next/link";
import { aizu } from "../../instrumentation-client";

export default function Products() {
  const products = [
    {
      id: "analytics",
      name: "Aizu Analytics",
      description: "Real-time web analytics with privacy focus",
      price: "$29/month",
      features: [
        "Real-time tracking",
        "Privacy compliant",
        "Custom events",
        "Dashboard",
      ],
    },
    {
      id: "heatmaps",
      name: "Heatmap Pro",
      description: "Visualize user interactions with advanced heatmaps",
      price: "$49/month",
      features: [
        "Click heatmaps",
        "Scroll tracking",
        "Form analysis",
        "A/B testing",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise Suite",
      description: "Complete analytics solution for large organizations",
      price: "Custom",
      features: [
        "Unlimited events",
        "Custom integrations",
        "SLA support",
        "On-premise",
      ],
    },
  ];

  const handleProductClick = (productId: string, productName: string) => {
    aizu.event("product_clicked", {
      product_id: productId,
      product_name: productName,
      page: "products",
    });
  };

  const handleGetStartedClick = (
    productId: string,
    productName: string,
    price: string
  ) => {
    aizu.event("get_started_clicked", {
      product_id: productId,
      product_name: productName,
      price: price,
      source: "products_page",
    });
  };

  const handleBackToHome = () => {
    aizu.event("navigation_link_clicked", {
      destination: "home",
      source: "products_page",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Navigation */}
        <nav className="mb-12">
          <Link
            href="/"
            onClick={handleBackToHome}
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to Home
          </Link>
        </nav>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
            Our Products
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Choose the perfect analytics solution for your needs
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product.id, product.name)}
              className="bg-white dark:bg-zinc-900 rounded-lg p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-semibold text-black dark:text-white mb-2">
                  {product.name}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  {product.description}
                </p>
                <div className="text-3xl font-bold text-black dark:text-white">
                  {product.price}
                </div>
              </div>

              <ul className="space-y-2 mb-8">
                {product.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center text-zinc-600 dark:text-zinc-400"
                  >
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleGetStartedClick(
                    product.id,
                    product.name,
                    product.price
                  );
                }}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-3 px-6 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
