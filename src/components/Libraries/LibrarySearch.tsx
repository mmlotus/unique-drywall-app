import libs from "@/styles/Libraries.module.css";

type LibrarySearchProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

export default function LibrarySearch({
    value,
    onChange,
    placeholder = "Search...",
}: LibrarySearchProps) {
    return (
        <div className={libs.librarySearch}>
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={libs.librarySearchInput}
            />
        </div>
    );
}