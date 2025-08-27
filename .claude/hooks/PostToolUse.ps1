# last updated on: 2025-08-27 13:18:41
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
#   JavaScript/TypeScript (.js, .ts, .jsx, .tsx) -> // comment
#   C/C++/Java/C#/Go/Rust (.c, .cpp, .java, .cs, .go, .rs) -> // comment  
#   Python/Shell/PowerShell (.py, .sh, .ps1) -> # comment
#   Batch files (.bat, .cmd) -> REM comment
#   SQL files (.sql) -> -- comment
#   Ruby/R/Perl (.rb, .r, .pl) -> # comment
#   Default fallback -> # comment
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
        
        # Check if file exists and is not empty
        if (Test-Path $filePath -PathType Leaf) {
            # Read current file content
            $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
            
            if ($content) {
                # Get current timestamp
                $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                
                # Remove existing "last updated" line if present
                $lines = $content -split "`r?`n"
                if ($lines[0] -match "^(//|#).*last updated on:.*") {
                    $lines = $lines[1..$($lines.Length - 1)]
                    $content = $lines -join "`n"
                }
                
                # Determine comment syntax based on file extension
                $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
                $commentPrefix = switch ($extension) {
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
                    ".py" { "# " }
                    ".sh" { "# " }
                    ".ps1" { "# " }
                    ".rb" { "# " }
                    ".r" { "# " }
                    ".pl" { "# " }
                    ".bat" { "REM " }
                    ".cmd" { "REM " }
                    ".sql" { "-- " }
                    default { "# " }
                }
                
                # Prepend new timestamp line
                $timestampLine = "${commentPrefix}last updated on: $timestamp"
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