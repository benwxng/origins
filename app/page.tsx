import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, MessageCircle, Star } from "lucide-react";
import Link from "next/link";

export default async function Index() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated, redirect to family feed
  if (user) {
    return redirect("/protected");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="w-full flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="flex items-center space-x-2">
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 50 50" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-foreground"
          >
            <path d="M27.5308 40.1395C27.5757 35.5502 26.4122 31.8182 24.9322 31.8037C23.4521 31.7893 22.2159 35.4979 22.1711 40.0871C22.1262 44.6764 23.2897 48.4085 24.7697 48.4229C26.2498 48.4374 27.486 44.7288 27.5308 40.1395Z" fill="currentColor"/>
            <path d="M18.947 39.0972C21.4661 35.2608 22.5052 31.4922 21.268 30.6798C20.0307 29.8674 16.9856 32.3188 14.4666 36.1552C11.9475 39.9916 10.9084 43.7601 12.1456 44.5726C13.3829 45.385 16.4279 42.9336 18.947 39.0972Z" fill="currentColor"/>
            <path d="M12.2792 33.593C16.4726 31.7278 19.3843 29.1194 18.7827 27.767C18.1812 26.4146 14.2942 26.8304 10.1008 28.6957C5.90744 30.5609 2.99571 33.1693 3.59726 34.5217C4.1988 35.8741 8.08584 35.4583 12.2792 33.593Z" fill="currentColor"/>
            <path d="M18.2794 23.9745C18.5046 22.5116 15.0099 20.7597 10.4739 20.0615C5.93778 19.3633 2.07804 19.9833 1.85288 21.4462C1.62772 22.9091 5.1224 24.6609 9.65848 25.3591C14.1945 26.0573 18.0543 25.4373 18.2794 23.9745Z" fill="currentColor"/>
            <path d="M19.908 20.4895C20.8882 19.3805 18.895 16.0176 15.4561 12.9783C12.0172 9.93902 8.43482 8.37426 7.45464 9.48332C6.47446 10.5924 8.46766 13.9553 11.9066 16.9946C15.3455 20.0339 18.9279 21.5986 19.908 20.4895Z" fill="currentColor"/>
            <path d="M23.1514 18.4528C24.5756 18.0498 24.7171 14.1431 23.4675 9.72704C22.2179 5.31095 20.0503 2.05771 18.6261 2.46072C17.2019 2.86373 17.0604 6.77037 18.31 11.1865C19.5596 15.6025 21.7272 18.8558 23.1514 18.4528Z" fill="currentColor"/>
            <path d="M31.9584 11.3239C33.2949 6.9333 33.2305 3.02462 31.8145 2.59361C30.3985 2.16259 28.1672 5.37245 26.8307 9.76304C25.4943 14.1536 25.5587 18.0623 26.9747 18.4933C28.3907 18.9243 30.622 15.7145 31.9584 11.3239Z" fill="currentColor"/>
            <path d="M38.2514 17.2565C41.7491 14.285 43.8077 10.9617 42.8493 9.83373C41.891 8.70573 38.2787 10.2002 34.7811 13.1716C31.2834 16.1431 29.2249 19.4664 30.1832 20.5944C31.1415 21.7224 34.7538 20.228 38.2514 17.2565Z" fill="currentColor"/>
            <path d="M40.3322 25.6519C44.8812 25.0433 48.4097 23.3607 48.2134 21.8936C48.0172 20.4266 44.1704 19.7307 39.6214 20.3392C35.0725 20.9478 31.5439 22.6304 31.7402 24.0975C31.9365 25.5645 35.7832 26.2605 40.3322 25.6519Z" fill="currentColor"/>
            <path d="M46.2004 34.941C46.8285 33.6008 43.9688 30.9355 39.813 28.9879C35.6573 27.0403 31.7792 26.548 31.1511 27.8882C30.523 29.2285 33.3827 31.8938 37.5385 33.8414C41.6942 35.7889 45.5723 36.2813 46.2004 34.941Z" fill="currentColor"/>
            <path d="M37.4589 44.8299C38.7119 44.0421 37.7473 40.2537 35.3044 36.3684C32.8615 32.4831 29.8653 29.9722 28.6123 30.76C27.3593 31.5478 28.3239 35.3362 30.7668 39.2215C33.2097 43.1068 36.2059 45.6178 37.4589 44.8299Z" fill="currentColor"/>
          </svg>
          <h1 className="text-2xl font-bold text-foreground">Origins</h1>
        </div>
        <AuthButton />
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Keep Your Family
            <span className="text-primary"> Connected </span>
            Through Memories
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Origins is a familial knowledge base and reminisce therapy tool
            designed to help families stay connected and help those with
            Alzheimer&apos;s remember their loved ones and engage with precious
            memories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button className="bg-primary hover:bg-primary/90 text-lg px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="text-lg px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Family Feed
              </h3>
              <p className="text-muted-foreground">
                Share updates, milestones, and memories with your family in a
                beautiful timeline.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Family Tree
              </h3>
              <p className="text-muted-foreground">
                Visualize your family connections and add new members to your
                growing tree.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                AI Family Assistant
              </h3>
              <p className="text-muted-foreground">
                Chat with an AI that knows your family history, photos, and
                stories.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Reminisce Therapy
              </h3>
              <p className="text-muted-foreground">
                Specially designed tools to help elders engage with memories and
                family stories.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-bold mb-4">
              Start Preserving Your Family&apos;s Story Today
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Join families who are already using Origins to stay connected and
              preserve their precious memories.
            </p>
            <Link href="/auth/sign-up">
              <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg px-8 py-3">
                Create Your Family Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-muted border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 50 50" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-foreground"
            >
              <path d="M27.5308 40.1395C27.5757 35.5502 26.4122 31.8182 24.9322 31.8037C23.4521 31.7893 22.2159 35.4979 22.1711 40.0871C22.1262 44.6764 23.2897 48.4085 24.7697 48.4229C26.2498 48.4374 27.486 44.7288 27.5308 40.1395Z" fill="currentColor"/>
              <path d="M18.947 39.0972C21.4661 35.2608 22.5052 31.4922 21.268 30.6798C20.0307 29.8674 16.9856 32.3188 14.4666 36.1552C11.9475 39.9916 10.9084 43.7601 12.1456 44.5726C13.3829 45.385 16.4279 42.9336 18.947 39.0972Z" fill="currentColor"/>
              <path d="M12.2792 33.593C16.4726 31.7278 19.3843 29.1194 18.7827 27.767C18.1812 26.4146 14.2942 26.8304 10.1008 28.6957C5.90744 30.5609 2.99571 33.1693 3.59726 34.5217C4.1988 35.8741 8.08584 35.4583 12.2792 33.593Z" fill="currentColor"/>
              <path d="M18.2794 23.9745C18.5046 22.5116 15.0099 20.7597 10.4739 20.0615C5.93778 19.3633 2.07804 19.9833 1.85288 21.4462C1.62772 22.9091 5.1224 24.6609 9.65848 25.3591C14.1945 26.0573 18.0543 25.4373 18.2794 23.9745Z" fill="currentColor"/>
              <path d="M19.908 20.4895C20.8882 19.3805 18.895 16.0176 15.4561 12.9783C12.0172 9.93902 8.43482 8.37426 7.45464 9.48332C6.47446 10.5924 8.46766 13.9553 11.9066 16.9946C15.3455 20.0339 18.9279 21.5986 19.908 20.4895Z" fill="currentColor"/>
              <path d="M23.1514 18.4528C24.5756 18.0498 24.7171 14.1431 23.4675 9.72704C22.2179 5.31095 20.0503 2.05771 18.6261 2.46072C17.2019 2.86373 17.0604 6.77037 18.31 11.1865C19.5596 15.6025 21.7272 18.8558 23.1514 18.4528Z" fill="currentColor"/>
              <path d="M31.9584 11.3239C33.2949 6.9333 33.2305 3.02462 31.8145 2.59361C30.3985 2.16259 28.1672 5.37245 26.8307 9.76304C25.4943 14.1536 25.5587 18.0623 26.9747 18.4933C28.3907 18.9243 30.622 15.7145 31.9584 11.3239Z" fill="currentColor"/>
              <path d="M38.2514 17.2565C41.7491 14.285 43.8077 10.9617 42.8493 9.83373C41.891 8.70573 38.2787 10.2002 34.7811 13.1716C31.2834 16.1431 29.2249 19.4664 30.1832 20.5944C31.1415 21.7224 34.7538 20.228 38.2514 17.2565Z" fill="currentColor"/>
              <path d="M40.3322 25.6519C44.8812 25.0433 48.4097 23.3607 48.2134 21.8936C48.0172 20.4266 44.1704 19.7307 39.6214 20.3392C35.0725 20.9478 31.5439 22.6304 31.7402 24.0975C31.9365 25.5645 35.7832 26.2605 40.3322 25.6519Z" fill="currentColor"/>
              <path d="M46.2004 34.941C46.8285 33.6008 43.9688 30.9355 39.813 28.9879C35.6573 27.0403 31.7792 26.548 31.1511 27.8882C30.523 29.2285 33.3827 31.8938 37.5385 33.8414C41.6942 35.7889 45.5723 36.2813 46.2004 34.941Z" fill="currentColor"/>
              <path d="M37.4589 44.8299C38.7119 44.0421 37.7473 40.2537 35.3044 36.3684C32.8615 32.4831 29.8653 29.9722 28.6123 30.76C27.3593 31.5478 28.3239 35.3362 30.7668 39.2215C33.2097 43.1068 36.2059 45.6178 37.4589 44.8299Z" fill="currentColor"/>
            </svg>
            <span className="text-lg font-semibold text-foreground">Origins</span>
          </div>
          <p className="text-muted-foreground">
            Connecting families through memories, one story at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
