import React, { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/molecules/SearchBar/SearchBar';

/**
 * Diagnostic test – expected RED.
 * Reproduces the persistent React `act()` warning emitted by the SearchBar molecule.
 * The test purposely fails by asserting that **no** act() warning occurs.
 * Current behaviour: warning *is* emitted, so this test should fail, confirming the bug.
 */

describe('Diagnostics: SearchBar act() warning', () => {
  it('should not emit an act() warning during clear-button interaction', async () => {
    // Spy on console.error to capture act warnings
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<SearchBar onSearch={jest.fn()} onClear={jest.fn()} />);

    // Trigger interactions previously causing the warning, now wrapped in act
    const input = screen.getByPlaceholderText('Search for toilets near...');
    await act(async () => {
      await user.type(input, 'test');
    });

    const clearButton = await screen.findByRole('button', { name: /clear/i });
    await act(async () => {
      await user.click(clearButton);
    });

    // Allow React to flush updates
    await new Promise((r) => setTimeout(r, 0));

    // Detect if any act() warning was logged
    const hasActWarning = consoleErrorSpy.mock.calls.some((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('not wrapped in act'))
    );

    consoleErrorSpy.mockRestore();

    // Expect no act warnings after fix
    expect(hasActWarning).toBe(false);
  });
}); 