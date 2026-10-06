import glob from "@/styles/Global.module.css";

type ToggleButtonProps = {
    active: boolean;
    onClick: () => void;
    activeLabel: string;
    inactiveLabel: string;
    disabled?: boolean;
};

export default function ToggleButton({
    active,
    onClick,
    activeLabel,
    inactiveLabel,
    disabled = false,
}: ToggleButtonProps) {
    return (
        <button
            type="button"
            className={`${glob.toggleButton} ${active ? glob.toggleButtonActive : ""}`}
            onClick={onClick}
            disabled={disabled}
            aria-pressed={active}
        >
            {active ? activeLabel : inactiveLabel}
        </button>
    );
}