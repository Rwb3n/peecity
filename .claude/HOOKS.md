# last updated on: 2025-08-27 13:22:22
# Claude Code Hooks System - Complete Guide

## Overview

Claude Code hooks allow you to automatically execute commands when specific events occur. This guide documents the complete hook system implementation for this project.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE HOOKS WORKFLOW                      │
└─────────────────────────────────────────────────────────────────────┘

User Action          Hook Event          Hook Execution        Result
     │                    │                     │                 │
     ▼                    ▼                     ▼                 ▼
┌──────────┐         ┌──────────┐         ┌──────────┐       ┌─────────┐
│ Claude   │  ────▶ │ Session  │  ────▶  │ Run      │ ────▶│ Context │
│ Code     │         │ Start    │         │ get_date │       │ Added   │
│ Starts   │         │          │         │ .ps1     │       │         │
└──────────┘         └──────────┘         └──────────┘       └─────────┘

┌──────────┐         ┌──────────┐         ┌──────────┐       ┌─────────┐
│ File     │  ────▶ │ PostTool │  ────▶  │ Run      │ ────▶│ Auto    │
│ Edited   │         │ Use      │         │ PostTool │       │ Timestamp│
│ (Edit/   │         │ Event    │         │ Use.ps1  │       │ Added   │
│ Write)   │         │          │         │          │       │         │
└──────────┘         └──────────┘         └──────────┘       └─────────┘
```

---

## Hook Types Implemented

### 1. SessionStart Hook

**Purpose**: Adds context information when Claude Code session begins  
**File**: `.claude/hooks/get_date.ps1`

```
┌─────────────────────────────────────────┐
│           SESSION START HOOK            │
├─────────────────────────────────────────┤
│ Trigger:  Session initialization        │
│ Input:    None                          │ 
│ Output:   Context string to Claude      │
│ Example:  "GOOD AFTERNOON: Today's     │
│          date is Wednesday, Aug 27..."  │
└─────────────────────────────────────────┘
```

### 2. PostToolUse Hook  

**Purpose**: Automatically timestamps edited files  
**File**: `.claude/hooks/PostToolUse.ps1`

```
┌─────────────────────────────────────────┐
│          POST TOOL USE HOOK             │
├─────────────────────────────────────────┤
│ Trigger:  Edit, MultiEdit, Write tools  │
│ Input:    JSON with file path & changes │
│ Output:   Timestamp added to file       │
│ Example:  "# last updated on: 2025..." │
└─────────────────────────────────────────┘
```

---

## Configuration Structure

**Location**: `.claude/settings.local.json`

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "powershell.exe -ExecutionPolicy Bypass -Command \"& '%CLAUDE_PROJECT_DIR%\\.claude\\hooks\\get_date.ps1'\""
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "powershell.exe -ExecutionPolicy Bypass -File .claude/hooks/PostToolUse.ps1"
          }
        ]
      }
    ]
  },
  "permissions": {
    // ... other permissions
  }
}
```

---

## PostToolUse Hook Data Flow

```
Claude Code Tool Execution
            │
            ▼
   ┌─────────────────┐
   │ Edit/MultiEdit/ │
   │ Write Tool Used │
   └─────────┬───────┘
             │
             ▼
    ┌─────────────────┐    JSON Input Structure:
    │ PostToolUse     │    {
    │ Hook Triggered  │      "session_id": "...",
    └─────────┬───────┘      "tool_name": "Edit",
              │              "tool_input": {
              ▼                "file_path": "...",
   ┌─────────────────┐         "old_string": "...",
   │ PowerShell      │         "new_string": "..."
   │ Script Receives │       },
   │ JSON via stdin  │       "tool_response": {
   └─────────┬───────┘         "filePath": "...",
             │                 "oldString": "...",
             ▼                 "newString": "..."
   ┌─────────────────┐       }
   │ Parse File      │     }
   │ Extension &     │
   │ Determine       │
   │ Comment Format  │
   └─────────┬───────┘
             │
             ▼
   ┌─────────────────┐    Comment Formats:
   │ Add Timestamp   │    .js  → // last updated on: [time]
   │ with Proper     │    .py  → # last updated on: [time]  
   │ Comment Syntax  │    .ps1 → # last updated on: [time]
   └─────────┬───────┘    .bat → REM last updated on: [time]
             │            .sql → -- last updated on: [time]
             ▼            ... (20+ formats supported)
   ┌─────────────────┐
   │ File Updated    │
   │ with Timestamp  │
   └─────────────────┘
```

---

## File Extension Support Matrix

```
┌──────────────────┬─────────────────┬─────────────────────┐
│   File Type      │   Extension     │   Comment Format    │
├──────────────────┼─────────────────┼─────────────────────┤
│ JavaScript       │ .js, .jsx       │ // last updated...  │
│ TypeScript       │ .ts, .tsx       │ // last updated...  │
│ C/C++/Java       │ .c, .cpp, .java │ // last updated...  │
│ C#/Go/Rust       │ .cs, .go, .rs   │ // last updated...  │
│ Python           │ .py             │ # last updated...   │
│ PowerShell       │ .ps1            │ # last updated...   │
│ Shell Script     │ .sh             │ # last updated...   │
│ Ruby/R/Perl      │ .rb, .r, .pl    │ # last updated...   │
│ Batch Files      │ .bat, .cmd      │ REM last updated... │
│ SQL              │ .sql            │ -- last updated...  │
│ Default/Unknown  │ *               │ # last updated...   │
└──────────────────┴─────────────────┴─────────────────────┘
```

---

## Hook Execution Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                     HOOK EXECUTION PHASES                           │
└─────────────────────────────────────────────────────────────────────┘

Phase 1: Event Detection
   ┌─────────────────┐
   │ Claude Code     │ ──┐
   │ monitors for    │   │  Events: SessionStart, PostToolUse,
   │ hook events     │ ◄─┘  PreToolUse, etc.
   └─────────────────┘

Phase 2: Matcher Evaluation  
   ┌─────────────────┐
   │ Check if event  │ ──┐ 
   │ matches hook    │   │  Matchers: "*", "Edit|Write", 
   │ matcher pattern │ ◄─┘  "tools:BashTool", etc.
   └─────────────────┘

Phase 3: Command Execution
   ┌─────────────────┐
   │ Execute hook    │ ──┐
   │ command with    │   │  Methods: PowerShell, Bash, 
   │ appropriate     │ ◄─┘  Node.js, Python, etc.
   │ context/input   │
   └─────────────────┘

Phase 4: Output Processing
   ┌─────────────────┐
   │ Process hook    │ ──┐
   │ output (context │   │  Outputs: Context strings,
   │ for SessionStart│ ◄─┘  file modifications, logs
   │ file edits for  │
   │ PostToolUse)    │
   └─────────────────┘
```

---

## Debugging Guide

### Common Issues & Solutions

1. **Hook Not Executing**
   ```
   Check: settings.local.json syntax (/doctor command)
   Check: File paths are correct
   Check: PowerShell execution policy
   ```

2. **Permission Errors** 
   ```
   Solution: Use -ExecutionPolicy Bypass flag
   Example: "powershell.exe -ExecutionPolicy Bypass -File script.ps1"
   ```

3. **JSON Parsing Errors**
   ```
   Debug: Add logging to see JSON input
   "JSON Input: $jsonInput" | Out-File -FilePath "debug.log" -Append
   ```

### Debug Pattern

```powershell
# Add to start of PowerShell hook for debugging:
"Hook started: $(Get-Date)" | Out-File -FilePath "hook-debug.log" -Append
"Input: $input" | Out-File -FilePath "hook-debug.log" -Append

# Add throughout script:
"Checkpoint: Description" | Out-File -FilePath "hook-debug.log" -Append
```

---

## Hook Development Best Practices

### 1. Error Handling
```powershell
try {
    # Hook logic here
} catch {
    # Silent fail - don't break Claude Code workflow
    exit 0  
}
```

### 2. Input Validation
```powershell
if (-not $hookData.tool_name) {
    exit 0  # Exit gracefully if required data missing
}
```

### 3. File Safety
```powershell
if (Test-Path $filePath -PathType Leaf) {
    # Only modify files that exist
}
```

### 4. Performance
- Keep hooks fast (< 1 second execution time)
- Avoid network calls or heavy processing
- Use -ErrorAction SilentlyContinue for non-critical operations

---

## Advanced Hook Patterns

### Conditional Execution
```json
{
  "matcher": "tools:Edit",
  "conditions": {
    "file_extension": [".js", ".ts"],
    "file_size_max": 1000000
  }
}
```

### Multi-Step Hooks
```json
{
  "hooks": [
    {"type": "command", "command": "step1.ps1"},
    {"type": "command", "command": "step2.ps1"},  
    {"type": "command", "command": "step3.ps1"}
  ]
}
```

### Background Execution
```json
{
  "type": "command",
  "command": "powershell.exe -Command Start-Process -NoNewWindow script.ps1",
  "background": true
}
```

---

## File Structure Summary

```
.claude/
├── settings.local.json     # Hook configuration
├── hooks/
│   ├── get_date.ps1       # SessionStart hook
│   ├── PostToolUse.ps1    # PostToolUse hook (production)
│   └── PostToolUse.bat    # PostToolUse hook (reference example)
└── HOOKS.md               # This documentation
```

---

## Future Enhancement Ideas

- **PreToolUse hooks**: Validate before file changes
- **File type specific hooks**: Different behavior per language
- **Project-specific hooks**: Hooks that only run for certain projects  
- **Notification hooks**: Send alerts on specific events
- **Integration hooks**: Connect with external tools (Git, CI/CD)
- **Conditional logic**: More sophisticated matchers and conditions

---

*Generated by Claude Code Hook System v1.0*  
*Last Updated: August 27, 2025*