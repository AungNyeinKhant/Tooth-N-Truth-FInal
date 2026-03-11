"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi, UpdateUserData, User, UserRole } from "@/lib/api/users.api";
import { useUIStore } from "@/stores";
import { Button, Input } from "@/components/ui";
import { Users, ArrowLeft, Loader2, KeyRound, ShieldAlert } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";
import { ResetPasswordModal } from "@/app/(admin)/admin/users/components/reset-password-modal";

const userSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  BRANCH_MANAGER: "Branch Manager",
  PATIENT: "Patient",
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { addToast } = useUIStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      isActive: true,
    },
  });

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await usersApi.getById(userId);

        // Handle both wrapped and direct response formats
        const responseData = response.data as any;
        const userData = responseData?.data || responseData;
        const fetchedUser = userData as User;

        if (!fetchedUser || !fetchedUser.id) {
          throw new Error("Invalid user data");
        }

        setUser(fetchedUser);
        setSelectedRole(fetchedUser.role);

        // Pre-fill form with existing data
        reset({
          firstName: fetchedUser.firstName,
          lastName: fetchedUser.lastName,
          email: fetchedUser.email,
          phone: fetchedUser.phone || "",
          isActive: fetchedUser.isActive,
        });
      } catch (error) {
        console.error("Failed to fetch user:", error);
        addToast("Failed to load user data", "error");
        router.push("/admin/users");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, reset, addToast, router]);

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      const updateData: UpdateUserData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email !== user?.email ? data.email : undefined,
        phone: data.phone || undefined,
        isActive: data.isActive,
      };

      await usersApi.update(userId, updateData);
      addToast("User updated successfully!", "success");
      router.push("/admin/users");
    } catch (error) {
      console.error("Failed to update user:", error);
      addToast(getErrorMessage(error), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!user) return;

    if (newRole === user.role) return;

    if (
      !confirm(
        `Are you sure you want to change ${user.firstName}'s role from "${roleLabels[user.role]}" to "${roleLabels[newRole]}"?`
      )
    ) {
      setSelectedRole(user.role);
      return;
    }

    try {
      await usersApi.changeRole(userId, newRole);
      setUser({ ...user, role: newRole });
      setSelectedRole(newRole);
      addToast("User role changed successfully!", "success");
    } catch (error: any) {
      setSelectedRole(user.role);
      const errorMessage = error.response?.data?.message || getErrorMessage(error);
      addToast(errorMessage, "error");
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;

    if (
      !confirm(
        `Are you sure you want to reset the password for ${user.firstName} ${user.lastName}?`
      )
    ) {
      return;
    }

    try {
      const response = await usersApi.resetPassword(userId);
      const responseData = response.data as any;
      const data = responseData?.data || responseData;

      setTempPassword(data.tempPassword);
      setIsResetModalOpen(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || getErrorMessage(error);
      addToast(errorMessage, "error");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#00BCD4]" />
          <span className="ml-3 text-gray-600">Loading user data...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <a
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </a>
        <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
        <p className="text-sm text-gray-500">
          Update user information
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* User Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            User Information
          </h2>

          <div className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  id="firstName"
                  type="text"
                  label="First Name *"
                  placeholder="e.g., John"
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
                  placeholder="e.g., Doe"
                  {...register("lastName")}
                  error={errors.lastName?.message}
                  className="w-full"
                />
              </div>
            </div>

            {/* Email (Editable by admin) */}
            <div>
              <Input
                id="email"
                type="email"
                label="Email *"
                placeholder="e.g., user@example.com"
                {...register("email")}
                error={errors.email?.message}
                className="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                Changing this updates the user&apos;s login email
              </p>
            </div>

            {/* Phone */}
            <div>
              <Input
                id="phone"
                type="text"
                label="Phone Number"
                placeholder="e.g., +959123456789"
                {...register("phone")}
                error={errors.phone?.message}
                className="w-full"
              />
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
                  User Active
                </label>
                <p className="text-sm text-gray-500">
                  Inactive users cannot log in
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Role Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-600" />
            Role & Permissions
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
              >
                <option value="ADMIN">Admin</option>
                <option value="BRANCH_MANAGER">Branch Manager</option>
                <option value="PATIENT">Patient</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Changing role will affect user permissions immediately
              </p>
            </div>

            {/* Branch info for managers */}
            {user.role === "BRANCH_MANAGER" && user.branch && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Assigned Branch:</strong> {user.branch.name}
                </p>
                {user.branch.address && (
                  <p className="text-sm text-blue-600 mt-1">{user.branch.address}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Password Reset Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-teal-600" />
            Password
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Reset the user&apos;s password to a temporary value
              </p>
              <p className="text-xs text-gray-500 mt-1">
                The user will need to change it after logging in
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetPassword}
              className="flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Reset Password
            </Button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-end gap-4">
            <a
              href="/admin/users"
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
                  Saving...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        tempPassword={tempPassword}
        userName={`${user.firstName} ${user.lastName}`}
      />
    </div>
  );
}
