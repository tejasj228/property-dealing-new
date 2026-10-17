import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './components/Login/Login';
import Dashboard from './pages/Dashboard';
import { useAuth } from './contexts/AuthContext';
import { propertyAPI, areaAPI, contactAPI, analyticsAPI } from './services/api';

jest.mock('./contexts/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('./services/api', () => ({ analyticsAPI: { getOverview: jest.fn().mockResolvedValue({ available: false, reason: 'not_configured' }) }, propertyAPI: { getAll: jest.fn() }, areaAPI: { getAll: jest.fn() }, contactAPI: { getAll: jest.fn(), getStats: jest.fn() } }));
jest.mock('react-router-dom', () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });

beforeEach(() => analyticsAPI.getOverview.mockResolvedValue({ available:false, reason:'not_configured' }));

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


test('overview charts use real category counts and do not fabricate traffic', async () => {
  propertyAPI.getAll.mockResolvedValue({ data: [{ _id:'a', title:'House', propertyType:'residential' }, { _id:'b', title:'Office', propertyType:'commercial' }] });
  areaAPI.getAll.mockResolvedValue({ data:{} });
  contactAPI.getAll.mockResolvedValue({ data:[] });
  contactAPI.getStats.mockResolvedValue({ data:{ totalContacts:4, unreadCount:1, recentCount:3, statusCounts:{ new:1, contacted:3 } } });
  analyticsAPI.getOverview.mockResolvedValue({ available:false, reason:'not_configured' });
  render(<Dashboard />);
  expect(await screen.findByText('50% of your portfolio is residential.')).toBeInTheDocument();
  expect(await screen.findByText('Connect your website insights.')).toBeInTheDocument();
  expect(screen.queryByText('All time · production')).not.toBeInTheDocument();
});

test('login introduction can be paused and explored without affecting sign-in', () => {
  useAuth.mockReturnValue({ login:jest.fn(), error:null });
  render(<Login />);
  fireEvent.click(screen.getByRole('button', { name:/Explore/ }));
  expect(screen.getByText('Help buyers find their place.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name:'Play property introduction' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name:'Sign in' })).toBeDisabled();
});


test('login carousel advances every 2.2 seconds and stops when paused', () => {
  jest.useFakeTimers();
  useAuth.mockReturnValue({ login:jest.fn(), error:null });
  const view = render(<Login />);
  act(() => jest.advanceTimersByTime(2200));
  expect(screen.getByText('Help buyers find their place.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name:'Pause property introduction' }));
  act(() => jest.advanceTimersByTime(6000));
  expect(screen.getByText('Help buyers find their place.')).toBeInTheDocument();
  view.unmount(); jest.useRealTimers();
});
