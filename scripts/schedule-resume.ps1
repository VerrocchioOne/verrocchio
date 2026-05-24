# scripts/schedule-resume.ps1
#
# Schedule a one-shot Claude Code "resume" wakeup via Windows Task
# Scheduler. Intended for: you hit a Claude session/account limit, you
# step away, you want Claude to pick the work back up automatically once
# the limit resets.
#
# What it does
# ------------
# Creates a Windows scheduled task that fires once after the requested
# delay (default: 1 hour from now). The task fires a Windows toast
# notification (or a MessageBox fallback) telling you to open Claude
# Code and paste a one-line resume prompt that points at the latest
# HANDOFF_*.md in docs/handoffs/.
#
# Why a notification and not a headless `claude` invocation
# ---------------------------------------------------------
# Claude Code is interactive. The VSCode extension and the CLI both
# expect a human-attached terminal. Running `claude` headlessly from
# Task Scheduler is fragile (auth tokens, IPC, no TTY). A toast tells
# you exactly what to do, requires no special privileges, and pairs
# cleanly with the in-session CronCreate cron (which already handles
# the "Claude is still open" case).
#
# Usage
# -----
#   # default: fire in 1 hour, point at the latest handoff
#   pwsh -File scripts/schedule-resume.ps1
#
#   # custom delay (e.g. session limit resets in 2 hours)
#   pwsh -File scripts/schedule-resume.ps1 -DelayHours 2
#
#   # custom handoff (for a different work stream)
#   pwsh -File scripts/schedule-resume.ps1 -HandoffPath "docs/handoffs/HANDOFF_other_topic.md"
#
#   # cancel a previously-scheduled wakeup
#   pwsh -File scripts/schedule-resume.ps1 -Cancel
#
# Idempotent: re-running replaces the existing task with the new schedule.

param(
  [double]$DelayHours = 1.0,
  [string]$HandoffPath = "",
  [switch]$Cancel
)

$ErrorActionPreference = "Stop"
$TaskName = "Verrocchio-ClaudeResume"
$RepoRoot = Split-Path -Parent $PSScriptRoot

if ($Cancel) {
  $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  if ($existing) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Cancelled scheduled wakeup '$TaskName'."
  } else {
    Write-Host "No scheduled wakeup named '$TaskName' to cancel."
  }
  return
}

# Resolve the handoff to point the user at when the wakeup fires.
if (-not $HandoffPath) {
  $candidates = Get-ChildItem -Path (Join-Path $RepoRoot "docs/handoffs") -Filter "HANDOFF_*.md" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
  if (-not $candidates) {
    throw "No HANDOFF_*.md files under docs/handoffs/. Pass -HandoffPath explicitly."
  }
  $HandoffPath = (Resolve-Path -Relative $candidates[0].FullName)
}
if (-not (Test-Path (Join-Path $RepoRoot $HandoffPath))) {
  throw "Handoff file not found: $HandoffPath"
}

$FireAt = (Get-Date).AddHours($DelayHours)

$resumeMsg = "Verrocchio resume time. Open Claude Code and paste: Read $HandoffPath and continue from `"Where We're Going`"."

# Action: pop a BurntToast notification if available, else a MessageBox.
$cmd = @"
`$ErrorActionPreference = 'Continue'
`$msg = '$($resumeMsg -replace "'", "''")'
if (Get-Module -ListAvailable -Name BurntToast) {
  Import-Module BurntToast
  New-BurntToastNotification -Text 'Verrocchio: Claude resume time', `$msg
} else {
  [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null
  [System.Windows.Forms.MessageBox]::Show(`$msg, 'Verrocchio: Claude resume time', 'OK', 'Information') | Out-Null
}
"@

# Encode the action as Base64 so quoting through Task Scheduler is safe.
$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($cmd))

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -WindowStyle Hidden -EncodedCommand $encoded"

$trigger = New-ScheduledTaskTrigger -Once -At $FireAt

# Remove the task itself shortly after it fires so we don't leave stale
# entries behind. PT1M (1 minute) instead of PT0S because Task Scheduler
# refuses zero-duration expiration deletion on some Windows builds.
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -DeleteExpiredTaskAfter (New-TimeSpan -Minutes 1)

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "One-shot wakeup to remind user to resume Claude work on Verrocchio." `
  -Force | Out-Null

Write-Host "Scheduled Claude resume reminder."
Write-Host "  Fires at:    $($FireAt.ToString('yyyy-MM-dd HH:mm zzz'))"
Write-Host "  Handoff:     $HandoffPath"
Write-Host "  Task name:   $TaskName"
Write-Host ""
Write-Host "Cancel anytime: pwsh -File scripts/schedule-resume.ps1 -Cancel"
