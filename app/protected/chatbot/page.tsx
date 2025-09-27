import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Bot, User } from "lucide-react";

export default async function ChatbotPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Placeholder chat messages - will be replaced with real data later
  const sampleMessages = [
    {
      id: 1,
      role: "assistant",
      content:
        "Hello! I&apos;m your family assistant. I have access to all your family memories, photos, and stories. What would you like to know about your family?",
      timestamp: "10:30 AM",
    },
    {
      id: 2,
      role: "user",
      content: "Tell me about Eleanor&apos;s childhood memories",
      timestamp: "10:32 AM",
    },
    {
      id: 3,
      role: "assistant",
      content:
        "Eleanor has shared some beautiful childhood memories! She particularly loves talking about her first day of school when she wore her favorite blue dress with polka dots. She was so excited and couldn&apos;t wait to learn to read. She also remembers helping her mother in the garden and learning to bake cookies on Sunday afternoons.",
      timestamp: "10:32 AM",
    },
    {
      id: 4,
      role: "user",
      content: "What photos do we have from the 1990s family vacation?",
      timestamp: "10:35 AM",
    },
    {
      id: 5,
      role: "assistant",
      content:
        "From the 1990 beach vacation, we have several wonderful photos! There are pictures of the children building sandcastles, Robert and Eleanor watching the sunset together, and the whole family having a picnic on the beach. Margaret mentioned it was such a peaceful week where everyone could relax and spend quality time together. Would you like me to help you find specific photos from that trip?",
      timestamp: "10:35 AM",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="text-center py-6 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chat with Family
        </h1>
        <p className="text-gray-600">
          Ask about memories, photos, stories, and family history
        </p>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {sampleMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 ${
                    message.role === "user" ? "ml-3" : "mr-3"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator Placeholder */}
          <div className="flex justify-start">
            <div className="flex mr-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ask about family memories, photos, or stories..."
                rows={2}
              />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 self-end">
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggested Questions */}
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                Tell me about Eleanor&apos;s wedding day
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                What family recipes do we have?
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Show me photos from the 1980s
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                What are Margaret&apos;s favorite memories?
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar with Family Context */}
      <div className="hidden lg:block absolute right-6 top-24 w-64">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <h3 className="font-semibold text-gray-900 flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" />
              Family Context
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">
                Available Information
              </h4>
              <ul className="mt-2 text-xs text-gray-600 space-y-1">
                <li>• 127 family photos</li>
                <li>• 45 memory stories</li>
                <li>• 7 family members</li>
                <li>• 23 milestone events</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">
                Recent Activity
              </h4>
              <ul className="mt-2 text-xs text-gray-600 space-y-1">
                <li>• Sarah added new photos</li>
                <li>• Michael shared a milestone</li>
                <li>• Eleanor added a memory</li>
              </ul>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Manage Context
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
