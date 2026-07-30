"use client";
import { ChevronDown } from "lucide-react";

interface UseCaseBannerProps {
  selectedUseCase: { industry: string; useCase: string; categoryNames: string[] } | null;
  onBackToUseCases: () => void;
}

/** Banner shown above the sticky header when the person came from the Use
 * Case picker gate — offers a "Back to Use Cases" action and, if a specific
 * use case is active, names it. */
export default function UseCaseBanner({ selectedUseCase, onBackToUseCases }: UseCaseBannerProps) {
  return (
    <div className="ucbanner">
      <button type="button" className="ucbanner-back-btn" onClick={onBackToUseCases}>
        <ChevronDown size={14} style={{ transform: "rotate(90deg)" }} /> Back to Use Cases
      </button>
      {selectedUseCase && (
        <span className="ucbanner-label">
          Use Case: <strong>{selectedUseCase.industry} → {selectedUseCase.useCase}</strong>
        </span>
      )}
    </div>
  );
}