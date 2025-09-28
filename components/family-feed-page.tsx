"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Plus } from "lucide-react";
import { CreatePostModal } from "@/components/create-post-modal";
import { PostCard } from "@/components/post-card";

interface FamilyMember {
  id: string;
  full_name: string;
  relationship: string;
  profile_image_url?: string;
  user_id: string | null;
  avatar_url?: string;
}

interface Post {
  id: string;
  content: string;
  post_type: string;
  image_urls?: string[];
  created_at: string;
  family_members: FamilyMember;
}

interface FamilyFeedPageProps {
  posts: Post[];
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const postVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
    },
  },
  hover: {
    y: -5,
    transition: {
      duration: 0.2,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
    },
  },
};

export function FamilyFeedPage({ posts }: FamilyFeedPageProps) {
  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-6 bg-background min-h-screen p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Post Button */}
      <motion.div
        className="flex items-center justify-between py-4 pt-6"
        variants={itemVariants}
      >
        <motion.div variants={headerVariants}>
          <motion.h1
            className="text-3xl font-bold text-foreground mb-2"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            Family Feed
          </motion.h1>
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Stay connected with your loved ones
          </motion.p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CreatePostModal>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </CreatePostModal>
        </motion.div>
      </motion.div>

      {/* Posts Feed */}
      <motion.div className="space-y-4" variants={itemVariants}>
        {posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-card shadow-sm border-border">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.5,
                      type: "spring",
                      bounce: 0.4,
                    }}
                  >
                    <Heart className="w-16 h-16 text-muted-foreground mx-auto" />
                  </motion.div>
                  <motion.h3
                    className="text-lg font-semibold text-card-foreground"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    No posts yet
                  </motion.h3>
                  <motion.p
                    className="text-muted-foreground max-w-md mx-auto"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                  >
                    Be the first to share a memory, milestone, or update with
                    your family!
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CreatePostModal>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Post
                      </Button>
                    </CreatePostModal>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  variants={postVariants}
                  custom={index}
                  whileHover="hover"
                  transition={{ delay: index * 0.1 }}
                  layout
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
