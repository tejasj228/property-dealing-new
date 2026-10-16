import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './components/Login/Login';
import Dashboard from './pages/Dashboard';
import { useAuth } from './contexts/AuthContext';
import { propertyAPI, areaAPI, contactAPI } from './services/api';

jest.mock('./contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('./services/api', () => ({ propertyAPI: { getAll: jest.fn() }, areaAPI: { getAll: jest.fn() }, contactAPI: { getAll: jest.fn(), getStats: jest.fn() } }));
jest.mock('react-router-dom', () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });

test('sign-in preserves the existing authentication call and supports password visibility', async () => {
  const login = jest.fn().mockResolvedValue({ success: false });
  useAuth.mockReturnValue({ login, error: null });
  render(<Login />);
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'manager' } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'example-password' } });
  expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'text');
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(login).toHaveBeenCalledWith('manager', 'example-password'));
});

test('overview preserves partial real data and distinguishes unavailable counts from zero', async () => {
  propertyAPI.getAll.mockRejectedValue(new Error('Unavailable'));
  areaAPI.getAll.mockResolvedValue({ data: { actual: { name: 'Actual area' } } });
  contactAPI.getAll.mockResolvedValue({ data: [] });
  contactAPI.getStats.mockRejectedValue(new Error('Unavailable'));
  render(<Dashboard />);
  await screen.findByText(/couldn’t load properties, enquiry statistics/i);
  expect(screen.getAllByText('—')).toHaveLength(3);
  expect(screen.getByText('1')).toBeInTheDocument();
  expect(screen.getByText(/property data is unavailable/i)).toBeInTheDocument();
  expect(screen.getByText(/new website enquiries will appear here/i)).toBeInTheDocument();
});
