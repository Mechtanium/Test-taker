import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginBar from '@/components/LoginBar';
import type { Member } from '@/lib/utils';

// Mock lucide-react icons used in LoginBar
jest.mock('lucide-react', () => ({
  ...jest.requireActual('lucide-react'), // Import and retain default behavior for other icons
  UserCircle2: () => <div data-testid="icon-user-circle-2" />,
  LogIn: () => <div data-testid="icon-log-in" />,
  LogOut: () => <div data-testid="icon-log-out" />,
}));


describe('LoginBar Component', () => {
  const mockOnLogin = jest.fn();
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    mockOnLogin.mockClear();
    mockOnLogout.mockClear();
  });

  it('renders Login button and no user info when member is null', () => {
    render(<LoginBar member={null} onLogin={mockOnLogin} onLogout={mockOnLogout} isLoading={false} />);
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    expect(screen.queryByText(/Hi,/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('icon-log-in')).toBeInTheDocument();
  });

  it('renders Login button and no user info when member is undefined', () => {
    render(<LoginBar member={undefined} onLogin={mockOnLogin} onLogout={mockOnLogout} isLoading={false} />);
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    expect(screen.queryByText(/Hi,/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('icon-log-in')).toBeInTheDocument();
  });

  it('renders user greeting and Logout button when member is provided', () => {
    const member: Member = {
      _id: 'test-member-id',
      profile: { nickname: 'TestUser Nickname' },
      contact: { firstName: 'TestFirstName' }
    };
    render(<LoginBar member={member} onLogin={mockOnLogin} onLogout={mockOnLogout} isLoading={false} />);
    expect(screen.getByText(/Hi, TestUser/i)).toBeInTheDocument(); // Uses first word of nickname
    expect(screen.getByRole('button')).toBeInTheDocument(); // The button for logout exists
    expect(screen.getByTestId('icon-log-out')).toBeInTheDocument();
    expect(screen.queryByText(/Login/i)).not.toBeInTheDocument();
  });

  it('uses contact.firstName for greeting if nickname is not available', () => {
    const member: Member = {
      _id: 'test-member-id',
      profile: { nickname: null }, // No nickname
      contact: { firstName: 'ContactFirst' }
    };
    render(<LoginBar member={member} onLogin={mockOnLogin} onLogout={mockOnLogout} isLoading={false} />);
    expect(screen.getByText(/Hi, ContactFirst/i)).toBeInTheDocument();
  });
  
  it('uses "User" for greeting if nickname and firstName are not available', () => {
    const member: Member = {
      _id: 'test-member-id',
      profile: { nickname: null }, 
      contact: { firstName: null }
    };
    render(<LoginBar member={member} onLogin={mockOnLogin} onLogout={mockOnLogout} isLoading={false} />);
    expect(screen.getByText(/Hi, User/i)).toBeInTheDocument();
  });

  it('calls onLogin when Login button is clicked', () => {
    render(<LoginBar member={null} onLogin={mockOnLogin} onLogout={mockOnLogout} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    expect(mockOnLogin).toHaveBeenCalledTimes(1);
  });

  it('calls onLogout when Logout button is clicked', () => {
    const member: Member = { _id: 'test-member-id', profile: { nickname: 'TestUser' } };
    render(<LoginBar member={member} onLogin={mockOnLogin} onLogout={mockOnLogout} isLoading={false} />);
    fireEvent.click(screen.getByRole('button')); // The button now implicitly means logout
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('shows "Processing..." and disables button when isLoading is true (logged out state)', () => {
    render(<LoginBar member={null} onLogin={mockOnLogin} onLogout={mockOnLogout} isLoading={true} />);
    expect(screen.getByText(/Processing.../i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows "Processing..." and disables button when isLoading is true (logged in state)', () => {
    const member: Member = { _id: 'test-member-id', profile: { nickname: 'TestUser' } };
    render(<LoginBar member={member} onLogin={mockOnLogin} onLogout={mockOnLogout} isLoading={true} />);
    expect(screen.getByText(/Processing.../i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
