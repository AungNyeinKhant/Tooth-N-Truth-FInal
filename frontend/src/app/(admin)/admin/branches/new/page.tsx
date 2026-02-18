"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { branchesApi, CreateBranchData } from "@/lib/api/branches.api";
import { useUIStore } from "@/stores";
import { Button, Input, Textarea } from "@/components/ui";
import { Building2, ArrowLeft, Loader2 } from "lucide-react";

const branchSchema = z.object({
  name: z
    .string()
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name must be less than 100 characters"),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(255, "Address must be less than 255 characters"),
  phone: z
    .string()
    .min(5, "Phone number must be at least 5 characters")
    .max(20, "Phone number must be less than 20 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
});

type BranchFormData = z.infer<typeof branchSchema>;

export default function CreateBranchPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = async (data: BranchFormData) => {
    setIsSubmitting(true);
    try {
      const branchData: CreateBranchData = {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email || undefined,
      };

      await branchesApi.create(branchData);
      addToast("Branch created successfully!", "success");
      router.push("/admin/branches");
    } catch (error: any) {
      console.error("Failed to create branch:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create branch";
      addToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <a
          href="/admin/branches"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Branches
        </a>
        <h1 className="text-2xl font-bold text-gray-900">Create New Branch</h1>
        <p className="text-sm text-gray-500">
          Add a new clinic location to the system
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6"
      >
        {/* Branch Name */}
        <div>
          <Input
            id="name"
            type="text"
            label="Branch Name *"
            placeholder="e.g., Downtown Dental Clinic"
            {...register("name")}
            error={errors.name?.message}
            className="w-full"
          />
        </div>

        {/* Address */}
        <div>
          <Textarea
            id="address"
            label="Address *"
            placeholder="e.g., 123 Main Street, Downtown, Yangon"
            {...register("address")}
            error={errors.address?.message}
            className="w-full min-h-[100px]"
          />
        </div>

        {/* Phone */}
        <div>
          <Input
            id="phone"
            type="tel"
            label="Phone Number *"
            placeholder="e.g., +95 1 234 5678"
            {...register("phone")}
            error={errors.phone?.message}
            className="w-full"
          />
        </div>

        {/* Email */}
        <div>
          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="e.g., downtown@toothandtruth.com"
            {...register("email")}
            error={errors.email?.message}
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500">Optional</p>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <a
            href="/admin/branches"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </a>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                Create Branch
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
