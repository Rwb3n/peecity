# last updated on: 2025-08-27 23:42:43
# PostToolUse Hook - Auto-Timestamp for File Edits
#
# DESCRIPTION:
#   Automatically adds a "last updated" timestamp to the top of files when they are
#   modified using Claude Code's Edit, MultiEdit, or Write tools. Uses appropriate 
#   comment syntax for each file type to avoid breaking code.
#
# FEATURES:
#   - File-extension-specific comment formats (// for JS, # for Python, etc.)
#   - Removes old timestamps to prevent duplicates
#   - Supports 20+ file extensions with proper comment syntax
#   - Silent error handling to avoid breaking workflows
#
# CONFIGURATION:
#   Add to .claude/settings.local.json:
#   {
#     "hooks": {
#       "PostToolUse": [
#         {
#           "matcher": "Edit|MultiEdit|Write", 
#           "hooks": [
#             {
#               "type": "command",
#               "command": "powershell.exe -ExecutionPolicy Bypass -File .claude/hooks/PostToolUse.ps1"
#             }
#           ]
#         }
#       ]
#     }
#   }
#
# SUPPORTED FILE TYPES:
#   Programming Languages:
#     JavaScript/TypeScript (.js, .ts, .jsx, .tsx) -> // comment
#     C/C++/Java/C#/Go/Rust (.c, .cpp, .java, .cs, .go, .rs) -> // comment
#     PHP (.php), SCSS/LESS (.scss, .less) -> // comment
#     Python/Shell/PowerShell (.py, .sh, .ps1) -> # comment
#     Ruby/R/Perl (.rb, .r, .pl) -> # comment
#   
#   Data/Config Files:
#     YAML (.yaml, .yml) -> # comment
#     TOML (.toml), INI (.ini), Config (.conf, .cfg) -> # comment
#     Properties (.properties), Environment (.env) -> # comment
#   
#   Markup/Style Files:
#     XML/HTML/SVG (.xml, .html, .htm, .svg) -> <!-- comment -->
#     CSS (.css) -> /* comment */
#   
#   Database Files:
#     SQL/HQL (.sql, .hql) -> -- comment
#   
#   System Files:
#     Batch files (.bat, .cmd) -> REM comment
#     Git files (.gitignore) -> # comment
#   
#   Default fallback -> # comment
#
# EXCLUDED FILE TYPES (no timestamping to avoid syntax errors):
#   JSON files (.json, .jsonc) - Comments break JSON parsers
#   Package lock files (package-lock.json, yarn.lock, composer.lock, Pipfile.lock)
#   Minified files (.min.js, .min.css) - Should not be manually edited
#   Lock files (.lock) - Generated files that shouldn't be modified
#
# JSON INPUT FORMAT:
#   PostToolUse hooks receive JSON via stdin with structure:
#   {
#     "tool_name": "Edit|MultiEdit|Write",
#     "tool_input": { "file_path": "..." },
#     "tool_response": { "filePath": "..." }
#   }
#
# AUTHOR: Claude Code Hook System
# VERSION: 1.0 - Production Ready

# Read JSON input from stdin
$jsonInput = [Console]::In.ReadToEnd()

try {
    # Parse the JSON input
    $hookData = $jsonInput | ConvertFrom-Json
    
    # Only process file editing tools
    if (($hookData.tool_name -eq "Edit" -or $hookData.tool_name -eq "MultiEdit" -or $hookData.tool_name -eq "Write")) {
        # Get file path based on tool type
        if ($hookData.tool_name -eq "Write") {
            $filePath = $hookData.tool_input.file_path
        } else {
            $filePath = $hookData.tool_response.filePath
        }
        
        # Skip files where comments would break syntax
        $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
        $excludedExtensions = @(".json", ".jsonc", ".lock", ".min.js", ".min.css")
        $excludedFilenames = @("package.json", "package-lock.json", "yarn.lock", "composer.lock", "Pipfile.lock")
        $filename = [System.IO.Path]::GetFileName($filePath)
        
        if ($extension -in $excludedExtensions -or $filename -in $excludedFilenames) {
            # Skip files where adding comments would break syntax
            exit 0
        }
        
        # Check if file exists and is not empty
        if (Test-Path $filePath -PathType Leaf) {
            # Read current file content
            $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
            
            if ($content) {
                # Get current timestamp
                $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                
                # Remove existing "last updated" line if present
                $lines = $content -split "`r?`n"
                if ($lines[0] -match "^(//|#|REM|--|/\*|<!--).*last updated on:.*") {
                    $lines = $lines[1..$($lines.Length - 1)]
                    $content = $lines -join "`n"
                }
                
                # Determine comment syntax based on file extension
                $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
                $commentPrefix = switch ($extension) {
                    # Programming languages - C-style comments
                    ".js" { "// " }
                    ".ts" { "// " }
                    ".jsx" { "// " }
                    ".tsx" { "// " }
                    ".cs" { "// " }
                    ".java" { "// " }
                    ".cpp" { "// " }
                    ".c" { "// " }
                    ".go" { "// " }
                    ".rs" { "// " }
                    ".php" { "// " }
                    ".scss" { "// " }
                    ".less" { "// " }
                    
                    # Hash-style comments
                    ".py" { "# " }
                    ".sh" { "# " }
                    ".ps1" { "# " }
                    ".rb" { "# " }
                    ".r" { "# " }
                    ".pl" { "# " }
                    ".yaml" { "# " }
                    ".yml" { "# " }
                    ".toml" { "# " }
                    ".ini" { "# " }
                    ".conf" { "# " }
                    ".cfg" { "# " }
                    ".properties" { "# " }
                    ".gitignore" { "# " }
                    ".env" { "# " }
                    
                    # SQL-style comments  
                    ".sql" { "-- " }
                    ".hql" { "-- " }
                    
                    # Batch file comments
                    ".bat" { "REM " }
                    ".cmd" { "REM " }
                    
                    # Note: JSON files are excluded from timestamping to avoid syntax errors
                    ".xml" { "<!-- " }    # XML/HTML comments (will need special end tag)
                    ".html" { "<!-- " }
                    ".htm" { "<!-- " }
                    ".svg" { "<!-- " }
                    ".css" { "/* " }      # CSS comments (will need special end tag)
                    
                    # Default fallback
                    default { "# " }
                }
                
                # Create timestamp line with proper closing for block comments
                if ($extension -in @(".xml", ".html", ".htm", ".svg")) {
                    $timestampLine = "<!-- last updated on: $timestamp -->"
                } elseif ($extension -eq ".css") {
                    $timestampLine = "/* last updated on: $timestamp */"
                } else {
                    $timestampLine = "${commentPrefix}last updated on: $timestamp"
                }
                
                $updatedContent = "$timestampLine`n$content"
                
                # Write back to file
                Set-Content -Path $filePath -Value $updatedContent -NoNewline
                
                Write-Output "Added timestamp to: $filePath"
            }
        }
    }
} catch {
    # Silent fail - don't break the workflow
    exit 0
}

# Exit successfully
exit 0