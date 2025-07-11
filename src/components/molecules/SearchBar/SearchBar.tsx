/**
 * @fileoverview SearchBar molecule component - Composes Input and Button atoms for location search
 * @see {@link file://./docs/explanations/frontend-ui-spec.md} for component specifications
 */

import React, { useState, FormEvent } from 'react';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { X, Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  onSearch: (query: string) => void;
  onLocationRequest?: () => void;
  onClear?: () => void;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  loading?: boolean;
  error?: string;
  showLocationButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SearchBar = React.forwardRef<HTMLFormElement, SearchBarProps>(
  ({
    onSearch,
    onLocationRequest,
    onClear,
    placeholder = 'Search for toilets near...',
    value: controlledValue,
    defaultValue,
    loading = false,
    error,
    showLocationButton = true,
    size = 'md',
    className,
  }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const hasValue = value && value.length > 0;

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (value.trim()) {
        onSearch(value.trim());
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (controlledValue === undefined) {
        setInternalValue(e.target.value);
      }
    };

    const handleClear = () => {
      if (controlledValue === undefined) {
        setInternalValue('');
      }
      onClear?.();
    };

    const sizeClasses = {
      sm: 'h-9',
      md: 'h-11',
      lg: 'h-12',
    };

    return (
      <form
        ref={ref}
        role="search"
        onSubmit={handleSubmit}
        className={cn('flex gap-2 w-full', className)}
        data-testid="search-bar"
      >
        <div className="relative flex-1">
          <Input
            type="search"
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            disabled={loading}
            aria-label="Search for locations"
            aria-describedby={error ? 'search-error' : undefined}
            className={cn(
              'pr-10 min-h-[44px]',
              sizeClasses[size],
              error && 'border-red-500'
            )}
          />
          {hasValue && onClear && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={loading}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            >
              <Icon icon={X} size="sm" />
            </Button>
          )}
        </div>
        
        <Button
          type="submit"
          disabled={loading || !value.trim()}
          aria-label="Search"
          {...(loading && { 'aria-busy': true })}
          className={cn('min-h-[44px]', sizeClasses[size])}
        >
          <Icon icon={Search} size="sm" />
          <span className="sr-only">Search</span>
        </Button>

        {showLocationButton && onLocationRequest && (
          <Button
            type="button"
            variant="outline"
            onClick={onLocationRequest}
            disabled={loading}
            aria-label="Use my location"
            className={cn('min-h-[44px]', sizeClasses[size])}
          >
            <Icon icon={MapPin} size="sm" />
            <span className="sr-only">Use my location</span>
          </Button>
        )}

        {error && (
          <div
            id="search-error"
            role="alert"
            className="absolute top-full mt-2 text-sm text-red-600"
          >
            {error}
          </div>
        )}
      </form>
    );
  }
);

SearchBar.displayName = 'SearchBar';