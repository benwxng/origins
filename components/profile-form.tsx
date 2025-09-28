"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, User } from "lucide-react";
import { updateProfile } from "@/lib/actions/profile";
import { ThemeSelector } from "@/components/theme-selector";

interface ProfileFormProps {
  profile: any;
  user: any;
}

export function ProfileForm({ profile, user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || user.user_metadata?.full_name || "",
    username: profile?.username || user.email?.split("@")[0] || "",
    email: user.email || "",
    phone: profile?.phone_number || "",
    pronouns: profile?.pronouns || "",
    bio: profile?.bio || "",
  });

  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const pronounOptions = [
    "he/him",
    "she/her",
    "they/them",
    "he/they",
    "she/they",
    "other",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePronounSelect = (pronoun: string) => {
    setFormData((prev) => ({
      ...prev,
      pronouns: pronoun,
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUploadMessage(null);

    try {
      console.log("Submitting profile with data:", formData);

      const result = await updateProfile(formData, null);
      console.log("Profile update result:", result);

      setUploadMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setUploadMessage(
        `Error updating profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="bg-card shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-foreground font-medium">
                Full Name
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground font-medium">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                className="placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-foreground font-medium">
              Bio
            </Label>
            <Input
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself"
              className="placeholder:text-muted-foreground"
            />
          </div>

        </CardContent>
      </Card>


      {/* Contact Information */}
      <Card className="bg-card shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                className="placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pronouns */}
      <Card className="bg-card shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">
            Pronouns
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground font-medium">
              Select your pronouns
            </Label>
            <div className="flex flex-wrap gap-2">
              {pronounOptions.map((pronoun) => (
                <Button
                  key={pronoun}
                  type="button"
                  variant={
                    formData.pronouns === pronoun ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handlePronounSelect(pronoun)}
                  className="text-sm"
                >
                  {pronoun}
                </Button>
              ))}
            </div>
            {formData.pronouns && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                <Badge variant="secondary">{formData.pronouns}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <ThemeSelector />
      
      {/* Save Button and Messages */}
      <div className="space-y-4">
        {uploadMessage && (
          <div
            className={`p-3 rounded-lg text-sm ${
              uploadMessage.includes("successfully")
                ? "bg-success/10 text-success border border-success/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {uploadMessage}
          </div>
        )}
        
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
