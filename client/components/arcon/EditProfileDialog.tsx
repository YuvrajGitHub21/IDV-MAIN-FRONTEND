import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstName: string;
  lastName: string;
  email: string;
  onSave: (data: { firstName: string; lastName: string }) => Promise<void>;
}

export const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onOpenChange,
  firstName,
  lastName,
  email,
  onSave,
}) => {
  const [form, setForm] = useState({ firstName, lastName });
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  React.useEffect(() => {
    setForm({ firstName, lastName });
  }, [firstName, lastName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!form.firstName.trim()) nextErrors.firstName = "First name is required";
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setSubmitError("");
    try {
      await onSave({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        typeof err === "string"
          ? err
          : err?.message || "Failed to save profile";
      setSubmitError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-roboto">Edit profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-arcon-gray-primary text-sm font-medium mb-2 font-roboto">
              Email
            </label>
            <Input
              value={email}
              readOnly
              disabled
              className="h-12 rounded-control border-arcon-gray-border"
            />
          </div>
          <div>
            <label className="block text-arcon-gray-primary text-sm font-medium mb-2 font-roboto">
              First Name
            </label>
            <Input
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({ ...f, firstName: e.target.value }))
              }
              placeholder="Enter your first name"
              className="h-12 rounded-control border-arcon-gray-border"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600 font-roboto">
                {errors.firstName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-arcon-gray-primary text-sm font-medium mb-2 font-roboto">
              Last Name
            </label>
            <Input
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastName: e.target.value }))
              }
              placeholder="Enter your last name"
              className="h-12 rounded-control border-arcon-gray-border"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600 font-roboto">
                {errors.lastName}
              </p>
            )}
          </div>
          {submitError && (
            <p className="text-sm text-red-600 font-roboto">{submitError}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="rounded-control"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-control bg-arcon-blue text-white hover:bg-arcon-blue-hover"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
