import { schema } from "./download-file_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { downloadGoogleDriveFileForUser } from "../../helpers/googleDriveClient";
import { parsePdfDocument } from "../../helpers/parsePdfDocument";
import superjson from "superjson";
import mammoth from "mammoth";

const MAMMOTH_STYLE_MAP = [
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Subtitle'] => h2:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh", 
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Heading 5'] => h5:fresh",
  "p[style-name='Heading 6'] => h6:fresh",
  "p[style-name='Heading1'] => h1:fresh",
  "p[style-name='Heading2'] => h2:fresh",
  "p[style-name='Heading3'] => h3:fresh",
  "b => strong",
  "i => em",
  "u => u",
  "strike => s",
];

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    if (!user) {
      return new Response(
        superjson.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const json = superjson.parse(await request.text());
    const { fileId } = schema.parse(json);
    
    const file = await downloadGoogleDriveFileForUser(user.id, fileId);
    
    let content = "";
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith(".pdf") || file.mimeType === "application/pdf") {
      const rawText = await parsePdfDocument(file.data);
      const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      content = lines.map(line => `<p>${line}</p>`).join('\n');
    } else if (
      fileName.endsWith(".docx") || 
      file.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.convertToHtml({ 
        buffer: file.data 
      }, {
        styleMap: MAMMOTH_STYLE_MAP,
        includeDefaultStyleMap: true
      });
      content = result.value;
    } else if (
      fileName.endsWith(".doc") || 
      file.mimeType === "application/msword"
    ) {
      return new Response(
        superjson.stringify({ error: "Legacy .doc files are not supported. Please save as .docx format." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        superjson.stringify({ error: "Unsupported file type. Please upload a .docx or .pdf file." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const titleMatch = file.name.match(/^(.+)\.(docx?|pdf)$/i);
    const title = titleMatch ? titleMatch[1] : file.name;
    
    return new Response(
      superjson.stringify({ 
        title,
        content,
        fileName: file.name,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error downloading Google Drive file:", error);
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Failed to download file" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
