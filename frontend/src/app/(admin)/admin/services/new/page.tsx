"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { servicesApi, CreateServiceData } from "@/lib/api/services.api";
import { useUIStore } from "@/stores";
import { Button, Input, Textarea } from "@/components/ui";
import { Stethoscope, ArrowLeft, Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

const serviceSchema = z.object({
  name: z
    .string()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  duration: z
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration must be less than 480 minutes"),
  price: z
    .number()
    .min(0, "Price must be at least 0"),
  isActive: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function CreateServicePage() {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: 30,
      price: 0,
      isActive: true,
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    try {
      const serviceData: CreateServiceData = {
        name: data.name,
        description: data.description,
        duration: data.duration,
        price: data.price,
        isActive: data.isActive,
      };

      await servicesApi.create(serviceData);
      addToast("Service created successfully!", "success");
      router.push("/admin/services");
    } catch (error) {
      console.error("Failed to create service:", error);
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
          href="/admin/services"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </a>
        <h1 className="text-2xl font-bold text-gray-900">Create New Service</h1>
        <p className="text-sm text-gray-500">
          Add a new dental service to the system
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Service Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            Service Information
          </h2>

          <div className="space-y-5">
            {/* Service Name */}
            <div>
              <Input
                id="name"
                type="text"
                label="Service Name *"
                placeholder="e.g., Teeth Cleaning"
                {...register("name")}
                error={errors.name?.message}
                className="w-full"
              />
            </div>

            {/* Description */}
            <div>
              <Textarea
                id="description"
                label="Description"
                placeholder="Describe the service..."
                {...register("description")}
                error={errors.description?.message}
                className="w-full min-h-[100px]"
              />
            </div>

            {/* Duration & Price Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  id="duration"
                  type="number"
                  label="Duration (minutes) *"
                  placeholder="e.g., 30"
                  min={15}
                  {...register("duration", { valueAsNumber: true })}
                  error={errors.duration?.message}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">Minimum 15 minutes</p>
              </div>
              <div>
                <Input
                  id="price"
                  type="number"
                  label="Price (MMK) *"
                  placeholder="e.g., 25000"
                  min={0}
                  {...register("price", { valueAsNumber: true })}
                  error={errors.price?.message}
                  className="w-full"
                />
              </div>
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
                  Service Active
                </label>
                <p className="text-sm text-gray-500">
                  Inactive services won&apos;t be available for booking
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-end gap-4">
            <a
              href="/admin/services"
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
                  <Stethoscope className="w-4 h-4" />
                  Create Service
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
