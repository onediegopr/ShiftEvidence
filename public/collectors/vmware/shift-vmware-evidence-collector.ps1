<#
Shift Evidence VMware Enrichment Collector
Copyright (c) Shift Evidence.
Developed as proprietary tooling for Shift Evidence migration readiness assessments.

This script is designed for read-only evidence collection from VMware vCenter.
It does not modify infrastructure, create resources, delete resources,
change configuration, create snapshots, delete snapshots, or persist credentials.

Review this script before execution.
The generated output file can be inspected locally before upload to Shift Evidence.
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string]$Server,

  [Parameter(Mandatory = $false)]
  [string]$OutputPath,

  [Parameter(Mandatory = $false)]
  [string]$OutputDirectory = ".",

  [switch]$SkipTags,
  [switch]$SkipSnapshots,
  [switch]$SkipDrs,
  [switch]$IncludeCsvSummary,
  [switch]$NoPrompt
)

$ErrorActionPreference = "Stop"
$CollectorVersion = "0.1.0"
$SchemaName = "shift-evidence.vmware-enrichment.v1"
$CollectorStartedAt = (Get-Date).ToUniversalTime()
$Warnings = New-Object System.Collections.Generic.List[object]
$Errors = New-Object System.Collections.Generic.List[object]

function Add-CollectorWarning {
  param(
    [string]$Code,
    [string]$Message,
    [string]$Target = $null
  )

  $Warnings.Add([ordered]@{
    code = $Code
    message = $Message
    target = $Target
  }) | Out-Null
}

function Add-CollectorError {
  param(
    [string]$Code,
    [string]$Message,
    [string]$Target = $null
  )

  $Errors.Add([ordered]@{
    code = $Code
    message = $Message
    target = $Target
  }) | Out-Null
}

function Invoke-SafeRead {
  param(
    [scriptblock]$ScriptBlock,
    [string]$WarningCode,
    [string]$WarningMessage,
    [string]$Target = $null,
    $Fallback = @()
  )

  try {
    return & $ScriptBlock
  } catch {
    Add-CollectorWarning -Code $WarningCode -Message ("$WarningMessage $($_.Exception.Message)") -Target $Target
    return $Fallback
  }
}

function Convert-ToGb {
  param($Value)
  if ($null -eq $Value) { return $null }
  try {
    return [math]::Round(([double]$Value / 1GB), 2)
  } catch {
    return $null
  }
}

function Get-FolderPath {
  param($Entity)
  try {
    $parts = New-Object System.Collections.Generic.List[string]
    $current = $Entity.Folder
    while ($null -ne $current) {
      if ($current.Name -and $current.Name -ne "vm") {
        $parts.Insert(0, $current.Name)
      }
      $current = $current.Parent
    }
    return ($parts -join "/")
  } catch {
    Add-CollectorWarning -Code "folder_path_unavailable" -Message "Unable to read folder path." -Target $Entity.Name
    return $null
  }
}

function Get-ResourcePoolPath {
  param($ResourcePool)
  try {
    if ($null -eq $ResourcePool) { return $null }
    $parts = New-Object System.Collections.Generic.List[string]
    $current = $ResourcePool
    while ($null -ne $current) {
      if ($current.Name -and $current.Name -ne "Resources") {
        $parts.Insert(0, $current.Name)
      }
      $current = $current.Parent
    }
    return ($parts -join "/")
  } catch {
    Add-CollectorWarning -Code "resource_pool_path_unavailable" -Message "Unable to read resource pool path."
    return $ResourcePool.Name
  }
}

function Get-ClusterNameForVm {
  param($Vm)
  try {
    $hostObject = $Vm.VMHost
    if ($null -eq $hostObject) { return $null }
    $cluster = Get-Cluster -VMHost $hostObject -ErrorAction SilentlyContinue
    return $cluster.Name
  } catch {
    return $null
  }
}

function Get-SafeString {
  param($Value)
  if ($null -eq $Value) { return $null }
  return [string]$Value
}

try {
  $powerCliModule = Get-Module -ListAvailable -Name VMware.PowerCLI | Select-Object -First 1
  if ($null -eq $powerCliModule) {
    Add-CollectorError -Code "powercli_missing" -Message "VMware.PowerCLI module is not available. Install VMware PowerCLI before running the collector."
    throw "VMware.PowerCLI module is required."
  }

  Import-Module VMware.PowerCLI -ErrorAction Stop | Out-Null
} catch {
  $result = [ordered]@{
    schema = $SchemaName
    collector = [ordered]@{
      name = "shift-vmware-evidence-collector"
      displayName = "Shift Evidence VMware Enrichment Collector"
      version = $CollectorVersion
      owner = "Shift Evidence"
      mode = "read-only"
    }
    source = [ordered]@{
      platform = "vmware-vsphere"
      server = $Server
      collectionStartedAt = $CollectorStartedAt.ToString("o")
      collectionEndedAt = (Get-Date).ToUniversalTime().ToString("o")
    }
    safety = [ordered]@{
      persistentCredentialsStored = $false
      configurationChanged = $false
      rawSecretsIncluded = $false
      networkUploadPerformed = $false
    }
    summary = [ordered]@{
      vmCount = 0
      hostCount = 0
      clusterCount = 0
      datastoreCount = 0
      networkCount = 0
      snapshotCount = 0
      tagAssignmentCount = 0
      warningCount = $Warnings.Count
      errorCount = $Errors.Count
    }
    entities = [ordered]@{
      vms = @()
      snapshots = @()
      tags = @()
      hosts = @()
      clusters = @()
      datastores = @()
      networks = @()
      drsRules = @()
    }
    warnings = @($Warnings)
    errors = @($Errors)
  }

  if (-not $OutputPath) {
    $OutputPath = Join-Path $OutputDirectory "shift-vmware-evidence-output.json"
  }
  $result | ConvertTo-Json -Depth 12 | Out-File -FilePath $OutputPath -Encoding utf8
  Write-Host "Collector failed before vCenter read. Output written to $OutputPath"
  exit 1
}

if ($Server) {
  try {
    if ($NoPrompt) {
      Connect-VIServer -Server $Server -ErrorAction Stop | Out-Null
    } else {
      Connect-VIServer -Server $Server -ErrorAction Stop | Out-Null
    }
  } catch {
    Add-CollectorError -Code "vcenter_connection_failed" -Message "Unable to connect to vCenter. $($_.Exception.Message)" -Target $Server
  }
}

$ConnectedServers = @($global:DefaultVIServers | Where-Object { $_.IsConnected })
if ($ConnectedServers.Count -eq 0) {
  Add-CollectorError -Code "vcenter_not_connected" -Message "No connected vCenter session found. Provide -Server or connect with Connect-VIServer first."
}

$VmObjects = @()
$HostObjects = @()
$ClusterObjects = @()
$DatastoreObjects = @()
$NetworkObjects = @()
$SnapshotObjects = @()
$TagAssignments = @()
$DrsRules = @()

if ($Errors.Count -eq 0) {
  $VmObjects = @(Invoke-SafeRead -ScriptBlock { Get-VM } -WarningCode "vm_read_failed" -WarningMessage "Unable to read VM inventory.")
  $HostObjects = @(Invoke-SafeRead -ScriptBlock { Get-VMHost } -WarningCode "host_read_failed" -WarningMessage "Unable to read hosts.")
  $ClusterObjects = @(Invoke-SafeRead -ScriptBlock { Get-Cluster } -WarningCode "cluster_read_failed" -WarningMessage "Unable to read clusters.")
  $DatastoreObjects = @(Invoke-SafeRead -ScriptBlock { Get-Datastore } -WarningCode "datastore_read_failed" -WarningMessage "Unable to read datastores.")
  $NetworkObjects = @(Invoke-SafeRead -ScriptBlock { Get-VirtualPortGroup } -WarningCode "network_read_failed" -WarningMessage "Unable to read virtual port groups.")

  if (-not $SkipSnapshots) {
    $SnapshotObjects = @(Invoke-SafeRead -ScriptBlock { Get-Snapshot -VM $VmObjects } -WarningCode "snapshot_read_failed" -WarningMessage "Unable to read snapshots.")
  }

  if (-not $SkipTags) {
    $TagAssignments = @(Invoke-SafeRead -ScriptBlock { Get-TagAssignment -Entity $VmObjects } -WarningCode "tag_read_failed" -WarningMessage "Unable to read tag assignments.")
  }

  if (-not $SkipDrs) {
    $DrsRules = @(Invoke-SafeRead -ScriptBlock { Get-DrsRule -Cluster $ClusterObjects } -WarningCode "drs_read_failed" -WarningMessage "Unable to read DRS rules.")
  }
}

$SnapshotByVmName = @{}
foreach ($snapshot in $SnapshotObjects) {
  $vmName = Get-SafeString $snapshot.VM.Name
  if (-not $SnapshotByVmName.ContainsKey($vmName)) {
    $SnapshotByVmName[$vmName] = New-Object System.Collections.Generic.List[object]
  }
  $SnapshotByVmName[$vmName].Add($snapshot) | Out-Null
}

$TagsByVmName = @{}
foreach ($assignment in $TagAssignments) {
  $vmName = Get-SafeString $assignment.Entity.Name
  if (-not $TagsByVmName.ContainsKey($vmName)) {
    $TagsByVmName[$vmName] = New-Object System.Collections.Generic.List[object]
  }
  $TagsByVmName[$vmName].Add($assignment) | Out-Null
}

$VmRows = @()
foreach ($vm in $VmObjects) {
  $view = $null
  try { $view = $vm.ExtensionData } catch { Add-CollectorWarning -Code "vm_view_unavailable" -Message "Unable to read VM extension data." -Target $vm.Name }

  $snapshotList = if ($SnapshotByVmName.ContainsKey($vm.Name)) { @($SnapshotByVmName[$vm.Name]) } else { @() }
  $snapshotAges = @($snapshotList | Where-Object { $_.Created } | ForEach-Object { [math]::Floor(((Get-Date) - $_.Created).TotalDays) })
  $tagList = if ($TagsByVmName.ContainsKey($vm.Name)) { @($TagsByVmName[$vm.Name]) } else { @() }
  $guest = $view.Guest
  $config = $view.Config

  if (-not $config.InstanceUuid) {
    Add-CollectorWarning -Code "vm_instance_uuid_missing" -Message "VM has no instance UUID available." -Target $vm.Name
  }

  $VmRows += [ordered]@{
    name = Get-SafeString $vm.Name
    id = Get-SafeString $vm.Id
    instanceUuid = Get-SafeString $config.InstanceUuid
    biosUuid = Get-SafeString $config.Uuid
    powerState = Get-SafeString $vm.PowerState
    guestId = Get-SafeString $config.GuestId
    guestFullName = Get-SafeString $config.GuestFullName
    numCpu = $vm.NumCpu
    memoryGB = [math]::Round([double]$vm.MemoryGB, 2)
    provisionedSpaceGB = [math]::Round([double]$vm.ProvisionedSpaceGB, 2)
    usedSpaceGB = [math]::Round([double]$vm.UsedSpaceGB, 2)
    folder = Get-FolderPath -Entity $vm
    resourcePool = Get-ResourcePoolPath -ResourcePool $vm.ResourcePool
    vmHost = Get-SafeString $vm.VMHost.Name
    cluster = Get-ClusterNameForVm -Vm $vm
    datastores = @($vm.DatastoreIdList | ForEach-Object { Get-SafeString $_ })
    networks = @($vm.NetworkAdapters | ForEach-Object { Get-SafeString $_.NetworkName } | Where-Object { $_ })
    toolsStatus = Get-SafeString $guest.ToolsStatus
    hardwareVersion = Get-SafeString $config.Version
    notes = Get-SafeString $vm.Notes
    tags = @($tagList | ForEach-Object { Get-SafeString $_.Tag.Name })
    customAttributes = @($vm.CustomFields | ForEach-Object { [ordered]@{ name = Get-SafeString $_.Key; value = Get-SafeString $_.Value } })
    snapshotCount = $snapshotList.Count
    newestSnapshotAgeDays = if ($snapshotAges.Count -gt 0) { ($snapshotAges | Measure-Object -Minimum).Minimum } else { $null }
    oldestSnapshotAgeDays = if ($snapshotAges.Count -gt 0) { ($snapshotAges | Measure-Object -Maximum).Maximum } else { $null }
  }
}

$SnapshotRows = @()
foreach ($snapshot in $SnapshotObjects) {
  $ageDays = if ($snapshot.Created) { [math]::Floor(((Get-Date) - $snapshot.Created).TotalDays) } else { $null }
  if ($ageDays -ge 30) {
    Add-CollectorWarning -Code "old_snapshot_detected" -Message "Snapshot older than 30 days detected." -Target $snapshot.VM.Name
  }

  $SnapshotRows += [ordered]@{
    vmName = Get-SafeString $snapshot.VM.Name
    snapshotName = Get-SafeString $snapshot.Name
    created = if ($snapshot.Created) { $snapshot.Created.ToUniversalTime().ToString("o") } else { $null }
    ageDays = $ageDays
    sizeGB = if ($snapshot.SizeMB) { [math]::Round(([double]$snapshot.SizeMB / 1024), 2) } else { $null }
    description = Get-SafeString $snapshot.Description
  }
}

$TagRows = @()
foreach ($assignment in $TagAssignments) {
  $TagRows += [ordered]@{
    vmName = Get-SafeString $assignment.Entity.Name
    tag = Get-SafeString $assignment.Tag.Name
    category = Get-SafeString $assignment.Tag.Category.Name
    entityType = Get-SafeString $assignment.Entity.GetType().Name
  }
}

$HostRows = @()
foreach ($hostObject in $HostObjects) {
  $hostView = $null
  try { $hostView = $hostObject.ExtensionData } catch { }
  $HostRows += [ordered]@{
    hostName = Get-SafeString $hostObject.Name
    clusterName = Get-SafeString (Get-Cluster -VMHost $hostObject -ErrorAction SilentlyContinue).Name
    cpuModel = Get-SafeString $hostView.Hardware.CpuPkg[0].Description
    cpuTotalMhz = $hostObject.CpuTotalMhz
    memoryTotalGB = [math]::Round([double]$hostObject.MemoryTotalGB, 2)
    version = Get-SafeString $hostObject.Version
    build = Get-SafeString $hostObject.Build
    connectionState = Get-SafeString $hostObject.ConnectionState
    maintenanceMode = [bool]$hostObject.ExtensionData.Runtime.InMaintenanceMode
  }
}

$ClusterRows = @()
foreach ($clusterObject in $ClusterObjects) {
  $ClusterRows += [ordered]@{
    clusterName = Get-SafeString $clusterObject.Name
    haEnabled = [bool]$clusterObject.HAEnabled
    drsEnabled = [bool]$clusterObject.DrsEnabled
    drsAutomationLevel = Get-SafeString $clusterObject.DrsAutomationLevel
  }
}

$DatastoreRows = @()
foreach ($datastore in $DatastoreObjects) {
  $DatastoreRows += [ordered]@{
    datastoreName = Get-SafeString $datastore.Name
    type = Get-SafeString $datastore.Type
    capacityGB = [math]::Round([double]$datastore.CapacityGB, 2)
    freeGB = [math]::Round([double]$datastore.FreeSpaceGB, 2)
    vmNames = @($VmObjects | Where-Object { $_.Datastores.Name -contains $datastore.Name } | ForEach-Object { Get-SafeString $_.Name })
  }
}

$NetworkRows = @()
foreach ($vm in $VmObjects) {
  foreach ($adapter in @($vm.NetworkAdapters)) {
    $NetworkRows += [ordered]@{
      vmName = Get-SafeString $vm.Name
      networkName = Get-SafeString $adapter.NetworkName
      adapterName = Get-SafeString $adapter.Name
      macAddress = Get-SafeString $adapter.MacAddress
      connected = [bool]$adapter.ConnectionState.Connected
      distributedPortGroup = Get-SafeString $adapter.ExtensionData.Backing.Port.PortgroupKey
    }
  }
}

$DrsRows = @()
foreach ($rule in $DrsRules) {
  $DrsRows += [ordered]@{
    name = Get-SafeString $rule.Name
    enabled = [bool]$rule.Enabled
    type = Get-SafeString $rule.Type
    cluster = Get-SafeString $rule.Cluster.Name
    vmNames = @($rule.VMIds | ForEach-Object { Get-SafeString $_ })
  }
}

$CollectorEndedAt = (Get-Date).ToUniversalTime()
$Result = [ordered]@{
  schema = $SchemaName
  collector = [ordered]@{
    name = "shift-vmware-evidence-collector"
    displayName = "Shift Evidence VMware Enrichment Collector"
    version = $CollectorVersion
    owner = "Shift Evidence"
    mode = "read-only"
  }
  source = [ordered]@{
    platform = "vmware-vsphere"
    server = $Server
    collectionStartedAt = $CollectorStartedAt.ToString("o")
    collectionEndedAt = $CollectorEndedAt.ToString("o")
  }
  safety = [ordered]@{
    persistentCredentialsStored = $false
    configurationChanged = $false
    rawSecretsIncluded = $false
    networkUploadPerformed = $false
  }
  summary = [ordered]@{
    vmCount = $VmRows.Count
    hostCount = $HostRows.Count
    clusterCount = $ClusterRows.Count
    datastoreCount = $DatastoreRows.Count
    networkCount = $NetworkRows.Count
    snapshotCount = $SnapshotRows.Count
    tagAssignmentCount = $TagRows.Count
    warningCount = $Warnings.Count
    errorCount = $Errors.Count
  }
  entities = [ordered]@{
    vms = @($VmRows)
    snapshots = @($SnapshotRows)
    tags = @($TagRows)
    hosts = @($HostRows)
    clusters = @($ClusterRows)
    datastores = @($DatastoreRows)
    networks = @($NetworkRows)
    drsRules = @($DrsRows)
  }
  warnings = @($Warnings)
  errors = @($Errors)
}

if (-not $OutputPath) {
  if (-not (Test-Path -LiteralPath $OutputDirectory)) {
    New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
  }
  $timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")
  $OutputPath = Join-Path $OutputDirectory "shift-vmware-evidence-output-$timestamp.json"
}

$Result | ConvertTo-Json -Depth 16 | Out-File -FilePath $OutputPath -Encoding utf8
Write-Host "Shift Evidence VMware enrichment output written to $OutputPath"

if ($IncludeCsvSummary) {
  $csvPath = [System.IO.Path]::ChangeExtension($OutputPath, ".vms.csv")
  $VmRows | Export-Csv -Path $csvPath -NoTypeInformation -Encoding utf8
  Write-Host "VM CSV summary written to $csvPath"
}

if ($Errors.Count -gt 0) {
  exit 1
}
