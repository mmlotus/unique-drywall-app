import glob from "@/styles/Global.module.css";
import est from "@/styles/Estimates.module.css";
import { EstimateStepNavProps } from "@/types";
import { ChevronLeft, ChevronRight, Loader } from "lucide-react";

export default function EstStepNav({
    currentStep,
    saving = false,
    previousDisabled = false,
    nextDisabled = false,
    exitDisabled = false,
    onPrevious,
    onNext,
    onSaveAndExit,
    onFinalize,
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
                className={glob.actionButton}
                onClick={onSaveAndExit}
                disabled={exitDisabled || saving}
            >
                Save & Exit
            </button>

            <button
                type="button"
                className={glob.button}
                onClick={currentStep === 5 ? onFinalize : onNext}
                disabled={nextDisabled || saving}
            >
                {saving ? (
                    <Loader size={16} />
                ) : currentStep === 5 ? (
                    "Finalize"
                ) : (
                    <ChevronRight size={16} />
                )}
            </button>
        </div>
    );
}