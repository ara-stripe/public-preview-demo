import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './page';

// Mock fetch globally
global.fetch = jest.fn();

describe('Home Component - Wire Payment Method Integration', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initial Render and UI Elements', () => {
    it('should render the main demo description', () => {
      render(<Home />);
      expect(screen.getByText(/Global Payouts demo page/i)).toBeInTheDocument();
    });

    it('should render all three capability checkboxes', () => {
      render(<Home />);
      expect(screen.getByText('Bank Account (Local)')).toBeInTheDocument();
      expect(screen.getByText('Bank Account (Wire)')).toBeInTheDocument();
      expect(screen.getByText('Cards')).toBeInTheDocument();
    });

    it('should have Bank Account (Local) enabled by default', () => {
      render(<Home />);
      const localCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Local\)/i });
      expect(localCheckbox).toBeChecked();
    });

    it('should have Bank Account (Wire) and Cards disabled by default', () => {
      render(<Home />);
      const wireCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Wire\)/i });
      const cardsCheckbox = screen.getByRole('checkbox', { name: /Cards/i });
      
      expect(wireCheckbox).not.toBeChecked();
      expect(cardsCheckbox).not.toBeChecked();
    });

    it('should render the Start Demo button', () => {
      render(<Home />);
      expect(screen.getByRole('button', { name: /Start Demo/i })).toBeInTheDocument();
    });
  });

  describe('Capability Selection Logic', () => {
    it('should toggle Bank Account (Local) when clicked', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const localCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Local\)/i });
      
      // Initially checked
      expect(localCheckbox).toBeChecked();
      
      // Uncheck it
      await user.click(localCheckbox);
      expect(localCheckbox).not.toBeChecked();
      
      // Check it again
      await user.click(localCheckbox);
      expect(localCheckbox).toBeChecked();
    });

    it('should toggle Bank Account (Wire) when clicked', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const wireCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Wire\)/i });
      
      // Initially unchecked
      expect(wireCheckbox).not.toBeChecked();
      
      // Check it
      await user.click(wireCheckbox);
      expect(wireCheckbox).toBeChecked();
      
      // Uncheck it
      await user.click(wireCheckbox);
      expect(wireCheckbox).not.toBeChecked();
    });

    it('should toggle Cards when clicked', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const cardsCheckbox = screen.getByRole('checkbox', { name: /Cards/i });
      
      // Initially unchecked
      expect(cardsCheckbox).not.toBeChecked();
      
      // Check it
      await user.click(cardsCheckbox);
      expect(cardsCheckbox).toBeChecked();
    });

    it('should allow both local and wire to be selected simultaneously', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const localCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Local\)/i });
      const wireCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Wire\)/i });
      
      // Enable wire while local is already enabled
      await user.click(wireCheckbox);
      
      expect(localCheckbox).toBeChecked();
      expect(wireCheckbox).toBeChecked();
    });

    it('should allow all three capabilities to be selected', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const localCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Local\)/i });
      const wireCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Wire\)/i });
      const cardsCheckbox = screen.getByRole('checkbox', { name: /Cards/i });
      
      await user.click(wireCheckbox);
      await user.click(cardsCheckbox);
      
      expect(localCheckbox).toBeChecked();
      expect(wireCheckbox).toBeChecked();
      expect(cardsCheckbox).toBeChecked();
    });
  });

  describe('Button State and Validation', () => {
    it('should disable Start Demo button when no capabilities are selected', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const localCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Local\)/i });
      const button = screen.getByRole('button', { name: /Start Demo/i });
      
      // Uncheck the default local option
      await user.click(localCheckbox);
      
      expect(button).toBeDisabled();
    });

    it('should show warning message when no capabilities are enabled', async () => {
      const user = userEvent.setup();
      render(<Home />);
      
      const localCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Local\)/i });
      
      // Uncheck the default local option
      await user.click(localCheckbox);
      
      expect(screen.getByText(/At least one capability must be enabled/i)).toBeInTheDocument();
    });

    it('should enable button when at least one capability is selected', () => {
      render(<Home />);
      const button = screen.getByRole('button', { name: /Start Demo/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('API Integration - Wire Payment Method', () => {
    it('should send bankAccountLocal parameter when Local is enabled', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        url: 'https://example.com/onboarding',
        accountId: 'acct_123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<Home />);
      const button = screen.getByRole('button', { name: /Start Demo/i });
      
      await user.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('bankAccountLocal=true')
        );
      });
    });

    it('should send bankAccountWire parameter when Wire is enabled', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        url: 'https://example.com/onboarding',
        accountId: 'acct_123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<Home />);
      
      // Enable Wire
      const wireCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Wire\)/i });
      await user.click(wireCheckbox);
      
      const button = screen.getByRole('button', { name: /Start Demo/i });
      await user.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('bankAccountWire=true')
        );
      });
    });

    it('should send correct parameters when both Local and Wire are enabled', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        url: 'https://example.com/onboarding',
        accountId: 'acct_123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<Home />);
      
      // Enable Wire (Local is already enabled by default)
      const wireCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Wire\)/i });
      await user.click(wireCheckbox);
      
      const button = screen.getByRole('button', { name: /Start Demo/i });
      await user.click(button);

      await waitFor(() => {
        const call = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(call).toContain('bankAccountLocal=true');
        expect(call).toContain('bankAccountWire=true');
      });
    });

    it('should send bankAccountLocal=false and bankAccountWire=false when neither is enabled', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        url: 'https://example.com/onboarding',
        accountId: 'acct_123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<Home />);
      
      // Disable Local, enable Cards
      const localCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Local\)/i });
      const cardsCheckbox = screen.getByRole('checkbox', { name: /Cards/i });
      
      await user.click(localCheckbox);
      await user.click(cardsCheckbox);
      
      const button = screen.getByRole('button', { name: /Start Demo/i });
      await user.click(button);

      await waitFor(() => {
        const call = (global.fetch as jest.Mock).mock.calls[0][0];
        expect(call).toContain('bankAccountLocal=false');
        expect(call).toContain('bankAccountWire=false');
        expect(call).toContain('cards=true');
      });
    });

    it('should display account information after successful API call', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        url: 'https://example.com/onboarding',
        accountId: 'acct_test_123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<Home />);
      const button = screen.getByRole('button', { name: /Start Demo/i });
      
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Account created:/i)).toBeInTheDocument();
        expect(screen.getByText(/acct_test_123/i)).toBeInTheDocument();
        expect(screen.getByText(/Account link URL available/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during API call', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<Home />);
      const button = screen.getByRole('button', { name: /Start Demo/i });
      
      await user.click(button);

      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      render(<Home />);
      const button = screen.getByRole('button', { name: /Start Demo/i });
      
      await user.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Settings Change Detection', () => {
    it('should change button text to "Regenerate Link" when settings change after URL generation', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        url: 'https://example.com/onboarding',
        accountId: 'acct_123',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      render(<Home />);
      
      // Generate initial link
      const button = screen.getByRole('button', { name: /Start Demo/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Open Link/i })).toBeInTheDocument();
      });

      // Change settings
      const wireCheckbox = screen.getByRole('checkbox', { name: /Bank Account \(Wire\)/i });
      await user.click(wireCheckbox);

      // Button should now say "Regenerate Link"
      expect(screen.getByRole('button', { name: /Regenerate Link/i })).toBeInTheDocument();
    });
  });

  describe('Prefill Identity Option', () => {
    it('should send prefillIdentity parameter correctly', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        url: 'https://example.com/onboarding',
        accountId: 'acct_123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<Home />);
      
      // Enable prefill identity
      const prefillCheckbox = screen.getByRole('checkbox', { name: /Prefill Identity Information/i });
      await user.click(prefillCheckbox);
      
      const button = screen.getByRole('button', { name: /Start Demo/i });
      await user.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('prefillIdentity=true')
        );
      });
    });
  });
});

