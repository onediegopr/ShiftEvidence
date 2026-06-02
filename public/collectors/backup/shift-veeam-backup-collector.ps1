<#
Shift Evidence Veeam Backup Evidence Collector
Copyright (c) Shift Evidence.
Developed as proprietary tooling for Shift Evidence migration readiness assessments.

Version: 0.1.0
Owner: Shift Evidence
Mode: read-only
Output schema: shift-evidence.backup-evidence.v1
Last reviewed: 2026-06-02

This script is designed for read-only evidence collection from Veeam Backup & Replication.
It does not modify backup jobs, start jobs, stop jobs, delete restore points,
change repositories, perform restores, change configuration, or persist credentials.

Review this script before execution.
The generated output file can be inspected locally before upload to Shift Evidence.
#>

[CmdletBinding()]
param(
  [string]$OutputPath = ".\shift-veeam-backup-output.json",
  [string]$OutputDirectory,
  [switch]$SkipRestorePoints,
  [switch]$SkipRepositories,
  [switch]$SkipBackupCopy,
  [int]$MaxRestorePointsPerObject = 20,
  [switch]$IncludeCsvSummary,
  [switch]$NoPrompt
)

$CollectorName = "shift-veeam-backup-collector"
$CollectorVersion = "0.1.0"
$Schema = "shift-evidence.backup-evidence.v1"
$Warnings = New-Object System.Collections.Generic.List[object]
$Errors = New-Object System.Collections.Generic.List[object]

function Add-CollectorWarning {
  param(
    [string]$Code,
    [string]$Message,
    [string]$Target = "collector",
    [string]$Severity = "warning"
  )
  $Warnings.Add([ordered]@{
    code = $Code
    message = $Message
    target = $Target
    severity = $Severity
  })
}

function Add-CollectorError {
  param(
    [string]$Code,
    [string]$Message,
    [string]$Target = "collector",
    [string]$Severity = "error"
  )
  $Errors.Add([ordered]@{
    code = $Code
    message = $Message
    target = $Target
    severity = $Severity
  })
}

function Invoke-ReadOnly {
  param(
    [string]$Name,
    [scriptblock]$Script
  )
  try {
    & $Script
  } catch {
    Add-CollectorWarning -Code "query_failed" -Message ("Read-only query failed: " + $_.Exception.Message) -Target $Name
    @()
  }
}

function Get-SafeString {
  param([object]$Value)
  if ($null -eq $Value) { return $null }
  $text = [string]$Value
  if ([string]::IsNullOrWhiteSpace($text)) { return $null }
  return $text.Trim()
}

function Get-SafeDate {
  param([object]$Value)
  if ($null -eq $Value) { return $null }
  try {
    return ([datetime]$Value).ToUniversalTime().ToString("o")
  } catch {
    return $null
  }
}

function Get-SafeBool {
  param([object]$Value)
  if ($null -eq $Value) { return $null }
  if ($Value -is [bool]) { return $Value }
  $text = ([string]$Value).Trim().ToLowerInvariant()
  if ($text -in @("true", "yes", "1", "enabled")) { return $true }
  if ($text -in @("false", "no", "0", "disabled")) { return $false }
  return $null
}

function Sanitize-PathLikeValue {
  param([object]$Value)
  $text = Get-SafeString $Value
  if (-not $text) { return $null }
  if ($text -match "^\\\\") { return "\\<sanitized-unc-path>" }
  if ($text -match "^[A-Za-z]:\\") { return "<sanitized-local-path>" }
  return $text
}

function Get-ObjectProperty {
  param(
    [object]$Object,
    [string[]]$Names
  )
  foreach ($name in $Names) {
    if ($null -eq $Object) { continue }
    $property = $Object.PSObject.Properties[$name]
    if ($property -and $null -ne $property.Value) {
      return $property.Value
    }
  }
  return $null
}

function Normalize-Job {
  param([object]$Job)
  $lastResult = Get-ObjectProperty $Job @("LastResult", "GetLastResult")
  $scheduleOptions = Get-ObjectProperty $Job @("ScheduleOptions")
  $scheduleEnabled = $null
  if ($scheduleOptions) {
    $scheduleEnabled = Get-SafeBool (Get-ObjectProperty $scheduleOptions @("OptionsDaily", "IsEnabled", "Enabled"))
  }

  [ordered]@{
    name = Get-SafeString (Get-ObjectProperty $Job @("Name"))
    id = Get-SafeString (Get-ObjectProperty $Job @("Id", "Uid"))
    type = Get-SafeString (Get-ObjectProperty $Job @("JobType", "Type"))
    platform = Get-SafeString (Get-ObjectProperty $Job @("Platform", "BackupPlatform"))
    enabled = Get-SafeBool (Get-ObjectProperty $Job @("IsScheduleEnabled", "IsEnabled", "Enabled"))
    scheduleEnabled = $scheduleEnabled
    lastResult = Get-SafeString $lastResult
    lastState = Get-SafeString (Get-ObjectProperty $Job @("LastState", "State"))
    lastRun = Get-SafeDate (Get-ObjectProperty $Job @("LastRun", "LatestRunLocal"))
    nextRun = Get-SafeDate (Get-ObjectProperty $Job @("NextRun", "NextRunLocal"))
    repository = Get-SafeString (Get-ObjectProperty $Job @("TargetRepository", "RepositoryName"))
    objectCount = $null
    backupCopyRelation = $null
  }
}

function Normalize-Session {
  param([object]$Session)
  $progress = Get-ObjectProperty $Session @("Progress")
  [ordered]@{
    jobName = Get-SafeString (Get-ObjectProperty $Session @("JobName", "Name"))
    sessionId = Get-SafeString (Get-ObjectProperty $Session @("Id", "Uid"))
    creationTime = Get-SafeDate (Get-ObjectProperty $Session @("CreationTime", "CreationTimeUtc"))
    endTime = Get-SafeDate (Get-ObjectProperty $Session @("EndTime", "EndTimeUtc"))
    result = Get-SafeString (Get-ObjectProperty $Session @("Result"))
    state = Get-SafeString (Get-ObjectProperty $Session @("State"))
    duration = Get-SafeString (Get-ObjectProperty $Session @("Duration"))
    processedObjects = Get-ObjectProperty $progress @("ProcessedObjects", "Processed")
    warnings = Get-ObjectProperty $progress @("Warnings", "WarningsCount")
    errors = Get-ObjectProperty $progress @("Errors", "ErrorsCount")
  }
}

function Normalize-ProtectedObject {
  param(
    [object]$Object,
    [string]$JobName,
    [string]$JobId
  )
  [ordered]@{
    name = Get-SafeString (Get-ObjectProperty $Object @("Name", "VmName", "DisplayName"))
    jobName = $JobName
    jobId = $JobId
    platform = Get-SafeString (Get-ObjectProperty $Object @("Platform", "Type"))
    inclusionSource = "job_object"
    instanceUuid = Get-SafeString (Get-ObjectProperty $Object @("InstanceUuid", "InstanceUUID", "VmInstanceUuid"))
    biosUuid = Get-SafeString (Get-ObjectProperty $Object @("BiosUuid", "BIOSUuid", "VmUuid"))
    lastBackupTime = $null
    lastSuccessfulRestorePoint = $null
    restorePointCount = 0
    latestResult = $null
    repository = $null
  }
}

function Normalize-RestorePoint {
  param([object]$RestorePoint)
  [ordered]@{
    objectName = Get-SafeString (Get-ObjectProperty $RestorePoint @("Name", "VmName", "DisplayName"))
    jobName = Get-SafeString (Get-ObjectProperty $RestorePoint @("JobName"))
    creationTime = Get-SafeDate (Get-ObjectProperty $RestorePoint @("CreationTime", "CreationTimeUtc"))
    type = Get-SafeString (Get-ObjectProperty $RestorePoint @("Type", "Algorithm"))
    repository = Get-SafeString (Get-ObjectProperty $RestorePoint @("RepositoryName"))
  }
}

function Normalize-Repository {
  param([object]$Repository)
  [ordered]@{
    name = Get-SafeString (Get-ObjectProperty $Repository @("Name"))
    id = Get-SafeString (Get-ObjectProperty $Repository @("Id", "Uid"))
    type = Get-SafeString (Get-ObjectProperty $Repository @("Type", "RepositoryType"))
    capacity = Get-ObjectProperty $Repository @("Capacity", "TotalSpace")
    free = Get-ObjectProperty $Repository @("FreeSpace", "Free")
    used = Get-ObjectProperty $Repository @("UsedSpace", "Used")
    path = Sanitize-PathLikeValue (Get-ObjectProperty $Repository @("Path", "FriendlyPath", "Description"))
  }
}

if ($OutputDirectory) {
  New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
  $OutputPath = Join-Path $OutputDirectory "shift-veeam-backup-output.json"
}

if (-not $NoPrompt) {
  Write-Host "Shift Evidence Veeam Backup Evidence Collector"
  Write-Host "Read-only mode. No jobs will be started/stopped and no restore points will be modified."
  Write-Host "Writing output to: $OutputPath"
}

$veeamModuleAvailable = $false
try {
  $module = Get-Module -ListAvailable -Name Veeam.Backup.PowerShell | Select-Object -First 1
  if ($module) {
    Import-Module Veeam.Backup.PowerShell -ErrorAction Stop
    $veeamModuleAvailable = $true
  } else {
    Add-CollectorWarning -Code "veeam_module_unavailable" -Message "Veeam PowerShell module was not found." -Target "Veeam.Backup.PowerShell"
  }
} catch {
  Add-CollectorWarning -Code "veeam_module_import_failed" -Message ("Veeam PowerShell module import failed: " + $_.Exception.Message) -Target "Veeam.Backup.PowerShell"
}

$jobs = @()
$sessions = @()
$protectedObjects = @()
$restorePoints = @()
$repositories = @()
$backupCopyJobs = @()

if ($veeamModuleAvailable) {
  $rawJobs = @(Invoke-ReadOnly -Name "Get-VBRJob" -Script { Get-VBRJob })
  $jobs = @($rawJobs | ForEach-Object { Normalize-Job $_ })

  foreach ($job in $rawJobs) {
    $jobName = Get-SafeString (Get-ObjectProperty $job @("Name"))
    $jobId = Get-SafeString (Get-ObjectProperty $job @("Id", "Uid"))
    $objects = @(Invoke-ReadOnly -Name "GetObjectsInJob" -Script {
      if ($job.PSObject.Methods["GetObjectsInJob"]) {
        $job.GetObjectsInJob()
      } else {
        @()
      }
    })
    foreach ($object in $objects) {
      $protectedObjects += Normalize-ProtectedObject -Object $object -JobName $jobName -JobId $jobId
    }
  }

  $sessions = @(Invoke-ReadOnly -Name "Get-VBRBackupSession" -Script { Get-VBRBackupSession } | Select-Object -First 200 | ForEach-Object { Normalize-Session $_ })

  if (-not $SkipRestorePoints) {
    $restorePoints = @(Invoke-ReadOnly -Name "Get-VBRRestorePoint" -Script { Get-VBRRestorePoint } |
      Select-Object -First ([Math]::Max(1, $MaxRestorePointsPerObject * 100)) |
      ForEach-Object { Normalize-RestorePoint $_ })
  } else {
    Add-CollectorWarning -Code "restore_points_skipped" -Message "Restore point collection was skipped by operator request." -Target "restorePoints" -Severity "info"
  }

  if (-not $SkipRepositories) {
    $repositories = @(Invoke-ReadOnly -Name "Get-VBRBackupRepository" -Script { Get-VBRBackupRepository } | ForEach-Object { Normalize-Repository $_ })
  } else {
    Add-CollectorWarning -Code "repositories_skipped" -Message "Repository collection was skipped by operator request." -Target "repositories" -Severity "info"
  }

  if (-not $SkipBackupCopy) {
    $backupCopyJobs = @($jobs | Where-Object { ($_.type -match "copy") -or ($_.name -match "copy") })
  } else {
    Add-CollectorWarning -Code "backup_copy_skipped" -Message "Backup copy collection was skipped by operator request." -Target "backupCopyJobs" -Severity "info"
  }
} else {
  Add-CollectorError -Code "veeam_unavailable" -Message "Veeam PowerShell was unavailable; collector output is limited." -Target "veeam"
}

$failedJobCount = @($jobs | Where-Object { $_.lastResult -match "failed" }).Count
$warningJobCount = @($jobs | Where-Object { $_.lastResult -match "warning" }).Count
$enabledJobCount = @($jobs | Where-Object { $_.enabled -eq $true }).Count
$disabledJobCount = @($jobs | Where-Object { $_.enabled -eq $false }).Count

$payload = [ordered]@{
  schema = $Schema
  collector = [ordered]@{
    name = $CollectorName
    displayName = "Shift Evidence Veeam Backup Evidence Collector"
    version = $CollectorVersion
    owner = "Shift Evidence"
    mode = "read-only"
  }
  source = [ordered]@{
    platform = "veeam-backup-replication"
    hostname = $env:COMPUTERNAME
    collectedAt = (Get-Date).ToUniversalTime().ToString("o")
    veeamPowerShellAvailable = $veeamModuleAvailable
  }
  safety = [ordered]@{
    persistentCredentialsStored = $false
    configurationChanged = $false
    rawSecretsIncluded = $false
    networkUploadPerformed = $false
    jobsStarted = $false
    jobsStopped = $false
    restorePerformed = $false
    restorePointsDeleted = $false
  }
  summary = [ordered]@{
    jobCount = @($jobs).Count
    enabledJobCount = $enabledJobCount
    disabledJobCount = $disabledJobCount
    protectedObjectCount = @($protectedObjects).Count
    restorePointObjectCount = @($restorePoints | Group-Object objectName).Count
    repositoryCount = @($repositories).Count
    failedJobCount = $failedJobCount
    warningJobCount = $warningJobCount
    backupCopyJobCount = @($backupCopyJobs).Count
    warningCount = $Warnings.Count
    errorCount = $Errors.Count
  }
  entities = [ordered]@{
    jobs = @($jobs)
    sessions = @($sessions)
    protectedObjects = @($protectedObjects)
    restorePoints = @($restorePoints)
    repositories = @($repositories)
    backupCopyJobs = @($backupCopyJobs)
  }
  warnings = @($Warnings)
  errors = @($Errors)
}

$json = $payload | ConvertTo-Json -Depth 12
$directory = Split-Path -Parent $OutputPath
if ($directory) {
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
}
Set-Content -Path $OutputPath -Value $json -Encoding UTF8

if ($IncludeCsvSummary) {
  $csvPath = [System.IO.Path]::ChangeExtension($OutputPath, ".summary.csv")
  @($jobs) | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
}

Write-Host "Shift Evidence backup evidence output written to $OutputPath"
