import { Aizu } from "aizu-nodejs";
import { NextRequest, NextResponse } from "next/server";

// Initialize Aizu with secret key for server-side tracking
const aizu = new Aizu({
  secretKey: process.env.YORIN_SECRET_KEY, // Set this in your .env.local
  debug: process.env.NODE_ENV === "development",
});

interface TrackRequestBody {
  // Event type determines the action
  type:
    | "track"
    | "addOrUpdateContact"
    | "addOrUpdateGroup"
    | "deleteContact"
    | "deleteGroup"
    | "payment"
    | "subscription"
    | "page";

  // Common fields
  userId?: string;
  groupId?: string;
  properties?: Record<string, unknown>;

  // Event-specific fields
  eventName?: string;
  paymentProperties?: {
    payment_id?: string;
    amount: number;
    currency: string;
    payment_method?: string;
    payment_status?:
      | "pending"
      | "completed"
      | "failed"
      | "refunded"
      | "cancelled";
    stripe_session_id?: string;
    product_id?: string;
    subscription_id?: string;
    invoice_id?: string;
    [key: string]: unknown;
  };
  subscriptionProperties?: {
    external_subscription_id?: string;
    plan_id: string;
    plan_name?: string;
    status:
      | "trialing"
      | "active"
      | "canceled"
      | "incomplete"
      | "incomplete_expired"
      | "past_due"
      | "unpaid"
      | "paused";
    subscriber_type: "contact" | "group";
    subscriber_id?: string;
    amount?: number;
    currency?: string;
    billing_cycle?:
      | "monthly"
      | "yearly"
      | "quarterly"
      | "weekly"
      | "one_time"
      | "custom";
    started_at?: string;
    trial_ends_at?: string;
    current_period_start?: string;
    current_period_end?: string;
    cancelled_at?: string;
    ends_at?: string;
    description?: string;
    setup_fee?: number;
    billing_interval?: number;
    features?: string[];
    notes?: string;
    provider?: string;
    [key: string]: unknown;
  };

  // Options
  options?: {
    anonymousUserId?: string;
    sessionId?: string;
    timestamp?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackRequestBody = await request.json();
    const {
      type,
      eventName,
      userId,
      groupId,
      properties,
      paymentProperties,
      subscriptionProperties,
      options,
    } = body;

    // Validate required fields based on event type
    switch (type) {
      case "track":
        if (!eventName) {
          return NextResponse.json(
            { error: "eventName is required for track events" },
            { status: 400 }
          );
        }
        if (!userId && !properties?.group_id) {
          return NextResponse.json(
            {
              error:
                "Either userId or group_id (in properties) is required for track events",
            },
            { status: 400 }
          );
        }
        await aizu.track(eventName, userId, properties, options);
        break;

      case "addOrUpdateContact":
        if (!userId) {
          return NextResponse.json(
            { error: "userId is required for addOrUpdateContact" },
            { status: 400 }
          );
        }
        await aizu.addOrUpdateContact(userId, properties, options);
        break;

      case "addOrUpdateGroup":
        if (!groupId) {
          return NextResponse.json(
            { error: "groupId is required for addOrUpdateGroup" },
            { status: 400 }
          );
        }
        await aizu.addOrUpdateGroup(groupId, userId, properties, options);
        break;

      case "deleteContact":
        if (!userId) {
          return NextResponse.json(
            { error: "userId is required for deleteContact" },
            { status: 400 }
          );
        }
        await aizu.deleteContact(userId, options);
        break;

      case "deleteGroup":
        if (!groupId) {
          return NextResponse.json(
            { error: "groupId is required for deleteGroup" },
            { status: 400 }
          );
        }
        await aizu.deleteGroup(groupId, userId, options);
        break;

      case "page":
        await aizu.page(eventName, userId, properties, {
          url: options?.sessionId, // You might want to pass actual URL here
          title: eventName,
        });
        break;

      case "payment":
        if (!userId) {
          return NextResponse.json(
            { error: "userId is required for payment events" },
            { status: 400 }
          );
        }
        if (!paymentProperties?.amount || !paymentProperties?.currency) {
          return NextResponse.json(
            {
              error: "amount and currency are required for payment events",
            },
            { status: 400 }
          );
        }
        await aizu.payment(userId, paymentProperties, options);
        break;

      case "subscription":
        if (
          !subscriptionProperties?.plan_id ||
          !subscriptionProperties?.status ||
          !subscriptionProperties?.subscriber_type
        ) {
          return NextResponse.json(
            {
              error:
                "plan_id, status, and subscriber_type are required for subscription events",
            },
            { status: 400 }
          );
        }
        await aizu.subscription(subscriptionProperties, {
          userId,
          groupId,
          ...options,
        });
        break;

      default:
        return NextResponse.json(
          {
            error:
              "Invalid event type. Valid types: track, addOrUpdateContact, addOrUpdateGroup, deleteContact, deleteGroup, payment, subscription, page",
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${type} event ${
        eventName ? `"${eventName}"` : ""
      } tracked successfully`,
      type,
      ...(eventName && { eventName }),
      ...(userId && { userId }),
      ...(groupId && { groupId }),
    });
  } catch (error) {
    console.error("Server-side tracking error:", error);
    return NextResponse.json(
      {
        error: "Failed to track event",
        details: error instanceof Error ? error.message : "Unknown error",
        type: "tracking_error",
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET handler for testing
export async function GET() {
  return NextResponse.json({
    message: "Aizu tracking API is running",
    supportedMethods: ["POST"],
    supportedEventTypes: [
      "track",
      "addOrUpdateContact",
      "addOrUpdateGroup",
      "deleteContact",
      "deleteGroup",
      "payment",
      "subscription",
      "page",
    ],
    version: "2.0.0",
  });
}
