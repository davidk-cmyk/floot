import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocumentLayout, type InputType, type OutputType } from '../endpoints/document-layout_GET.schema';
import { postUpdateDocumentLayout, type InputType as UpdateInputType, type OutputType as UpdateOutputType } from '../endpoints/document-layout_POST.schema';
import { toast } from 'sonner';

export const useDocumentLayout = (portalId?: number) => {
  return useQuery<OutputType>({
    queryKey: ['document-layout', portalId],
    queryFn: async () => {
      const result = await getDocumentLayout({ portalId });
      console.log('[useDocumentLayout] Fetched data type:', typeof result, 'Value:', result);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
};

export const useUpdateDocumentLayout = () => {
  const queryClient = useQueryClient();
  
  return useMutation<UpdateOutputType, Error, UpdateInputType>({
    mutationFn: (data) => postUpdateDocumentLayout(data),
    onSuccess: (data) => {
      // Set the actual data returned from the server
      const queryKey = ['document-layout', data.portalId];
      queryClient.setQueryData<UpdateOutputType>(queryKey, data);
      
      console.log('Document layout settings saved');
    },
    onError: (error) => {
      console.error('Error updating document layout settings:', error);
      toast.error(error.message || 'Failed to update document layout settings');
    },
  });
};