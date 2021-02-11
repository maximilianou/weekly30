import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Weekly Release, Please!!', () => {
  render(<App />);
  const linkElement = screen.getByText(/Weekly Release, Please!!/i);
  expect(linkElement).toBeInTheDocument();
});
