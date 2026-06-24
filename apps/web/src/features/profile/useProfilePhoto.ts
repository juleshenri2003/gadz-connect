import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/AuthProvider";
import { imageFileToBase64 } from "@/features/profile/ProfilePhotoUpload";
import { apiFetch } from "@/lib/api";

export function useUploadProfilePhoto() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      if (!file.type.startsWith("image/")) {
        throw new Error("Format accepté : JPEG, PNG ou WebP");
      }
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Image trop volumineuse — maximum 2 Mo");
      }
      const photoBase64 = await imageFileToBase64(file);
      const res = await apiFetch<{ data: { avatar_url: string | null } }>(
        "/api/profile/avatar",
        {
          method: "POST",
          token,
          body: JSON.stringify({ photoBase64 }),
        },
      );
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      void queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
      void queryClient.invalidateQueries({ queryKey: ["tutors"] });
      void queryClient.invalidateQueries({ queryKey: ["public-tutors"] });
    },
  });
}

export function useDeleteProfilePhoto() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = getAccessToken();
      if (!token) throw new Error("Non authentifié");
      await apiFetch("/api/profile/avatar", { method: "DELETE", token });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      void queryClient.invalidateQueries({ queryKey: ["tutor-me"] });
      void queryClient.invalidateQueries({ queryKey: ["tutors"] });
      void queryClient.invalidateQueries({ queryKey: ["public-tutors"] });
    },
  });
}
