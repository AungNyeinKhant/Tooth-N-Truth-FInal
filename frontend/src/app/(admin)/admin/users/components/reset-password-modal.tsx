"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import { KeyRound, Copy, Check } from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempPassword: string;
  userName: string;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  tempPassword,
  userName,
}: ResetPasswordModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Password Reset">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
          <KeyRound className="w-8 h-8 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Password Reset Successful</p>
            <p className="text-sm text-green-600">
              New temporary password for {userName}
            </p>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Temporary Password:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-4 py-2 rounded border font-mono text-lg">
              {tempPassword}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 bg-white border rounded hover:bg-gray-50 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> Please securely share this temporary password with{" "}
            {userName}. They will need to change it after logging in.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}
