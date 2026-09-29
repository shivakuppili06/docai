import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders with loading state', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    // the svg for the spinner should be in the document
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByText('Delete');
    // Using simple checks for now since we used inline styles for testing
    // or class names depending on the actual implementation. 
    // In our implementation, variant applies inline styles.
    expect(button.style.backgroundColor).toContain('var(--color-danger)');
  });
});
