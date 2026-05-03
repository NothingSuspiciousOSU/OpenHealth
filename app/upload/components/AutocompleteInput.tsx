import { useState, useRef, useEffect } from 'react';
import {
    dropdownContainerClasses,
    dropdownMenuClasses,
    dropdownOptionClasses,
    dropdownEmptyClasses,
    inputClasses,
    fieldLabelClasses
} from './formStyles';

type AutocompleteInputProps = {
    label?: string;
    name: string;
    value: string;
    onChange: (event: any) => void;
    onSelect?: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    suggestions: string[];
    required?: boolean;
};

export function AutocompleteInput({
    label,
    name,
    value,
    onChange,
    onSelect,
    disabled,
    placeholder,
    suggestions,
    required = false
}: AutocompleteInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const filtered = (value || '').trim() === ''
        ? suggestions
        : suggestions.filter(s => s.toLowerCase().includes((value || '').toLowerCase()));

    const showDropdown = isOpen && !disabled;

    return (
        <div className={dropdownContainerClasses} ref={wrapperRef}>
            {label && <label className={fieldLabelClasses}>{label} {required && '*'}</label>}
            <input
                type="text"
                name={name}
                value={value}
                onChange={(e) => {
                    onChange(e);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                disabled={disabled}
                className={inputClasses}
                placeholder={placeholder}
                autoComplete="off"
            />
            {showDropdown && (
                <div className={dropdownMenuClasses}>
                    {filtered.length > 0 ? (
                        filtered.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => {
                                    if (onSelect) onSelect(suggestion);
                                    else onChange({ target: { name, value: suggestion } });
                                    setIsOpen(false);
                                }}
                                className={dropdownOptionClasses}
                            >
                                {suggestion}
                            </button>
                        ))
                    ) : (
                        <div className={dropdownEmptyClasses}>
                            No suggestions found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
