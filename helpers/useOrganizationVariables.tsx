import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGetOrganizationVariables,
  OutputType as ListOutputType,
} from "../endpoints/organization-variables/list_GET.schema";
import {
  postUpdateOrganizationVariables,
  InputType as UpdateInputType,
  OutputType as UpdateOutputType,
} from "../endpoints/organization-variables/update_POST.schema";
import { toast } from "sonner";

export const ORGANIZATION_VARIABLES_QUERY_KEY = [
  "organizationVariables",
] as const;

export const useOrganizationVariables = () => {
  return useQuery<ListOutputType, Error>({
    queryKey: ORGANIZATION_VARIABLES_QUERY_KEY,
    queryFn: () => getGetOrganizationVariables(),
  });
};

export const useUpdateOrganizationVariables = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateOutputType, Error, UpdateInputType>({
    mutationFn: postUpdateOrganizationVariables,
    onSuccess: (data) => {
      toast.success("Organization variables updated successfully.");
      queryClient.setQueryData(
        ORGANIZATION_VARIABLES_QUERY_KEY,
        (oldData: ListOutputType | undefined) => {
          if (!oldData) return data.variables;
          const updatedMap = new Map(
            data.variables.map((v) => [v.variableName, v])
          );
          const newData = oldData.map(
            (v) => updatedMap.get(v.variableName) || v
          );
          data.variables.forEach((v) => {
            if (!oldData.some((oldV) => oldV.variableName === v.variableName)) {
              newData.push(v);
            }
          });
          return newData;
        }
      );
    },
    onError: (error) => {
      toast.error(
        `Failed to update variables: ${error.message || "An unknown error occurred."}`
      );
    },
  });
};