import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGetPortalLayoutOverrides,
  InputType as GetInputType,
  OutputType as GetOutputType,
} from "../endpoints/portal-layout/overrides_GET.schema";
import {
  postUpdatePortalLayoutOverrides,
  InputType as PostInputType,
  OutputType as PostOutputType,
} from "../endpoints/portal-layout/overrides_POST.schema";
import { toast } from "sonner";

export const PORTAL_LAYOUT_OVERRIDES_QUERY_KEY = (
  portalId: number
) => ["portalLayoutOverrides", portalId] as const;

export const usePortalLayoutOverrides = (portalId: number) => {
  return useQuery<GetOutputType, Error>({
    queryKey: PORTAL_LAYOUT_OVERRIDES_QUERY_KEY(portalId),
    queryFn: () => getGetPortalLayoutOverrides({ portalId }),
    enabled: !!portalId,
  });
};

export const useUpdatePortalLayoutOverrides = () => {
  const queryClient = useQueryClient();

  return useMutation<PostOutputType, Error, PostInputType>({
    mutationFn: postUpdatePortalLayoutOverrides,
    onSuccess: (data) => {
      toast.success("Portal layout overrides updated successfully.");
      queryClient.setQueryData(
        PORTAL_LAYOUT_OVERRIDES_QUERY_KEY(data.overrides.portalId!),
        data.overrides
      );
    },
    onError: (error) => {
      toast.error(
        `Failed to update overrides: ${error.message || "An unknown error occurred."}`
      );
    },
  });
};