"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doctorsApi, CreateDoctorData } from "@/lib/api/doctors.api";
import { branchesApi } from "@/lib/api/branches.api";
import { useUIStore } from "@/stores";
import { Button, Input, Textarea } from "@/components/ui";
import { UserRound, ArrowLeft, Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

const doctorSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  specialization: z
    .string()
    .min(2, "Specialization must be at least 2 characters")
    .max(100, "Specialization must be less than 100 characters"),
  phone: z
    .string()
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(1000, "Bio must be less than 1000 characters")
    .optional(),
  branchId: z
    .string()
    .min(1, "Branch is required"),
  isActive: z.boolean().default(true),
});

type DoctorFormData = z.infer<typeof doctorSchema>;

interface Branch {
  id: string;
  name: string;
}

export default function CreateDoctorPage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      specialization: "",
      phone: "",
      email: "",
      bio: "",
      branchId: "",
      isActive: true,
    },
  });

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoadingBranches(true);
        const response = await branchesApi.getAll({ status: "active", limit: 100 });
        const branchesData = response.data.data || [];
        setBranches(branchesData);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
        addToast("Failed to load branches", "error");
      } finally {
        setIsLoadingBranches(false);
      }
    };
    fetchBranches();
  }, [addToast]);

  const onSubmit = async (data: DoctorFormData) => {
    setIsSubmitting(true);
    try {
      const doctorData: CreateDoctorData = {
        firstName: data.firstName,
        lastName: data.lastName,
        specialization: data.specialization,
        phone: data.phone || undefined,
        email: data.email || undefined,
        bio: data.bio || undefined,
        branchId: data.branchId,
        isActive: data.isActive,
      };

      await doctorsApi.create(doctorData);
      addToast("Doctor created successfully! Default schedule (Mon-Fri, 9AM-5PM) has been created.", "success");
      router.push("/admin/doctors");
    } catch (error) {
      console.error("Failed to create doctor:", error);
      addToast(getErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <a
          href="/admin/doctors"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Doctors
        </a>
        <h1 className="text-2xl font-bold text-gray-900">Add New Doctor</h1>
        <p className="text-sm text-gray-500">
          Create a new healthcare professional. A default schedule (Mon-Fri, 9AM-5PM) will be created automatically.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Doctor Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserRound className="w-5 h-5 text-teal-600" />
            Doctor Information
          </h2>

          <div className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  id="firstName"
                  type="text"
                  label="First Name *"
                  placeholder="e.g., Sarah"
                  {...register("firstName")}
                  error={errors.firstName?.message}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  id="lastName"
                  type="text"
                  label="Last Name *"
                  placeholder="e.g., Johnson"
                  {...register("lastName")}
                  error={errors.lastName?.message}
                  className="w-full"
                />
              </div>
            </div>

            {/* Specialization */}
            <div>
              <Input
                id="specialization"
                type="text"
                label="Specialization *"
                placeholder="e.g., General Dentistry"
                {...register("specialization")}
                error={errors.specialization?.message}
                className="w-full"
              />
            </div>

            {/* Phone & Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  id="phone"
                  type="text"
                  label="Phone Number"
                  placeholder="e.g., 09123456789"
                  {...register("phone")}
                  error={errors.phone?.message}
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  placeholder="e.g., sarah@toothandtruth.com"
                  {...register("email")}
                  error={errors.email?.message}
                  className="w-full"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <Textarea
                id="bio"
                label="Biography"
                placeholder="Brief description of the doctor's experience and specialties..."
                {...register("bio")}
                error={errors.bio?.message}
                className="w-full min-h-[100px]"
              />
            </div>

            {/* Branch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch * <span className="text-red-500">*</span>
              </label>
              {isLoadingBranches ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading branches...
                </div>
              ) : (
                <select
                  {...register("branchId")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
                >
                  <option value="">Select a branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.branchId && (
                <p className="mt-1 text-sm text-red-500">{errors.branchId.message}</p>
              )}
            </div>

            {/* Status Toggle */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                {...register("isActive")}
                className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <label htmlFor="isActive" className="font-medium text-gray-900 cursor-pointer">
                  Doctor Active
                </label>
                <p className="text-sm text-gray-500">
                  Inactive doctors won&apos;t be available for appointments
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-end gap-4">
            <a
              href="/admin/doctors"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </a>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingBranches}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserRound className="w-4 h-4" />
                  Create Doctor
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
