# scripts/wrap-and-resume.ps1
#
# Session-limit wrap-and-resume automation. Runs when you hit Claude's
# session/account limit. Does three things back-to-back:
#
#   1. Memorialize  - write a handoff doc capturing the current git
#      state, recent commits, in-flight changes.
#   2. Commit WIP   - if there are uncommitted changes, stage and
#      commit them with a "wip(wrap): session-limit at <ts>" prefix so
#      the next session can keep going from a clean tree.
#   3. Schedule resume - delegate to schedule-resume.ps1 so a toast
#      fires N hours from now (default 3h) pointing at the new handoff.
#
# Detection modes
# ---------------
#   pwsh -File scripts/wrap-and-resume.ps1
#       Immediate one-shot. Run this when YOU see the limit message;
#       the script does the wrap + schedules the toast, then exits.
#
#   pwsh -File scripts/wrap-and-resume.ps1 -Watch
#       Background poller. Tails the latest Claude transcript JSONL
#       under ~/.claude/projects/<slug>/ for session-limit markers.
#       When a marker is matched, fires the wrap exactly once and
#       exits. Run this in a side terminal at the start of a long
#       Claude session so you don't have to babysit the REPL.
#
#   pwsh -File scripts/wrap-and-resume.ps1 -DryRun
#       Print what would happen without writing the handoff, making
#       a commit, or scheduling a task. Useful to verify before relying
#       on -Watch overnight.
#
# Flags
# -----
#   -DelayHours <N>     Hours from wrap-time to fire the resume toast.
#                       Default 3.0 (most Anthropic limits reset in 5h
#                       but a 3h check leaves room to grab fresh cache).
#
#   -NoCommit           Skip the WIP-commit step. Still writes the
#                       handoff. Use when uncommitted changes are
#                       deliberately not ready to ship (e.g. a partial
#                       refactor mid-script-run).
#
#   -HandoffTitle <s>   Override the auto-generated title. Default
#                       pulls the most recent commit subject.
#
#   -Cancel             Cancel any pending scheduled resume task.
#                       Delegates to schedule-resume.ps1 -Cancel.
#
# Notes
# -----
# - Detection in -Watch mode matches on case-insensitive substrings
#   "session limit", "usage limit", "rate limit", "resets at", and
#   the canonical Claude phrasing "you've hit your". If Anthropic
#   changes the wording this script needs an update; the patterns
#   live in $LimitPatterns at the top of the script.
# - The wrap commit message is single-line. Hooks (pre-commit, etc.)
#   are NOT bypassed - if a pre-commit fails, the wrap aborts the
#   commit step and the handoff still lands but the changes remain
#   uncommitted (the toast will still fire).
# - Idempotent: running -Watch twice creates two pollers (you'll get
#   two wraps). Re-running the immediate mode while a scheduled task
#   already exists overwrites it (matches schedule-resume.ps1's
#   semantics).

param(
  [double]$DelayHours = 3.0,
  [switch]$Watch,
  [switch]$DryRun,
  [switch]$NoCommit,
  [string]$HandoffTitle = "",
  [switch]$Cancel
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$HandoffsDir = Join-Path $RepoRoot "docs/handoffs"
$ScheduleScript = Join-Path $PSScriptRoot "schedule-resume.ps1"

# Substrings that, when seen in a Claude transcript JSONL line, mean
# the session has hit a limit. Matched case-insensitively.
$LimitPatterns = @(
  "session limit",
  "usage limit",
  "rate limit",
  "you've hit your",
  "resets at",
  "limit reached"
)

# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

function Invoke-Pwsh {
  # Run a PowerShell script via the best available interpreter:
  # pwsh (PowerShell 7+) if installed, else Windows PowerShell 5.1
  # (powershell.exe). Either accepts the same -NoProfile -File args.
  param(
    [Parameter(Mandatory=$true)][string]$ScriptPath,
    [object[]]$ScriptArgs = @()
  )
  $exe = $null
  $candidate = Get-Command pwsh -ErrorAction SilentlyContinue
  if ($candidate) { $exe = $candidate.Source }
  if (-not $exe) {
    $candidate = Get-Command powershell -ErrorAction SilentlyContinue
    if ($candidate) { $exe = $candidate.Source }
  }
  if (-not $exe) { throw "Neither pwsh nor powershell found on PATH." }
  & $exe -NoProfile -File $ScriptPath @ScriptArgs
}

function Get-LatestTranscriptPath {
  # Claude Code stores transcripts at:
  #   ~/.claude/projects/<slug>/<sessionId>.jsonl
  # where <slug> is the cwd with drive-colon stripped and path-slashes
  # replaced by hyphens (e.g. "c--Users-User-Developer-verrocchio").
  $slug = ($RepoRoot -replace "[:\\/]+", "-").TrimStart("-")
  # Normalize: drive letter "C-" becomes "c--"
  if ($slug -match "^([A-Za-z])-(.+)$") {
    $slug = $matches[1].ToLowerInvariant() + "--" + $matches[2]
  }
  $projectDir = Join-Path $env:USERPROFILE ".claude/projects/$slug"
  if (-not (Test-Path $projectDir)) { return $null }
  $latest = Get-ChildItem -Path $projectDir -Filter "*.jsonl" -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
  if ($latest) { return $latest.FullName }
  return $null
}

function Test-LineMatchesLimit {
  param([string]$Line)
  if (-not $Line) { return $false }
  $lower = $Line.ToLowerInvariant()
  foreach ($p in $LimitPatterns) {
    if ($lower.Contains($p)) { return $true }
  }
  return $false
}

function New-HandoffDoc {
  param(
    [string]$Title,
    [string]$Path
  )
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm K"
  $branch = ""
  $headSha = ""
  $headSubject = ""
  $recentLog = ""
  $statusShort = ""
  $diffStat = ""
  $untracked = ""
  try { $branch = (git -C $RepoRoot rev-parse --abbrev-ref HEAD) } catch {}
  try { $headSha = (git -C $RepoRoot rev-parse --short HEAD) } catch {}
  try { $headSubject = (git -C $RepoRoot log -1 --pretty=%s) } catch {}
  try { $recentLog = (git -C $RepoRoot log --oneline -10 | Out-String).Trim() } catch {}
  try { $statusShort = (git -C $RepoRoot status --short | Out-String).Trim() } catch {}
  try { $diffStat = (git -C $RepoRoot diff --stat HEAD | Out-String).Trim() } catch {}
  try { $untracked = (git -C $RepoRoot ls-files --others --exclude-standard | Out-String).Trim() } catch {}

  if (-not $Title) {
    $Title = if ($headSubject) { "Wrap: " + $headSubject } else { "Wrap at $ts" }
  }

  $resumeAt = (Get-Date).AddHours($DelayHours).ToString("yyyy-MM-dd HH:mm K")
  $statusBlock    = if ($statusShort) { $statusShort } else { "(clean tree - nothing uncommitted)" }
  $diffBlock      = if ($diffStat)    { $diffStat }    else { "(no changes against HEAD)" }
  $untrackedBlock = if ($untracked)   { $untracked }   else { "(none)" }
  $fence = '```'

  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine("# $Title")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("**Wrapped at:** $ts")
  [void]$sb.AppendLine("**Branch:** $branch")
  [void]$sb.AppendLine("**Head:** $headSha")
  [void]$sb.AppendLine("**Scheduled resume:** $resumeAt (in $DelayHours h)")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("---")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("## Why this handoff exists")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("A Claude session/account limit was hit (or about to be). This script")
  [void]$sb.AppendLine("captured the current git state so the next session can resume cleanly.")
  [void]$sb.AppendLine("A Windows scheduled task will fire a toast at the resume time pointing")
  [void]$sb.AppendLine("at this file.")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("## Recent commits (HEAD and 9 prior)")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine($fence)
  [void]$sb.AppendLine($recentLog)
  [void]$sb.AppendLine($fence)
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("## Uncommitted changes at wrap time")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine($fence)
  [void]$sb.AppendLine($statusBlock)
  [void]$sb.AppendLine($fence)
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("## Diff stat (staged + unstaged vs HEAD)")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine($fence)
  [void]$sb.AppendLine($diffBlock)
  [void]$sb.AppendLine($fence)
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("## Untracked files")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine($fence)
  [void]$sb.AppendLine($untrackedBlock)
  [void]$sb.AppendLine($fence)
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("## How to resume")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("1. Open Claude Code in this repo.")
  [void]$sb.AppendLine("2. Paste this prompt:")
  [void]$sb.AppendLine("")
  $relName = [System.IO.Path]::GetFileName($Path)
  [void]$sb.AppendLine("> Read ``$relName`` under docs/handoffs and continue from ""Recent commits"". Verify the working tree matches what's described, then proceed with the next item in the todo list / plan.")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("If a WIP commit was created during wrap, its message starts with")
  [void]$sb.AppendLine("``wip(wrap):`` - review and either keep it, squash it into the next")
  [void]$sb.AppendLine("meaningful commit, or reset it before continuing.")
  [void]$sb.AppendLine("")
  [void]$sb.AppendLine("To skip continuation, delete this handoff and run")
  [void]$sb.AppendLine("``pwsh -File scripts/wrap-and-resume.ps1 -Cancel`` to clear the toast.")

  Set-Content -Path $Path -Value $sb.ToString() -Encoding UTF8
}

function Invoke-WrapAndSchedule {
  # 1. Memorialize
  if (-not (Test-Path $HandoffsDir)) {
    New-Item -ItemType Directory -Path $HandoffsDir -Force | Out-Null
  }
  $stamp = Get-Date -Format "yyyy-MM-ddTHHmm"
  $handoffName = "HANDOFF_wrap_$stamp.md"
  $handoffPath = Join-Path $HandoffsDir $handoffName

  if ($DryRun) {
    Write-Host "[dry-run] Would write handoff: $handoffPath"
  } else {
    New-HandoffDoc -Title $HandoffTitle -Path $handoffPath
    Write-Host "Wrote handoff: $handoffPath"
  }

  # 2. WIP commit (if there are changes and -NoCommit not set)
  $hasChanges = $false
  try {
    $st = git -C $RepoRoot status --porcelain
    if ($st) { $hasChanges = $true }
  } catch { $hasChanges = $false }

  if ($hasChanges -and -not $NoCommit) {
    if ($DryRun) {
      Write-Host "[dry-run] Would stage all changes and commit as wip(wrap)"
    } else {
      $msg = "wip(wrap): session-limit handoff at " + (Get-Date -Format "yyyy-MM-dd HH:mm")
      git -C $RepoRoot add -A
      try {
        git -C $RepoRoot commit -m $msg | Out-Null
        Write-Host "Committed WIP: $msg"
      } catch {
        Write-Warning "WIP commit failed (likely a pre-commit hook). Handoff still written; changes remain uncommitted."
      }
    }
  } elseif ($hasChanges -and $NoCommit) {
    Write-Host "Changes present but -NoCommit set; left uncommitted."
  } else {
    Write-Host "No uncommitted changes to stash."
  }

  # 3. Schedule resume toast
  if ($DryRun) {
    Write-Host "[dry-run] Would schedule resume toast in $DelayHours h pointing at $handoffPath"
  } else {
    $relPath = "docs/handoffs/$handoffName"
    Invoke-Pwsh -ScriptPath $ScheduleScript -ScriptArgs @('-DelayHours', $DelayHours, '-HandoffPath', $relPath)
  }
}

# ---------------------------------------------------------------------
# -Cancel: bail early to the scheduler's cancel mode. Defined here
# (after Invoke-Pwsh) because PowerShell does not hoist function
# definitions — calling Invoke-Pwsh before its function block would
# raise CommandNotFoundException.
# ---------------------------------------------------------------------
if ($Cancel) {
  Invoke-Pwsh -ScriptPath $ScheduleScript -ScriptArgs @('-Cancel')
  return
}

# ---------------------------------------------------------------------
# Watch mode: tail the latest Claude transcript for limit markers.
# ---------------------------------------------------------------------
if ($Watch) {
  $transcript = Get-LatestTranscriptPath
  if (-not $transcript) {
    throw "Couldn't find a Claude transcript under ~/.claude/projects/. Open Claude Code in this repo first, then re-run -Watch."
  }
  Write-Host "Watching transcript: $transcript"
  Write-Host "(Ctrl-C to stop. Will exit after one wrap.)"

  # Start tailing AT the current EOF so we don't re-fire on a historical
  # limit message that already happened.
  $startSize = (Get-Item $transcript).Length

  while ($true) {
    Start-Sleep -Seconds 5
    if (-not (Test-Path $transcript)) {
      Start-Sleep -Seconds 5
      $transcript = Get-LatestTranscriptPath
      if (-not $transcript) { continue }
      $startSize = 0
      continue
    }
    $info = Get-Item $transcript
    if ($info.Length -le $startSize) { continue }

    # Read only the new tail bytes since we last checked.
    $fs = [System.IO.File]::Open($transcript, 'Open', 'Read', 'ReadWrite')
    try {
      [void]$fs.Seek($startSize, 'Begin')
      $reader = New-Object System.IO.StreamReader($fs)
      $newText = $reader.ReadToEnd()
      $reader.Close()
    } finally {
      $fs.Close()
    }
    $startSize = $info.Length

    $hit = $false
    foreach ($line in ($newText -split "`n")) {
      if (Test-LineMatchesLimit $line) { $hit = $true; break }
    }
    if ($hit) {
      Write-Host "Limit pattern detected. Wrapping..."
      Invoke-WrapAndSchedule
      Write-Host "Wrap complete. Exiting watch loop."
      return
    }
  }
}

# ---------------------------------------------------------------------
# Default: immediate one-shot wrap.
# ---------------------------------------------------------------------
Invoke-WrapAndSchedule
