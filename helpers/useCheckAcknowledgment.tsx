import { useMutation } from "@tanstack/react-query";
import {
  postCheckAcknowledgment,
  type InputType,
} from "../endpoints/portal/check-acknowledgment_POST.schema";

export const useCheckAcknowledgment = () => {
  return useMutation({
    mutationFn: async (input: InputType) => {
      return await postCheckAcknowledgment(input);
    },
  });
};