import {
  EvidenceModuleKey,
  EvidenceParseResultStatus,
  EvidenceModuleSourceType,
} from "@prisma/client";
import { getEvidenceModuleCatalog } from "./evidenceModuleRegistry";
import { createBackupEvidenceParser } from "./parsers/backupEvidenceParser";
import { createProxmoxTargetParser } from "./parsers/proxmoxTargetParser";
import { createVmwareEnrichmentParser } from "./parsers/vmwareEnrichmentParser";

export type EvidenceParserInput = {
  assessmentId: string;
  moduleKey: EvidenceModuleKey;
  evidenceFileId: string;
  evidenceUploadId?: string;
  filePath: string;
  mimeType?: string | null;
  originalFilename?: string | null;
  inputType?: EvidenceModuleSourceType | null;
  schemaVersion?: string | null;
};

export type EvidenceParserResult = {
  status: EvidenceParseResultStatus;
  summary: Record<string, unknown>;
  warnings: string[];
  errors: string[];
  normalizedEntities?: Record<string, unknown>;
  parserKey: string;
  parserVersion: string;
};

export type EvidenceParser = {
  parserKey: string;
  parserVersion: string;
  supportedModules: EvidenceModuleKey[];
  supportedInputTypes: EvidenceModuleSourceType[];
  parse: (input: EvidenceParserInput) => Promise<EvidenceParserResult> | EvidenceParserResult;
};

function parserMatches(input: EvidenceParserInput, parser: EvidenceParser) {
  const inputType = input.inputType ?? EvidenceModuleSourceType.manual;
  return parser.supportedModules.includes(input.moduleKey) && parser.supportedInputTypes.includes(inputType);
}

export class EvidenceParserRegistry {
  private parsers = new Map<string, EvidenceParser>();

  register(parser: EvidenceParser) {
    if (this.parsers.has(parser.parserKey)) {
      throw new Error(`Evidence parser already registered: ${parser.parserKey}`);
    }

    this.parsers.set(parser.parserKey, parser);
  }

  list() {
    return Array.from(this.parsers.values());
  }

  resolve(input: EvidenceParserInput) {
    return this.list().find((parser) => parserMatches(input, parser)) ?? null;
  }

  async parse(input: EvidenceParserInput): Promise<EvidenceParserResult> {
    const parser = this.resolve(input);
    if (!parser) {
      return createUnsupportedParserResult(input);
    }

    try {
      return await parser.parse(input);
    } catch (error) {
      return {
        status: EvidenceParseResultStatus.failed,
        summary: {
          moduleKey: input.moduleKey,
          originalFilename: input.originalFilename ?? null,
        },
        warnings: [],
        errors: [error instanceof Error ? error.message : "Evidence parser failed."],
        normalizedEntities: {},
        parserKey: parser.parserKey,
        parserVersion: parser.parserVersion,
      };
    }
  }
}

export function createUnsupportedParserResult(input: EvidenceParserInput): EvidenceParserResult {
  return {
    status: EvidenceParseResultStatus.unsupported,
    summary: {
      moduleKey: input.moduleKey,
      originalFilename: input.originalFilename ?? null,
      note: "No parser is available for this evidence module/input type yet.",
    },
    warnings: [
      "Evidence was attached to the assessment, but no technical parser is available yet for this module.",
    ],
    errors: [],
    normalizedEntities: {},
    parserKey: "unsupported",
    parserVersion: "0.0.0",
  };
}

export function createMetadataOnlyParser(): EvidenceParser {
  return {
    parserKey: "evidence-metadata-only-v1",
    parserVersion: "1.0.0",
    supportedModules: getEvidenceModuleCatalog().map((module) => module.key),
    supportedInputTypes: [
      EvidenceModuleSourceType.manual,
      EvidenceModuleSourceType.csv,
      EvidenceModuleSourceType.xlsx,
      EvidenceModuleSourceType.json,
      EvidenceModuleSourceType.collector_output,
    ],
    parse(input) {
      return {
        status: EvidenceParseResultStatus.parsed_with_warnings,
        summary: {
          moduleKey: input.moduleKey,
          originalFilename: input.originalFilename ?? null,
          schemaVersion: input.schemaVersion ?? null,
          parserMode: "metadata_only",
        },
        warnings: [
          "Metadata-only parser recorded the upload. Domain-specific analysis will be added in a future evidence hito.",
        ],
        errors: [],
        normalizedEntities: {
          files: [
            {
              evidenceFileId: input.evidenceFileId,
              originalFilename: input.originalFilename ?? null,
              mimeType: input.mimeType ?? null,
              inputType: input.inputType ?? null,
            },
          ],
        },
        parserKey: "evidence-metadata-only-v1",
        parserVersion: "1.0.0",
      };
    },
  };
}

export function createDefaultEvidenceParserRegistry() {
  const registry = new EvidenceParserRegistry();
  registry.register(createVmwareEnrichmentParser());
  registry.register(createProxmoxTargetParser());
  registry.register(createBackupEvidenceParser());
  registry.register(createMetadataOnlyParser());
  return registry;
}

export const defaultEvidenceParserRegistry = createDefaultEvidenceParserRegistry();
