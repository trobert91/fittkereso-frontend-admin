import { ProductReference } from "@/models/product-reference";
import {
  UpdateProductReferenceCandidateDto,
  UpdateProductReferenceDto,
} from "./comment-update.dto";

/**
 * Flatten a `ProductReference` (with rich `candidates: ProductReferenceCandidate[]`)
 * to the wire shape `UpdateProductReferenceDto`. The backend ignores unknown keys
 * but does need `candidates[].modelId` (not nested `model.id`) and a clean DTO
 * surface so other isUndefined-gated fields stay untouched.
 *
 * Only fields that look "edited" are emitted — we don't want to overwrite
 * server-side state like `relevance` on every save. But since the legacy save
 * path always sent every field on the reference, we keep that behaviour for
 * everything except `candidates`, where we transform the rich array into the
 * DTO form the backend expects.
 */
export function mapReferenceToDto(
  reference: ProductReference,
): UpdateProductReferenceDto {
  // Strip rich relations the backend ignores anyway, and translate `candidates`
  // to the modelId-flavoured DTO form. Everything else passes through as-is.
  const {
    candidates,
    // Trimmed: server-only / heavy fields the wire DTO doesn't accept.
    comment: _comment,
    searchContext: _searchContext,
    context: _context,
    ambiguousResolution: _ambiguousResolution,
    ...rest
  } = reference;

  const dto: UpdateProductReferenceDto = {
    ...rest,
  };

  if (candidates) {
    const flattened: UpdateProductReferenceCandidateDto[] = candidates.map(
      (candidate) => ({
        modelId: candidate.model.id,
        confidence: candidate.confidence,
        isPrimary: candidate.isPrimary,
      }),
    );
    dto.candidates = flattened;
  }

  return dto;
}
