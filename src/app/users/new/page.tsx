'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserCreateModal from "@/components/user-management/UserCreateModal";
import { PermissionGuard, Permission } from "@/components/permissions/PermissionGuard";

export default function CreateUserPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    router.push("/users");
  };

  const handleUserCreated = () => {
    router.push("/users");
  };

  return (
    <PermissionGuard permissions={[Permission.CREATE_USER]} showError>
      <div className="min-h-[60vh]">
        <UserCreateModal
          isOpen={isOpen}
          onClose={handleClose}
          onUserCreated={handleUserCreated}
        />
      </div>
    </PermissionGuard>
  );
}
