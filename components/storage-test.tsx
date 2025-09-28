"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function StorageTest() {
  const [isTesting, setIsTesting] = useState(false);

  const testStorage = async () => {
    setIsTesting(true);
    try {
      const supabase = createClient();
      
      // Test 1: Check if we can list buckets
      console.log("Testing storage access...");
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError);
        toast.error(`Error listing buckets: ${bucketsError.message}`);
        return;
      }
      
      console.log("Available buckets:", buckets);
      toast.success(`Found ${buckets.length} buckets`);
      
      // Test 2: Check if avatars bucket exists
      const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars');
      if (!avatarsBucket) {
        toast.error("Avatars bucket does not exist! Please create it in Supabase dashboard.");
        return;
      }
      
      toast.success("Avatars bucket exists!");
      
      // Test 3: Try to list files in avatars bucket
      const { data: files, error: filesError } = await supabase.storage
        .from("avatars")
        .list();
        
      if (filesError) {
        console.error("Error listing files:", filesError);
        toast.error(`Error listing files: ${filesError.message}`);
        return;
      }
      
      console.log("Files in avatars bucket:", files);
      toast.success(`Found ${files.length} files in avatars bucket`);
      
    } catch (error) {
      console.error("Storage test error:", error);
      toast.error(`Storage test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Button 
      onClick={testStorage} 
      disabled={isTesting}
      variant="outline"
      size="sm"
    >
      {isTesting ? "Testing..." : "Test Storage"}
    </Button>
  );
}
