import { schema, OutputType } from "./parse-document_POST.schema";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";
import mammoth from "mammoth";
import { UserRole } from "../../helpers/schema";
import { parsePdfDocument } from "../../helpers/parsePdfDocument";

const ALLOWED_ROLES: UserRole[] = ["admin", "editor"];

// Style map to convert Word styles to semantic HTML
const MAMMOTH_STYLE_MAP = [
  // Title and heading styles (comprehensive mapping)
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Subtitle'] => h2:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh", 
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Heading 5'] => h5:fresh",
  "p[style-name='Heading 6'] => h6:fresh",
  
  // Alternative heading style names that Word might use
  "p[style-name='Heading1'] => h1:fresh",
  "p[style-name='Heading2'] => h2:fresh",
  "p[style-name='Heading3'] => h3:fresh",
  "p[style-name='Heading4'] => h4:fresh",
  "p[style-name='Heading5'] => h5:fresh",
  "p[style-name='Heading6'] => h6:fresh",
  
  // Built-in Word styles
  "p[style-name='Title 1'] => h1:fresh",
  "p[style-name='Title 2'] => h2:fresh",
  "p[style-name='Document Title'] => h1:fresh",
  "p[style-name='Section Title'] => h2:fresh",
  "p[style-name='Chapter Title'] => h1:fresh",
  "p[style-name='Part Title'] => h1:fresh",
  
  // Character formatting
  "b => strong",
  "i => em",
  "u => u",
  "strike => s",
];

// Common heading patterns to detect
const HEADING_PATTERNS = [
  // Common section headings
  /^(introduction|overview|summary|conclusion|background|methodology|results|discussion|abstract|executive summary|table of contents)$/i,
  // Numbered sections
  /^\d+\.\s+/,
  /^\d+\)\s+/,
  /^(chapter|section|part|appendix)\s+\d+/i,
  // Roman numerals
  /^[ivxlcdm]+\.\s+/i,
  // Letter sections
  /^[a-z]\.\s+/i,
  /^[a-z]\)\s+/i,
];

// Post-process HTML to convert inline styles to semantic elements and detect headings
function postProcessHtml(html: string): string {
  console.log("Post-processing HTML to convert inline styles to semantic elements");
  
  let processedHtml = html;
  
  // Convert spans with font-weight: bold to <strong>
  processedHtml = processedHtml.replace(
    /<span[^>]*style="[^"]*font-weight:\s*bold[^"]*"[^>]*>(.*?)<\/span>/gi,
    '<strong>$1</strong>'
  );
  
  // Convert spans with font-style: italic to <em>
  processedHtml = processedHtml.replace(
    /<span[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>(.*?)<\/span>/gi,
    '<em>$1</em>'
  );
  
  // Convert spans with text-decoration: underline to <u>
  processedHtml = processedHtml.replace(
    /<span[^>]*style="[^"]*text-decoration:\s*underline[^"]*"[^>]*>(.*?)<\/span>/gi,
    '<u>$1</u>'
  );
  
  // Convert spans with text-decoration: line-through to <s>
  processedHtml = processedHtml.replace(
    /<span[^>]*style="[^"]*text-decoration:\s*line-through[^"]*"[^>]*>(.*?)<\/span>/gi,
    '<s>$1</s>'
  );
  
  // Remove empty styling spans that might interfere
  processedHtml = processedHtml.replace(
    /<span[^>]*style="[^"]*"[^>]*>(.*?)<\/span>/gi,
    '$1'
  );
  
  // Remove spans with only font-family, font-size, color styles that Lexical doesn't need
  processedHtml = processedHtml.replace(
    /<span[^>]*style="[^"]*(?:font-family|font-size|color)[^"]*"[^>]*>(.*?)<\/span>/gi,
    '$1'
  );
  
  // Detect and convert common heading patterns
  processedHtml = processedHtml.replace(
    /<p>(.*?)<\/p>/gi,
    (match, content) => {
      const trimmedContent = content.trim();
      
      // Skip empty paragraphs
      if (!trimmedContent) {
        return match;
      }
      
      // Check if content matches common heading patterns
      for (const pattern of HEADING_PATTERNS) {
        if (pattern.test(trimmedContent)) {
          // Determine heading level based on pattern
          let headingLevel = 2; // Default to h2
          
          if (/^(introduction|overview|summary|conclusion|background|methodology|results|discussion|abstract|executive summary)$/i.test(trimmedContent)) {
            headingLevel = 2;
          } else if (/^\d+\.\s+/.test(trimmedContent) || /^(chapter|part)\s+\d+/i.test(trimmedContent)) {
            headingLevel = 1;
          } else if (/^\d+\)\s+/.test(trimmedContent) || /^(section|appendix)\s+\d+/i.test(trimmedContent)) {
            headingLevel = 2;
          } else if (/^[a-z]\.\s+/i.test(trimmedContent) || /^[a-z]\)\s+/i.test(trimmedContent)) {
            headingLevel = 3;
          }
          
          console.log(`Converting paragraph to h${headingLevel}: "${trimmedContent}"`);
          return `<h${headingLevel}>${content}</h${headingLevel}>`;
        }
      }
      
      // Check if paragraph is short and might be a heading (under 100 characters, no punctuation at end)
      if (trimmedContent.length < 100 && 
          !trimmedContent.endsWith('.') && 
          !trimmedContent.endsWith('!') && 
          !trimmedContent.endsWith('?') &&
          !trimmedContent.includes('\n') &&
          trimmedContent.split(' ').length <= 8) {
        
        // Check if it's all caps or title case
        const isAllCaps = trimmedContent === trimmedContent.toUpperCase() && /[A-Z]/.test(trimmedContent);
        const isTitleCase = /^[A-Z][a-z]*(?:\s+[A-Z][a-z]*)*$/.test(trimmedContent);
        
        if (isAllCaps || isTitleCase) {
          console.log(`Converting short paragraph to h3 (formatting-based): "${trimmedContent}"`);
          return `<h3>${content}</h3>`;
        }
      }
      
      return match;
    }
  );
  
  console.log("HTML post-processing completed");
  return processedHtml;
}

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    if (!ALLOWED_ROLES.includes(user.role)) {
      return new Response(
        superjson.stringify({
          error: "Forbidden: You do not have permission to parse documents.",
        }),
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("document");

    const validationResult = schema.safeParse({ document: file });
    if (!validationResult.success) {
      return new Response(
        superjson.stringify({
          error: "Invalid input",
          details: validationResult.error.flatten(),
        }),
        { status: 400 }
      );
    }

    const documentFile = validationResult.data.document;
    const fileBuffer = Buffer.from(await documentFile.arrayBuffer());

    let title: string | null = documentFile.name.replace(/\.[^/.]+$/, "");
    let content: string = "";
    let createdAt: Date | null = new Date(documentFile.lastModified);

    console.log(
      `Parsing document: ${documentFile.name}, type: ${documentFile.type}, size: ${documentFile.size}`
    );

    try {
      if (
        documentFile.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        // Handle .docx files using mammoth with comprehensive style mapping
        console.log("Processing .docx file with mammoth and comprehensive style mapping");
        const result = await mammoth.convertToHtml({ 
          buffer: fileBuffer 
        }, {
          styleMap: MAMMOTH_STYLE_MAP,
          includeDefaultStyleMap: true
        });
        
        // Post-process to handle remaining inline styles and detect heading patterns
        content = postProcessHtml(result.value);
        
        if (result.messages && result.messages.length > 0) {
          console.warn("Mammoth conversion warnings:", result.messages);
        }
        
        console.log("Mammoth conversion completed with comprehensive style mapping and heading detection");
      } else if (documentFile.type === "application/pdf") {
        // Handle PDF files using parsePdfDocument helper
        console.log("Processing .pdf file with parsePdfDocument helper");
        const rawText = await parsePdfDocument(fileBuffer);
        
        // Convert text to HTML paragraphs (one paragraph per line, preserving line breaks)
        const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const htmlContent = lines.map(line => `<p>${line}</p>`).join('\n');
        
        // Apply the existing heading detection logic through postProcessHtml
        content = postProcessHtml(htmlContent);
        
        console.log("PDF conversion completed with heading detection");
      } else if (documentFile.type === "application/msword") {
        // Handle legacy .doc files
        return new Response(
          superjson.stringify({
            error: "Legacy .doc files are not supported. Please save the document as .docx format and try again.",
          }),
          { status: 400 }
        );
      } else {
        // Unsupported file type
        return new Response(
          superjson.stringify({ 
            error: `Unsupported file type: ${documentFile.type}. Only .docx files are supported.` 
          }),
          { status: 400 }
        );
      }
    } catch (parseError) {
      console.error("Error during document parsing:", parseError);
      const errorMessage = parseError instanceof Error ? parseError.message : "Unknown parsing error";
      return new Response(
        superjson.stringify({
          error: "Failed to parse document content.",
          details: errorMessage,
        }),
        { status: 500 }
      );
    }

    // Validate that we extracted some content
    if (!content || content.trim().length === 0) {
      return new Response(
        superjson.stringify({
          error: "No readable content found in the document.",
          details: "The document appears to be empty or the content could not be extracted. Please ensure the document contains readable text.",
        }),
        { status: 400 }
      );
    }

    // Clean up the content
    content = content
      .replace(/<p><\/p>/g, '') // Remove empty paragraphs
      .replace(/<p>\s*<\/p>/g, '') // Remove paragraphs with only whitespace
      .trim();

    const output: OutputType = {
      title,
      content,
      createdAt,
    };

    console.log(`Successfully parsed document: ${title}, content length: ${content.length}`);

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error parsing document:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({
        error: "Failed to parse document.",
        details: errorMessage,
      }),
      { status: 500 }
    );
  }
}