import { useQuery } from "@tanstack/react-query";
import { getGetLayoutTemplates } from "../endpoints/layout-templates/list_GET.schema";

export const LAYOUT_TEMPLATES_QUERY_KEY = ["layoutTemplates"] as const;

export const useLayoutTemplates = () => {
  return useQuery({
    queryKey: LAYOUT_TEMPLATES_QUERY_KEY,
    queryFn: () => getGetLayoutTemplates(),
  });
};