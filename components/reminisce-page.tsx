"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Calendar,
  Users,
  Play,
  Star,
  Plus,
  Sparkles,
} from "lucide-react";
import { CreateMemoryModal } from "@/components/create-memory-modal";
import { MemoryCard } from "@/components/memory-card";
import { generateMemoryPrompts } from "@/lib/actions/memories";

interface ReminiscePageProps {
  memories: any[];
  familyMembers: any[];
  initialPrompts: string[];
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

const cardVariants = {
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
    scale: 1.02,
    y: -5,
    transition: {
      duration: 0.2,
    },
  },
};

const promptVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
    },
  },
  hover: {
    scale: 1.02,
    x: 5,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

const decadeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

export function ReminiscePage({
  memories,
  familyMembers,
  initialPrompts,
}: ReminiscePageProps) {
  const [memoryPrompts, setMemoryPrompts] = useState(initialPrompts);
  const [isPending, startTransition] = useTransition();

  const handleGenerateNewPrompts = () => {
    startTransition(async () => {
      try {
        const result = await generateMemoryPrompts();
        if (result.success && result.prompts) {
          setMemoryPrompts(result.prompts);
        }
      } catch (error) {
        console.error("Failed to generate new prompts:", error);
      }
    });
  };

  const decades = [
    "1930s",
    "1940s",
    "1950s",
    "1960s",
    "1970s",
    "1980s",
    "1990s",
    "2000s",
  ];

  // Group memories by decade for browsing
  const memoriesByDecade = memories.reduce((acc: any, memory: any) => {
    if (memory.memory_date) {
      const year = new Date(memory.memory_date).getFullYear();
      const decade = `${Math.floor(year / 10) * 10}s`;
      if (!acc[decade]) acc[decade] = [];
      acc[decade].push(memory);
    }
    return acc;
  }, {});

  const favoriteMemories = memories.filter((memory: any) => memory.is_favorite);

  return (
    <motion.div
      className="max-w-6xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Add Memory Button */}
      <motion.div
        className="flex items-center justify-between py-6"
        variants={itemVariants}
      >
        <div>
          <motion.h1
            className="text-4xl font-bold text-gray-900 mb-3"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            Reminisce
          </motion.h1>
          <motion.p
            className="text-xl text-gray-600"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Explore and share your precious memories
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CreateMemoryModal familyMembers={familyMembers}>
            <Button className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Add Memory
            </Button>
          </CreateMemoryModal>
        </motion.div>
      </motion.div>

      {/* Memory Prompts Section */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <motion.h2
                  className="text-2xl font-semibold text-gray-900 flex items-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <Heart className="w-6 h-6 mr-3 text-purple-600" />
                  Memory Prompts
                </motion.h2>
                <motion.p
                  className="text-gray-600"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  Let these prompts help you remember and share your stories
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleGenerateNewPrompts}
                  disabled={isPending}
                  variant="outline"
                  className="bg-white hover:bg-purple-50 border-purple-200 text-purple-700 hover:text-purple-800 transition-all duration-200"
                >
                  <motion.div
                    animate={isPending ? { rotate: 360 } : { rotate: 0 }}
                    transition={{
                      duration: 1,
                      repeat: isPending ? Infinity : 0,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                  </motion.div>
                  {isPending ? "Generating..." : "Generate New Prompts"}
                </Button>
              </motion.div>
            </div>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              layout
            >
              <AnimatePresence mode="wait">
                {memoryPrompts.map((prompt, index) => (
                  <motion.div
                    key={`${prompt}-${index}`}
                    variants={promptVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <CreateMemoryModal
                      familyMembers={familyMembers}
                      initialTitle={prompt}
                    >
                      <Button
                        variant="outline"
                        className="h-auto p-4 text-left justify-start bg-white hover:bg-purple-50 border-purple-200 w-full transition-all duration-200"
                      >
                        <Play className="w-4 h-4 mr-3 text-purple-600 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">
                          {prompt}
                        </span>
                      </Button>
                    </CreateMemoryModal>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Browse by Decade */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <motion.h2
              className="text-2xl font-semibold text-gray-900 flex items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Calendar className="w-6 h-6 mr-3 text-blue-600" />
              Browse by Decade
            </motion.h2>
            <motion.p
              className="text-gray-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              Explore memories from different periods of your life
            </motion.p>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {decades.map((decade, index) => {
                const count = memoriesByDecade[decade]?.length || 0;
                return (
                  <motion.div
                    key={decade}
                    variants={decadeVariants}
                    whileHover="hover"
                    whileTap="tap"
                    custom={index}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant="outline"
                      className="h-16 bg-gradient-to-b from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 flex flex-col transition-all duration-200"
                    >
                      <div className="font-semibold text-blue-800">
                        {decade}
                      </div>
                      <div className="text-xs text-blue-600">
                        {count} memories
                      </div>
                    </Button>
                  </motion.div>
                );
              })}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Featured/Favorite Memories */}
      {favoriteMemories.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              className="text-2xl font-semibold text-gray-900 flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Star className="w-6 h-6 mr-3 text-yellow-500" />
              Favorite Memories
            </motion.h2>
          </div>

          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {favoriteMemories.slice(0, 6).map((memory: any, index: number) => (
              <motion.div
                key={memory.id}
                variants={cardVariants}
                custom={index}
                whileHover="hover"
                transition={{ delay: index * 0.1 }}
              >
                <MemoryCard memory={memory} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* All Memories */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-6">
          <motion.h2
            className="text-2xl font-semibold text-gray-900 flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Users className="w-6 h-6 mr-3 text-muted-foreground" />
            All Family Memories ({memories.length})
          </motion.h2>
        </div>

        {memories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <Card className="bg-white shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.2, type: "spring" }}
                  >
                    <Heart className="w-16 h-16 text-gray-300 mx-auto" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-700">
                    No memories yet
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Start preserving your family&apos;s precious memories and
                    stories.
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CreateMemoryModal familyMembers={familyMembers}>
                      <Button className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Memory
                      </Button>
                    </CreateMemoryModal>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {memories.map((memory: any, index: number) => (
              <motion.div
                key={memory.id}
                variants={cardVariants}
                custom={index}
                whileHover="hover"
                transition={{ delay: index * 0.05 }}
              >
                <MemoryCard memory={memory} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Memory Activity Stats */}
      <motion.div variants={itemVariants}>
        <Card className="bg-muted">
          <CardHeader>
            <motion.h2
              className="text-2xl font-semibold text-gray-900 flex items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.1 }}
            >
              <Users className="w-6 h-6 mr-3 text-muted-foreground" />
              Memory Activity
            </motion.h2>
            <motion.p
              className="text-gray-600"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.2 }}
            >
              See how your family is engaging with memories
            </motion.p>
          </CardHeader>
          <CardContent>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: 1.3 }}
              >
                <motion.div
                  className="text-3xl font-bold text-muted-foreground mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.4, type: "spring" }}
                >
                  {memories.length}
                </motion.div>
                <p className="text-gray-600">Total Memories</p>
              </motion.div>
              <motion.div
                className="text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: 1.4 }}
              >
                <motion.div
                  className="text-3xl font-bold text-blue-600 mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.5, type: "spring" }}
                >
                  {favoriteMemories.length}
                </motion.div>
                <p className="text-gray-600">Favorite Memories</p>
              </motion.div>
              <motion.div
                className="text-center"
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: 1.5 }}
              >
                <motion.div
                  className="text-3xl font-bold text-purple-600 mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.6, type: "spring" }}
                >
                  {Object.keys(memoriesByDecade).length}
                </motion.div>
                <p className="text-gray-600">Decades Covered</p>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
