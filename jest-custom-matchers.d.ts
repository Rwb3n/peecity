/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveValue(value: string | string[] | number): R;
      toBeDisabled(): R;
      toHaveAttribute(attribute: string, value?: string): R;
      toHaveFocus(): R;
      toHaveTextContent(text: string | RegExp): R;
    }
  }
}

export {};