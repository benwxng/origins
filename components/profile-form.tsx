"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Upload, X, User } from "lucide-react";
import { updateProfile } from "@/lib/actions/profile";

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
    phone: profile?.phone || "",
    location: profile?.location || "",
    pronouns: profile?.pronouns || "",
    bio: profile?.bio || "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile?.avatar_url || null
  );
  const [isDragOver, setIsDragOver] = useState(false);
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

  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, or GIF)');
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUploadMessage(null);

    try {
      console.log("Submitting profile with data:", formData);
      console.log("Avatar file:", avatarFile);
      
      const result = await updateProfile(formData, avatarFile);
      console.log("Profile update result:", result);
      
      setUploadMessage("Profile updated successfully!");
      
      // Clear the form file after successful upload
      if (avatarFile) {
        setAvatarFile(null);
        // Refresh the page to show the updated avatar
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setUploadMessage(`Error updating profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-gray-900 font-medium">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                className="placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-900 font-medium">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                className="placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-900 font-medium">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-gray-600">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-gray-900 font-medium">Bio</Label>
            <Input
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself"
              className="placeholder:text-gray-500"
            />
          </div>

        </CardContent>
      </Card>

      {/* Profile Picture */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-gray-200">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              {avatarFile && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="avatar" className="cursor-pointer">
                  <div 
                    className={`flex items-center space-x-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${
                      isDragOver 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700 font-medium">
                      {isDragOver ? 'Drop photo here' : 'Choose Photo or Drag & Drop'}
                    </span>
                  </div>
                </Label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
              {avatarFile && (
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(profile?.avatar_url || null);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                  <span className="text-xs text-gray-500">
                    {avatarFile.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-900 font-medium">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
                className="placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-gray-900 font-medium">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, State/Country"
                className="placeholder:text-gray-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pronouns */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Pronouns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-900 font-medium">Select your pronouns</Label>
            <div className="flex flex-wrap gap-2">
              {pronounOptions.map((pronoun) => (
                <Button
                  key={pronoun}
                  type="button"
                  variant={formData.pronouns === pronoun ? "default" : "outline"}
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
                <span className="text-sm text-gray-600">Selected:</span>
                <Badge variant="secondary">{formData.pronouns}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button and Messages */}
      <div className="space-y-4">
        {uploadMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            uploadMessage.includes("successfully") 
              ? "bg-green-50 text-green-800 border border-green-200" 
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {uploadMessage}
          </div>
        )}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
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
