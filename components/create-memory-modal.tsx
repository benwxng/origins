"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mic, MicOff, Square } from "lucide-react";
import { createMemory } from "@/lib/actions/memories";

interface FamilyMember {
  id: string;
  full_name: string;
  relationship: string;
}

interface CreateMemoryModalProps {
  children: React.ReactNode;
  familyMembers: FamilyMember[];
  initialTitle?: string;
}

// Animation variants
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

const formItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

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

export function CreateMemoryModal({
  children,
  familyMembers,
  initialTitle = "",
}: CreateMemoryModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [tags, setTags] = useState("");
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check for speech recognition support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setSpeechSupported(!!SpeechRecognition);

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setDescription((prev) => prev + finalTranscript + " ");
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          if (isRecording) {
            // Restart if we're still supposed to be recording
            recognition.start();
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [isRecording]);

  const startRecording = () => {
    if (recognitionRef.current && speechSupported) {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(false);
      recognitionRef.current.stop();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("memoryDate", memoryDate);
      formData.append("tags", tags);
      formData.append("familyMemberId", familyMemberId);

      await createMemory(formData);

      // Reset form
      setTitle("");
      setDescription("");
      setMemoryDate("");
      setTags("");
      setFamilyMemberId("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating memory:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update title when initialTitle changes and modal opens
  useEffect(() => {
    if (open && initialTitle) {
      setTitle(initialTitle);
    }
  }, [open, initialTitle]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <AnimatePresence>
        {open && (
          <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="p-6"
            >
              <DialogHeader>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <DialogTitle>Add a Family Memory</DialogTitle>
                </motion.div>
              </DialogHeader>

              <motion.form
                onSubmit={handleSubmit}
                className="space-y-6 mt-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Title Input */}
                <motion.div className="space-y-2" variants={formItemVariants}>
                  <Label htmlFor="title">Memory Title</Label>
                  <motion.div
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      id="title"
                      placeholder="What memory would you like to share?"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </motion.div>
                </motion.div>

                {/* Description Input with Voice Recording */}
                <motion.div className="space-y-2" variants={formItemVariants}>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Memory Description</Label>
                    {speechSupported && (
                      <div className="flex items-center space-x-2">
                        <AnimatePresence>
                          {isRecording && (
                            <motion.span
                              className="text-xs text-red-600"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                            >
                              <motion.span
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                {isListening ? "Listening..." : "Starting..."}
                              </motion.span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={
                              isRecording ? stopRecording : startRecording
                            }
                            className={`h-8 w-8 p-0 transition-all duration-200 ${
                              isRecording
                                ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                                : "hover:bg-purple-50 border-purple-200 text-purple-600"
                            }`}
                          >
                            <motion.div
                              animate={
                                isRecording
                                  ? { scale: [1, 1.1, 1] }
                                  : { scale: 1 }
                              }
                              transition={{
                                duration: 0.5,
                                repeat: isRecording ? Infinity : 0,
                              }}
                            >
                              {isRecording ? (
                                <Square className="w-4 h-4" />
                              ) : (
                                <Mic className="w-4 h-4" />
                              )}
                            </motion.div>
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <motion.textarea
                      id="description"
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px] transition-all duration-200"
                      placeholder="Tell the story of this memory in detail... (or click the microphone to dictate)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      whileFocus={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    />
                    <AnimatePresence>
                      {isRecording && (
                        <motion.div
                          className="absolute bottom-2 right-2 flex items-center space-x-1 bg-red-50 px-2 py-1 rounded-full"
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <motion.div
                            className="w-2 h-2 bg-red-500 rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          <span className="text-xs text-red-600">
                            Recording
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {speechSupported && (
                    <motion.p
                      className="text-xs text-gray-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      💡 Click the microphone to dictate your memory instead of
                      typing
                    </motion.p>
                  )}
                  {!speechSupported && (
                    <p className="text-xs text-gray-400">
                      Voice dictation is not supported in your browser
                    </p>
                  )}
                </motion.div>

                {/* Who is this memory about */}
                <motion.div className="space-y-2" variants={formItemVariants}>
                  <Label htmlFor="familyMember">
                    Who is this memory about?
                  </Label>
                  <motion.select
                    id="familyMember"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    value={familyMemberId}
                    onChange={(e) => setFamilyMemberId(e.target.value)}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <option value="">Select a family member (optional)</option>
                    {familyMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} ({member.relationship})
                      </option>
                    ))}
                  </motion.select>
                </motion.div>

                {/* Memory Date */}
                <motion.div className="space-y-2" variants={formItemVariants}>
                  <Label htmlFor="memoryDate">
                    When did this happen? (optional)
                  </Label>
                  <motion.div
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      id="memoryDate"
                      type="date"
                      value={memoryDate}
                      onChange={(e) => setMemoryDate(e.target.value)}
                    />
                  </motion.div>
                </motion.div>

                {/* Tags */}
                <motion.div className="space-y-2" variants={formItemVariants}>
                  <Label htmlFor="tags">Tags (optional)</Label>
                  <motion.div
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Input
                      id="tags"
                      placeholder="wedding, childhood, vacation, holiday (comma separated)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                  </motion.div>
                  <motion.p
                    className="text-xs text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Add tags to help organize and find this memory later
                  </motion.p>
                </motion.div>

                <DialogFooter className="mt-8">
                  <motion.div
                    className="flex space-x-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (isRecording) stopRecording();
                          setOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        disabled={
                          !title.trim() || !description.trim() || isSubmitting
                        }
                        className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
                      >
                        <motion.span
                          animate={
                            isSubmitting
                              ? { opacity: [1, 0.5, 1] }
                              : { opacity: 1 }
                          }
                          transition={{
                            duration: 1,
                            repeat: isSubmitting ? Infinity : 0,
                          }}
                        >
                          {isSubmitting ? "Saving..." : "Save Memory"}
                        </motion.span>
                      </Button>
                    </motion.div>
                  </motion.div>
                </DialogFooter>
              </motion.form>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
