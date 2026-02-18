"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { branchesApi, CreateBranchData } from "@/lib/api/branches.api";
import { useUIStore } from "@/stores";
import { Button, Input, Textarea } from "@/components/ui";
import { Building2, ArrowLeft, Loader2, UserPlus, ChevronDown, ChevronUp } from "lucide-react";

// Manager schema
const managerSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  email: z
    .string()
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .min(5, "Phone number must be at least 5 characters")
    .max(20, "Phone number must be less than 20 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
});

// Branch schema
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
  createManager: z.boolean().default(false),
  manager: managerSchema.optional(),
}).superRefine((data, ctx) => {
  // If createManager is true, manager must be provided
  if (data.createManager && !data.manager) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Manager information is required when creating a manager",
      path: ["manager"],
    });
  }
});

type BranchFormData = z.infer<typeof branchSchema>;

export default function CreateBranchPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManagerSection, setShowManagerSection] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      createManager: false,
      manager: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
      },
    },
  });

  const createManager = watch("createManager");

  const toggleManagerSection = () => {
    const newValue = !showManagerSection;
    setShowManagerSection(newValue);
    setValue("createManager", newValue);
  };

  const onSubmit = async (data: BranchFormData) => {
    setIsSubmitting(true);
    try {
      const branchData: CreateBranchData = {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email || undefined,
        isActive: true,
      };

      // Add manager if provided
      if (data.createManager && data.manager) {
        branchData.manager = {
          firstName: data.manager.firstName,
          lastName: data.manager.lastName,
          email: data.manager.email,
          phone: data.manager.phone,
          password: data.manager.password,
        };
      }

      const response = await branchesApi.create(branchData);
      console.log("Branch created:", response.data);

      const successMessage = data.createManager
        ? "Branch and manager created successfully!"
        : "Branch created successfully!";
      addToast(successMessage, "success");
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
    <div className="max-w-3xl mx-auto">
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
        className="space-y-6"
      >
        {/* Branch Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            Branch Information
          </h2>
          
          <div className="space-y-5">
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

            {/* Phone & Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <p className="mt-1 text-xs text-gray-500">Optional - for patient contact</p>
              </div>
            </div>
          </div>
        </div>

        {/* Manager Section Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={toggleManagerSection}
            className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
              showManagerSection
                ? "bg-teal-50 border-b border-teal-100"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <UserPlus className={`w-5 h-5 ${showManagerSection ? "text-teal-600" : "text-gray-400"}`} />
              <div className="text-left">
                <span className={`font-medium ${showManagerSection ? "text-teal-900" : "text-gray-700"}`}>
                  {showManagerSection ? "Manager Information" : "Add Branch Manager"}
                </span>
                <p className="text-xs text-gray-500">
                  {showManagerSection
                    ? "Fill in the manager details below"
                    : "Optionally create a manager account for this branch"}
                </p>
              </div>
            </div>
            {showManagerSection ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Manager Fields */}
          {showManagerSection && (
            <div className="p-6 space-y-5 bg-teal-50/50">
              <div className="p-3 bg-teal-100 rounded-lg text-sm text-teal-800">
                <strong>Note:</strong> The manager will use their email and password to log in to the system.
              </div>

              {/* Name Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    id="manager.firstName"
                    type="text"
                    label="First Name *"
                    placeholder="e.g., John"
                    {...register("manager.firstName")}
                    error={errors.manager?.firstName?.message}
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    id="manager.lastName"
                    type="text"
                    label="Last Name *"
                    placeholder="e.g., Doe"
                    {...register("manager.lastName")}
                    error={errors.manager?.lastName?.message}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Email & Phone Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    id="manager.email"
                    type="email"
                    label="Email Address *"
                    placeholder="e.g., john.doe@toothandtruth.com"
                    {...register("manager.email")}
                    error={errors.manager?.email?.message}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500">Used for login</p>
                </div>
                <div>
                  <Input
                    id="manager.phone"
                    type="tel"
                    label="Phone Number *"
                    placeholder="e.g., +95 9 123 456 789"
                    {...register("manager.phone")}
                    error={errors.manager?.phone?.message}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="max-w-md">
                <Input
                  id="manager.password"
                  type="password"
                  label="Password *"
                  placeholder="Min 8 characters"
                  {...register("manager.password")}
                  error={errors.manager?.password?.message}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-end gap-4">
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
                  Create Branch{showManagerSection ? " & Manager" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
