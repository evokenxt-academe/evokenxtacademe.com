"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";

export default function CreateStreamPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    program: "",
    level: "",
    course: "",
    scheduledDate: "",
    scheduledTime: "",
    timezone: "Asia/Kolkata",
    tags: "",
    notes: "",
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);
  const [checkingYouTube, setCheckingYouTube] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from("courses").select("id, title").order("title");
      if (error) {
        console.error("Failed to fetch courses:", error);
      }
      if (data) setCourses(data);
    };

    const checkYouTubeConnection = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("youtube_tokens")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();
            
          if (data) setIsYouTubeConnected(true);
        }
      } catch (err) {
        console.error("Error checking youtube connection", err);
      } finally {
        setCheckingYouTube(false);
      }
    };

    fetchCourses();
    checkYouTubeConnection();
  }, [supabase]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep: 1 | 2 | 3): boolean => {
    switch (currentStep) {
      case 1:
        return !!(
          formData.title &&
          formData.program &&
          formData.level &&
          formData.course &&
          formData.scheduledDate &&
          formData.scheduledTime
        );
      case 2:
        // YouTube setup is optional for now
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep((step + 1) as 1 | 2 | 3);
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const handleCreateStream = async () => {
    if (!validateStep(1)) {
      toast.error("Please complete all required fields");
      return;
    }

    setLoading(true);
    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get course ID from the form selection
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id")
        .eq("id", formData.course)
        .single();

      if (courseError || !course) throw new Error("Could not find course");

      // Create the stream
      const { data: stream, error: streamError } = await supabase
        .from("live_streams")
        .insert([
          {
            course_id: course.id,
            instructor_id: user.id,
            title: formData.title,
            description: formData.description,
            scheduled_at: `${formData.scheduledDate}T${formData.scheduledTime}:00`,
            tags: formData.tags.split(",").filter((t) => t.trim()),
            notes: formData.notes,
            status: "scheduled",
          },
        ])
        .select()
        .single();

      if (streamError) throw streamError;

      toast.success("Stream created successfully!");
      router.push(`/admin/live-streams/${stream.id}`);
    } catch (error) {
      console.error("Failed to create stream:", error);
      toast.error("Failed to create stream");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Live Stream</h1>
        <p className="text-muted-foreground">
          Set up a new live class broadcast
        </p>
      </div>

      <Tabs value={`step-${step}`} onValueChange={() => {}} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="step-1" onClick={() => step > 1 && setStep(1)}>
            <span className="flex items-center gap-2">
              {step > 1 ? <Check className="w-4 h-4" /> : "1"}
              Details
            </span>
          </TabsTrigger>
          <TabsTrigger value="step-2" onClick={() => step > 2 && setStep(2)}>
            <span className="flex items-center gap-2">
              {step > 2 ? <Check className="w-4 h-4" /> : "2"}
              YouTube
            </span>
          </TabsTrigger>
          <TabsTrigger value="step-3" onClick={() => step > 3 && setStep(3)}>
            <span className="flex items-center gap-2">
              {step > 3 ? <Check className="w-4 h-4" /> : "3"}
              Review
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Step 1: Stream Details */}
        <TabsContent value="step-1">
          <Card>
            <CardHeader>
              <CardTitle>Stream Details</CardTitle>
              <CardDescription>
                Basic information about your live stream
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">
                  Stream Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., ACCA BT — Session 12"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add a brief description of this stream..."
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="mt-2 h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="program">
                    Program <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.program}
                    onValueChange={(v) => handleInputChange("program", v)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCA">ACCA</SelectItem>
                      <SelectItem value="CFA">CFA</SelectItem>
                      <SelectItem value="CMA">CMA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="level">
                    Level <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.level}
                    onValueChange={(v) => handleInputChange("level", v)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.program === "ACCA" && (
                        <>
                          <SelectItem value="Applied Knowledge">
                            Applied Knowledge
                          </SelectItem>
                          <SelectItem value="Applied Skills">
                            Applied Skills
                          </SelectItem>
                          <SelectItem value="Strategic Professional">
                            Strategic Professional
                          </SelectItem>
                        </>
                      )}
                      {formData.program === "CFA" && (
                        <>
                          <SelectItem value="Level 1">Level 1</SelectItem>
                          <SelectItem value="Level 2">Level 2</SelectItem>
                          <SelectItem value="Level 3">Level 3</SelectItem>
                        </>
                      )}
                      {formData.program === "CMA" && (
                        <>
                          <SelectItem value="Part 1">Part 1</SelectItem>
                          <SelectItem value="Part 2">Part 2</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="course">
                  Course <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.course}
                  onValueChange={(v) => handleInputChange("course", v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">
                    Scheduled Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      handleInputChange("scheduledDate", e.target.value)
                    }
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="time">
                    Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) =>
                      handleInputChange("scheduledTime", e.target.value)
                    }
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(v) => handleInputChange("timezone", v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Asia/Kolkata">
                      Asia/Kolkata (IST)
                    </SelectItem>
                    <SelectItem value="Europe/London">
                      Europe/London (GMT)
                    </SelectItem>
                    <SelectItem value="America/New_York">
                      America/New_York (EST)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="e.g., theory, lecture, exam-prep (comma separated)"
                  value={formData.tags}
                  onChange={(e) => handleInputChange("tags", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Private notes visible only to instructors..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="mt-2 h-20"
                />
              </div>

              <Button onClick={handleNextStep} className="w-full gap-2">
                Next: YouTube Setup <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: YouTube Setup */}
        <TabsContent value="step-2">
          <Card>
            <CardHeader>
              <CardTitle>YouTube Setup</CardTitle>
              <CardDescription>Connect your YouTube channel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>YouTube Connection Required</AlertTitle>
                <AlertDescription>
                  Connect your YouTube channel to automatically create and
                  manage live broadcasts. This step is optional and can be
                  completed later.
                </AlertDescription>
              </Alert>

              <div className="bg-muted/50 p-4 rounded-lg text-center py-12">
                {checkingYouTube ? (
                  <p className="text-sm text-muted-foreground">Checking connection...</p>
                ) : isYouTubeConnected ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-green-100 text-green-700 p-3 rounded-full mb-2">
                      <Check className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-medium text-green-700 mb-2">
                      YouTube Channel Connected!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your YouTube channel is successfully linked. You can automatically create and manage live broadcasts.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      YouTube channel not connected yet
                    </p>
                    <Button variant="outline" asChild>
                      <a href="/api/youtube/oauth/authorize">
                        Connect YouTube Channel
                      </a>
                    </Button>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={handleNextStep} className="flex-1 gap-2">
                  Next: Review <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Review */}
        <TabsContent value="step-3">
          <Card>
            <CardHeader>
              <CardTitle>Review & Schedule</CardTitle>
              <CardDescription>Confirm your stream details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-semibold">{formData.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Program / Level / Course
                  </p>
                  <p className="font-semibold">
                    {formData.program} / {formData.level} / {courses.find((c) => c.id === formData.course)?.title || formData.course}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="font-semibold">
                    {formData.scheduledDate} at {formData.scheduledTime} (
                    {formData.timezone})
                  </p>
                </div>
                {formData.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-semibold">{formData.description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateStream}
                  disabled={loading}
                  className="flex-1 gap-2"
                >
                  {loading ? "Creating..." : "Schedule Stream"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
