import glob from "@/styles/Global.module.css";
import est from "@/styles/Estimates.module.css";
import { EstimateStepNavProps } from "@/types";
import { ChevronLeft, ChevronRight, Loader } from "lucide-react";

export default function EstStepNav({
    currentStep,
    saving = false,
    previousDisabled = false,
    nextDisabled = false,
    onPrevious,
    onNext,
}: EstimateStepNavProps) {
    return (
        <div className={est.stepNavigation}>
            <button
                type="button"
                className={glob.buttonTwo}
                onClick={onPrevious}
                disabled={currentStep === 1 || previousDisabled || saving}
            >
                <ChevronLeft size={16} />
            </button>

            <button
                type="button"
                className={glob.button}
                onClick={onNext}
                disabled={currentStep === 5 || nextDisabled || saving}
            >
                {saving ? (
                    <Loader size={16} />
                ) : (
                    <ChevronRight size={16} />
                )}
            </button>
        </div>
    );
}