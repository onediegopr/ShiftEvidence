# Data Model v1

## Auth core
- `User`
- `Session`
- `Account`
- `Verification`

## App profile and workspace
- `UserProfile`
- `Workspace`
- `WorkspaceMember`

## Assessments
- `Assessment`
- `AssessmentModule`
- `CostRiskAssumptions`
- `AssessmentInfrastructureInput`
- `AssessmentPreliminaryResult`
- `StorageReadinessInput`
- `AssessmentEntitlement`
- `UnlockRequest`
- `EvidenceFile`
- `Report`
- `ParsedVM`
- `ParsedHost`
- `ParsedDatastore`
- `ParsedSnapshot`
- `ParsedInventorySummary`
- `RiskFinding`
- `AssessmentScore`
- `AuditEvent`
- `UpgradeEvent`

## Enums
- `WorkspacePlan`
- `BillingStatus`
- `WorkspaceRole`
- `AssessmentType`
- `SourcePlatform`
- `TargetPlatform`
- `AssessmentStatus`
- `PlanLevel`
- `RiskLevel`
- `EvidenceType`
- `EvidenceProcessingStatus`
- `ReportType`
- `ReportStatus`
- `ParsedRiskLevel`
- `RiskSeverity`
- `RiskFindingCategory`
- `RiskFindingSource`
- `StorageReadinessStatus`
- `AssessmentModuleKey`
- `AssessmentModuleStatus`
- `EntitlementKey`
- `EntitlementStatus`
- `UnlockRequestStatus`
- `UnlockRequestType`

## Relaciones clave
- `UserProfile.userId -> User.id`
- `Workspace.ownerUserId -> User.id`
- `WorkspaceMember.workspaceId -> Workspace.id`
- `WorkspaceMember.userId -> User.id`
- `Assessment.workspaceId -> Workspace.id`
- `Assessment.evidenceFiles -> EvidenceFile[]`
- `Assessment.reports -> Report[]`
- `Assessment.infrastructureInput -> AssessmentInfrastructureInput`
- `Assessment.preliminaryResult -> AssessmentPreliminaryResult`
- `AssessmentModule.assessmentId -> Assessment.id`
- `CostRiskAssumptions.assessmentId -> Assessment.id`
- `AssessmentInfrastructureInput.assessmentId -> Assessment.id`
- `AssessmentPreliminaryResult.assessmentId -> Assessment.id`
- `StorageReadinessInput.assessmentId -> Assessment.id`
- `AssessmentEntitlement.assessmentId -> Assessment.id`
- `UnlockRequest.assessmentId -> Assessment.id`
- `UnlockRequest.workspaceId -> Workspace.id`
- `UnlockRequest.userId -> User.id`
- `EvidenceFile.assessmentId -> Assessment.id`
- `EvidenceFile.workspaceId -> Workspace.id`
- `EvidenceFile.uploadedByUserId -> User.id`
- `Report.assessmentId -> Assessment.id`
- `Report.workspaceId -> Workspace.id`
- `Report.generatedByUserId -> User.id`
- `EvidenceFile -> ParsedVM[]`
- `EvidenceFile -> ParsedHost[]`
- `EvidenceFile -> ParsedDatastore[]`
- `EvidenceFile -> ParsedSnapshot[]`
- `EvidenceFile -> ParsedInventorySummary?`
- `Assessment -> ParsedVM[]`
- `Assessment -> ParsedHost[]`
- `Assessment -> ParsedDatastore[]`
- `Assessment -> ParsedSnapshot[]`
- `Assessment -> ParsedInventorySummary[]`
- `Assessment -> RiskFinding[]`
- `Assessment.assessmentScore -> AssessmentScore?`
- `EvidenceFile -> RiskFinding[]`
- `Assessment -> Report[]`
- `AuditEvent.userId/workspaceId/assessmentId` optional
- `UpgradeEvent.userId/workspaceId/assessmentId` optional

## Product rules encoded
- Cost / Risk Engine is included in every assessment.
- Storage Destination Readiness is optional.
- `Assessment` supports `clientLabel` and soft archive via `archivedAt` plus `archived` status.
- Manual infrastructure intake is the first editable source of evidence.
- Preliminary Cost / Risk preview is stored separately from raw assumptions.
- Completion status is derived from evidence, assumptions and preview state.
- RVTools evidence is stored as private local files with Neon metadata and secure download/delete.
- RVTools parser stores a preliminary inventory summary and parsed rows in Neon.
- Inventory-driven risk findings and readiness scores are derived from parsed inventory.
- Top findings and VM matrix remain preliminary and evidence-based.
- Future modules are reserved via enums but not implemented yet.
- The model supports future entitlements and paid add-ons.
- Report Preview is config-driven and reuses `AssessmentScore`, `RiskFinding`, `ParsedInventorySummary` and `UpgradeEvent`; it does not introduce a new Prisma table in Hito 6.
- PDF Preview v1 adds a `Report` table for generated files, private storage metadata, report history and secure downloads; it remains preliminary and does not imply a paid final report.
