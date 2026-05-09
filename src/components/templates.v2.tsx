/**
 * ============================================================
 * Evoke EduGlobal LMS v2.0.0 - UI Component Templates
 * ============================================================
 * React/Next.js + shadcn/ui components
 * Place in: src/components/[page]/[component].tsx
 * 
 * NOTE: This file is commented out to prevent TypeScript duplicate 
 * identifier errors. Copy and uncomment into actual route files.
 */

/*
// ============================================================
// 1. COURSE CARD (Catalog)
// ============================================================
// File: src/components/catalog/course-card.tsx

import type { CourseDetail } from "@/types/database.v2.types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

export function CourseCard({ course }: { course: CourseDetail }) {
  const rating = course.reviews?.length
    ? (
        course.reviews.reduce((sum, r) => sum + r.rating, 0) /
        course.reviews.length
      ).toFixed(1)
    : "—";

  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {course.thumbnail_url && (
          <div className="relative h-48 bg-muted overflow-hidden">
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover"
            />
            {course.subject?.program_level?.program && (
              <Badge className="absolute top-3 right-3">
                {course.subject.program_level.program.body}
              </Badge>
            )}
          </div>
        )}

        <div className="p-4">
          <h3 className="font-semibold line-clamp-2">{course.title}</h3>

          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {course.description}
          </p>

          {course.instructor && (
            <div className="flex items-center gap-2 mt-3">
              {course.instructor.avatar && (
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.name || "Instructor"}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-xs text-muted-foreground">
                {course.instructor.name || "Instructor"}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <span>⭐ {rating}</span>
            <span>📚 {course.total_lectures} lessons</span>
            <span>🎓 {course.chapters?.length || 0} chapters</span>
          </div>

          {course.pricing?.[0] && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">
                  ₹{(course.pricing[0].base_price / 100).toLocaleString()}
                </span>
                {course.pricing[0].discount_percentage && (
                  <Badge variant="secondary">
                    {course.pricing[0].discount_percentage}% OFF
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

// ============================================================
// 2. ENROLLMENT CARD (Dashboard)
// ============================================================
// File: src/components/dashboard/enrollment-card.tsx

import type { EnrollmentDetail } from "@/types/database.v2.types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export function EnrollmentCard({
  enrollment,
}: {
  enrollment: EnrollmentDetail;
}) {
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        {enrollment.course?.thumbnail_url && (
          <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={enrollment.course.thumbnail_url}
              alt={enrollment.course.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">
            {enrollment.course?.title || "Course"}
          </h3>

          <p className="text-xs text-muted-foreground mt-1">
            Program: {enrollment.course?.subject?.program_level?.program?.body}
          </p>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-semibold">45%</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>

          {enrollment.plan && (
            <p className="text-xs text-muted-foreground mt-2">
              EMI Plan: ₹
              {(enrollment.plan.installment_amount! / 100).toLocaleString()}/{" "}
              {enrollment.plan.num_installments} months
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <Link href={`/learn/${enrollment.course_id}`}>
              <Button size="sm" variant="default">
                Continue Learning →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// 3. LECTURE PLAYER (Learn Page)
// ============================================================
// File: src/components/learn/lecture-player.tsx

("use client");

import { useState, useRef, useEffect } from "react";
import type { Lecture, LectureProgress } from "@/types/database.v2.types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function LecturePlayer({
  lecture,
  progress,
  onProgressUpdate,
}: {
  lecture: Lecture & { resources?: any[] };
  progress?: LectureProgress;
  onProgressUpdate: (data: {
    resumePosition: number;
    watchTime: number;
    isCompleted: boolean;
  }) => Promise<void>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [watchTime, setWatchTime] = useState(progress?.watch_time_sec ?? 0);

  useEffect(() => {
    if (videoRef.current && progress?.resume_position_sec) {
      videoRef.current.currentTime = progress.resume_position_sec;
    }
  }, [progress]);

  const handleVideoTime = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setWatchTime(Math.floor(current));

      if (Math.floor(current) % 30 === 0) {
        onProgressUpdate({
          resumePosition: current,
          watchTime: current,
          isCompleted: false,
        });
      }
    }
  };

  const handleVideoEnd = async () => {
    await onProgressUpdate({
      resumePosition: 0,
      watchTime: lecture.duration_sec,
      isCompleted: true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full"
          controls
          onTimeUpdate={handleVideoTime}
          onEnded={handleVideoEnd}
          src={lecture.video_url || ""}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold">{lecture.title}</h2>
        <p className="text-muted-foreground mt-2">{lecture.description}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Duration: {Math.floor(lecture.duration_sec / 60)} minutes
        </p>
      </div>

      {lecture.resources && lecture.resources.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">📎 Resources</h3>
          <div className="space-y-2">
            {lecture.resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <span className="text-sm">{resource.title}</span>
                <Download className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 4. QUIZ QUESTION RENDERER (All 7 Types)
// ============================================================
// File: src/components/quiz/question-renderer.tsx

("use client");

import { useState } from "react";
import type { Question, QuestionType } from "@/types/database.v2.types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function QuestionRenderer({
  question,
  onAnswerChange,
}: {
  question: Question & { options?: any[] };
  onAnswerChange: (answer: any) => void;
}) {
  const [answer, setAnswer] = useState<any>(null);

  const handleChange = (value: any) => {
    setAnswer(value);
    onAnswerChange(value);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{question.question_text}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Marks: {question.marks}
          {question.negative_marks > 0 &&
            ` | -${question.negative_marks} for wrong`}
        </p>
      </div>

      {question.question_type === "mcq" && (
        <RadioGroup value={answer || ""} onValueChange={handleChange}>
          <div className="space-y-3">
            {question.options?.map((option) => (
              <Label
                key={option.id}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted"
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <span>{option.option_text}</span>
              </Label>
            ))}
          </div>
        </RadioGroup>
      )}

      {question.question_type === "multiple_select" && (
        <div className="space-y-3">
          {question.options?.map((option) => (
            <Label
              key={option.id}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted"
            >
              <Checkbox
                checked={answer?.includes(option.id) || false}
                onCheckedChange={(checked) => {
                  const newAnswer = answer || [];
                  if (checked) {
                    handleChange([...newAnswer, option.id]);
                  } else {
                    handleChange(
                      newAnswer.filter((id: string) => id !== option.id),
                    );
                  }
                }}
              />
              <span>{option.option_text}</span>
            </Label>
          ))}
        </div>
      )}

      {question.question_type === "true_false" && (
        <RadioGroup
          value={answer?.toString() || ""}
          onValueChange={(v) => handleChange(v === "true")}
        >
          <div className="space-y-3">
            <Label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
              <RadioGroupItem value="true" id="true" />
              <span>True</span>
            </Label>
            <Label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
              <RadioGroupItem value="false" id="false" />
              <span>False</span>
            </Label>
          </div>
        </RadioGroup>
      )}

      {question.question_type === "fill_blank" && (
        <Input
          placeholder="Your answer..."
          value={answer || ""}
          onChange={(e) => handleChange(e.target.value)}
          className="text-lg"
        />
      )}

      {question.question_type === "numerical" && (
        <Input
          type="number"
          placeholder="Enter number..."
          value={answer || ""}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          step="0.01"
          className="text-lg"
        />
      )}

      {question.question_type === "subjective" && (
        <Textarea
          placeholder="Write your answer here..."
          value={answer || ""}
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-32"
        />
      )}

      {question.question_type === "assertion_reasoning" && (
        <RadioGroup value={answer || ""} onValueChange={handleChange}>
          <div className="space-y-3">
            {question.options?.map((option) => (
              <Label
                key={option.id}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted"
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <span>{option.option_text}</span>
              </Label>
            ))}
          </div>
        </RadioGroup>
      )}
    </div>
  );
}

// ============================================================
// 5. PAYMENT SECTION (Enrollment)
// ============================================================
// File: src/components/enrollment/payment-section.tsx

("use client");

import { useState } from "react";
import type { CoursePricing, PaymentPlan } from "@/types/database.v2.types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentSection({
  pricing,
  course,
  onSuccess,
}: {
  pricing: (CoursePricing & { plans?: PaymentPlan[] })[];
  course: any;
  onSuccess: (enrollmentId: string) => void;
}) {
  const [selectedPricing, setSelectedPricing] = useState(pricing[0]?.id);
  const [selectedPlan, setSelectedPlan] = useState(pricing[0]?.plans?.[0]?.id);
  const [loading, setLoading] = useState(false);

  const selectedPricingData = pricing.find((p) => p.id === selectedPricing);
  const selectedPlanData = selectedPricingData?.plans?.find(
    (p) => p.id === selectedPlan,
  );

  const handleEnroll = async () => {
    setLoading(true);

    try {
      const enrollResponse = await fetch("/api/enrollment/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          pricingId: selectedPricing,
          planId: selectedPlan,
          userEmail: "user@example.com",
          userPhone: "+91XXXXXXXXXX",
        }),
      });

      const { orderId, razorpayKeyId, error } = await enrollResponse.json();

      if (error) {
        alert(`Error: ${error}`);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount:
          (selectedPlanData?.total_amount || selectedPricingData?.base_price) *
          100,
        currency: "INR",
        order_id: orderId,
        handler: async (response: any) => {
          const verifyResponse = await fetch("/api/enrollment/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseId: course.id,
              pricingId: selectedPricing,
              planId: selectedPlan,
              razorpayOrderId: orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          if (verifyResponse.ok) {
            const { enrollmentId } = await verifyResponse.json();
            onSuccess(enrollmentId);
          }
        },
      };

      new window.Razorpay(options).open();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-bold text-lg mb-4">Choose Your Plan</h3>

      <RadioGroup value={selectedPricing} onValueChange={setSelectedPricing}>
        <div className="space-y-3 mb-6">
          {pricing.map((option) => (
            <Label
              key={option.id}
              className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted"
            >
              <RadioGroupItem value={option.id} className="mt-1" />
              <div className="flex-1">
                <p className="font-semibold">{option.label}</p>
                <p className="text-lg font-bold">
                  ₹{(option.base_price / 100).toLocaleString()}
                </p>
              </div>
            </Label>
          ))}
        </div>
      </RadioGroup>

      {selectedPricingData?.plans && selectedPricingData.plans.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">Payment Options</p>
          <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
            <div className="space-y-2">
              {selectedPricingData.plans.map((plan) => (
                <Label
                  key={plan.id}
                  className="flex items-center gap-2 p-2 cursor-pointer"
                >
                  <RadioGroupItem value={plan.id} />
                  <span className="text-sm">
                    {plan.plan_type === "one_time"
                      ? "Full Payment"
                      : `${plan.num_installments} × ₹${(plan.installment_amount! / 100).toLocaleString()}`}
                  </span>
                </Label>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      <Button
        onClick={handleEnroll}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? "Processing..." : "Proceed to Payment"}
      </Button>
    </Card>
  );
}
*/
