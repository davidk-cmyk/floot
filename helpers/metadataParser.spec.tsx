import { parseMetadata } from "./metadataParser";

describe("metadataParser", () => {
  it("should return empty array for null or undefined input", () => {
    expect(parseMetadata(null)).toEqual([]);
    expect(parseMetadata(undefined)).toEqual([]);
    expect(parseMetadata("")).toEqual([]);
  });

  it("should parse colon-separated format correctly", () => {
    const input = "Title: My Policy\nVersion: 1.2\nDepartment: Engineering";
    const result = parseMetadata(input);
    
    expect(result).toEqual([
      { field: "Title", value: "My Policy" },
      { field: "Version", value: "1.2" },
      { field: "Department", value: "Engineering" }
    ]);
  });

  it("should parse pipe-separated format with intelligent field extraction", () => {
    const input = "Version 1.2 | Effective 2024-01-01 | Department Engineering";
    const result = parseMetadata(input);
    
    expect(result).toEqual([
      { field: "Version", value: "1.2" },
      { field: "Effective Date", value: "2024-01-01" },
      { field: "Department", value: "Engineering" }
    ]);
  });

  it("should handle mixed colon and pipe formats", () => {
    const input = "Title: My Policy\nVersion 1.2 | Effective 2024-01-01\nCategory: Security";
    const result = parseMetadata(input);
    
    expect(result).toEqual([
      { field: "Title", value: "My Policy" },
      { field: "Version", value: "1.2" },
      { field: "Effective Date", value: "2024-01-01" },
      { field: "Category", value: "Security" }
    ]);
  });

  it("should handle various date patterns", () => {
    const input = "Created 2024-01-01 | Updated 2024-02-01 | Expires 2024-12-31";
    const result = parseMetadata(input);
    
    expect(result).toEqual([
      { field: "Created Date", value: "2024-01-01" },
      { field: "Updated Date", value: "2024-02-01" },
      { field: "Expiration Date", value: "2024-12-31" }
    ]);
  });

  it("should handle version patterns", () => {
    const input = "Version 1.2.3 | Build 4.5";
    const result = parseMetadata(input);
    
    expect(result).toEqual([
      { field: "Version", value: "1.2.3" },
      { field: "Build", value: "4.5" }
    ]);
  });

  it("should handle status and category patterns", () => {
    const input = "Status Active | Category Security | Department IT";
    const result = parseMetadata(input);
    
    expect(result).toEqual([
      { field: "Status", value: "Active" },
      { field: "Category", value: "Security" },
      { field: "Department", value: "IT" }
    ]);
  });

  it("should gracefully handle edge cases", () => {
    const input = "Title:\nVersion 1.2 |\n: Empty Field\n   \nSingle Value";
    const result = parseMetadata(input);
    
    expect(result).toEqual([
      { field: "Version", value: "1.2" },
      { field: "", value: ": Empty Field" },
      { field: "Single", value: "Value" }
    ]);
  });

  it("should handle generic patterns with proper capitalization", () => {
    const input = "author John Doe | priority High | owner Jane Smith";
    const result = parseMetadata(input);
    
    expect(result).toEqual([
      { field: "Author", value: "John Doe" },
      { field: "Priority", value: "High" },
      { field: "Owner", value: "Jane Smith" }
    ]);
  });

  it("should skip very short words in generic pattern matching", () => {
    const input = "A B | of something | in progress";
    const result = parseMetadata(input);
    
    expect(result).toEqual([
      { field: "", value: "A B" },
      { field: "", value: "of something" },
      { field: "", value: "in progress" }
    ]);
  });

  it("should handle case-insensitive pattern matching", () => {
    const input = "VERSION 2.0 | EFFECTIVE 2024-01-01 | STATUS active";
    const result = parseMetadata(input);
    
    expect(result).toEqual([
      { field: "Version", value: "2.0" },
      { field: "Effective Date", value: "2024-01-01" },
      { field: "Status", value: "active" }
    ]);
  });

  it("should normalize escaped newlines to actual newlines", () => {
    const input = "Title: Policy Name\\nVersion: 1.0\\nDepartment: IT";
    const result = parseMetadata(input);
    
    expect(result).toEqual([
      { field: "Title", value: "Policy Name" },
      { field: "Version", value: "1.0" },
      { field: "Department", value: "IT" }
    ]);
  });

  it("should handle mixed escaped and actual newlines", () => {
    const input = "Title: Policy Name\\nVersion: 1.0\nDepartment: IT\\nCategory: Security";
    const result = parseMetadata(input);
    
    expect(result).toEqual([
      { field: "Title", value: "Policy Name" },
      { field: "Version", value: "1.0" },
      { field: "Department", value: "IT" },
      { field: "Category", value: "Security" }
    ]);
  });
});