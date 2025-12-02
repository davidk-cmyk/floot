import { z } from "zod";
import superjson from "superjson";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_MIME_TYPES = [
  "application/msword", // .doc (will show helpful error)
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/pdf", // .pdf (will show helpful error)
];

export const schema = z.object({
  document: z
    .instanceof(File, { message: "Document upload is required." })
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `Max file size is 20MB.`
    )
    .refine(
      (file) => ACCEPTED_MIME_TYPES.includes(file.type),
      "Accepted formats: .docx and .pdf files"
    ),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  title: string | null;
  content: string; // HTML content
  createdAt: Date | null;
};

export const postParseDocument = async (
  formData: FormData,
  init?: RequestInit
): Promise<OutputType> => {
  // Note: We don't stringify FormData, the browser handles the multipart/form-data encoding.
  // We also don't set Content-Type, the browser does it with the correct boundary.
  const result = await fetch(`/_api/policies/parse-document`, {
    method: "POST",
    body: formData,
    ...init,
  });

  const responseText = await result.text();
  const responseObject = superjson.parse(responseText) as unknown;

  if (!result.ok) {
    const errorMessage = 
      (responseObject && typeof responseObject === 'object' && 'error' in responseObject && typeof responseObject.error === 'string')
        ? responseObject.error
        : "An unknown error occurred";
    throw new Error(errorMessage);
  }

  return responseObject as OutputType;
};