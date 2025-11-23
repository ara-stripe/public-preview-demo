/**
 * @jest-environment node
 */
import { GET } from './route';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe');

// Mock fetch globally
global.fetch = jest.fn();

// Mock Next.js Request if needed
if (typeof Request === 'undefined') {
  global.Request = class Request {} as any;
}

describe('Money API Route - Wire Payment Method Integration', () => {
  let mockStripe: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock Stripe instance
    mockStripe = {
      v2: {
        core: {
          accountLinks: {
            create: jest.fn(),
          },
        },
      },
    };
    
    (Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(() => mockStripe);
    
    // Set environment variable
    process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  const createMockRequest = (params: Record<string, string>): NextRequest => {
    const url = new URL('http://localhost:3000/api/money');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return new NextRequest(url);
  };

  describe('Bank Account Local Capability', () => {
    it('should enable local capability when bankAccountLocal=true', async () => {
      const mockAccountResponse = {
        id: 'acct_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'true',
        bankAccountWire: 'false',
        cards: 'false',
        prefillIdentity: 'false',
      });

      await GET(request);

      // Verify fetch was called with correct capabilities
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.configuration.recipient.capabilities.bank_accounts).toEqual({
        local: { requested: true },
        wire: { requested: false },
      });
    });

    it('should disable local capability when bankAccountLocal=false', async () => {
      const mockAccountResponse = {
        id: 'acct_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'false',
        bankAccountWire: 'false',
        cards: 'true',
        prefillIdentity: 'false',
      });

      await GET(request);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Bank accounts should not be in capabilities when both local and wire are false
      expect(requestBody.configuration.recipient.capabilities.bank_accounts).toBeUndefined();
    });
  });

  describe('Bank Account Wire Capability', () => {
    it('should enable wire capability when bankAccountWire=true', async () => {
      const mockAccountResponse = {
        id: 'acct_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'false',
        bankAccountWire: 'true',
        cards: 'false',
        prefillIdentity: 'false',
      });

      await GET(request);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.configuration.recipient.capabilities.bank_accounts).toEqual({
        local: { requested: false },
        wire: { requested: true },
      });
    });

    it('should enable both local and wire when both are true', async () => {
      const mockAccountResponse = {
        id: 'acct_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'true',
        bankAccountWire: 'true',
        cards: 'false',
        prefillIdentity: 'false',
      });

      await GET(request);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.configuration.recipient.capabilities.bank_accounts).toEqual({
        local: { requested: true },
        wire: { requested: true },
      });
    });
  });

  describe('Cards Capability', () => {
    it('should enable cards capability when cards=true', async () => {
      const mockAccountResponse = {
        id: 'acct_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'false',
        bankAccountWire: 'false',
        cards: 'true',
        prefillIdentity: 'false',
      });

      await GET(request);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.configuration.recipient.capabilities.cards).toEqual({
        requested: true,
      });
    });

    it('should not include cards capability when cards=false', async () => {
      const mockAccountResponse = {
        id: 'acct_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'true',
        bankAccountWire: 'false',
        cards: 'false',
        prefillIdentity: 'false',
      });

      await GET(request);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.configuration.recipient.capabilities.cards).toBeUndefined();
    });
  });

  describe('Multiple Capabilities Combined', () => {
    it('should handle all three capabilities enabled', async () => {
      const mockAccountResponse = {
        id: 'acct_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'true',
        bankAccountWire: 'true',
        cards: 'true',
        prefillIdentity: 'false',
      });

      await GET(request);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.configuration.recipient.capabilities).toEqual({
        bank_accounts: {
          local: { requested: true },
          wire: { requested: true },
        },
        cards: { requested: true },
      });
    });

    it('should handle only wire and cards enabled', async () => {
      const mockAccountResponse = {
        id: 'acct_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'false',
        bankAccountWire: 'true',
        cards: 'true',
        prefillIdentity: 'false',
      });

      await GET(request);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.configuration.recipient.capabilities).toEqual({
        bank_accounts: {
          local: { requested: false },
          wire: { requested: true },
        },
        cards: { requested: true },
      });
    });
  });

  describe('Identity Prefill', () => {
    it('should include full identity when prefillIdentity=true', async () => {
      const mockAccountResponse = {
        id: 'acct_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'true',
        bankAccountWire: 'false',
        cards: 'false',
        prefillIdentity: 'true',
      });

      await GET(request);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.identity.country).toBe('us');
      expect(requestBody.identity.entity_type).toBe('individual');
      expect(requestBody.identity.individual).toBeDefined();
      expect(requestBody.identity.individual.given_name).toBe('Jenny');
      expect(requestBody.identity.individual.surname).toBe('Rosen');
    });

    it('should include only country when prefillIdentity=false', async () => {
      const mockAccountResponse = {
        id: 'acct_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'true',
        bankAccountWire: 'false',
        cards: 'false',
        prefillIdentity: 'false',
      });

      await GET(request);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.identity).toEqual({ country: 'us' });
    });
  });

  describe('Stripe API Integration', () => {
    it('should call Stripe API with correct headers', async () => {
      const mockAccountResponse = {
        id: 'acct_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'true',
        bankAccountWire: 'false',
        cards: 'false',
        prefillIdentity: 'false',
      });

      await GET(request);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      
      expect(fetchCall[0]).toBe('https://api.stripe.com/v2/core/accounts');
      expect(fetchCall[1].headers.Authorization).toBe('Bearer sk_test_123456789');
      expect(fetchCall[1].headers['Content-Type']).toBe('application/json');
      expect(fetchCall[1].headers['Stripe-Version']).toBe('2025-09-30.preview');
    });

    it('should create account link after successful account creation', async () => {
      const mockAccountResponse = {
        id: 'acct_test_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test_link_456',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'true',
        bankAccountWire: 'true',
        cards: 'false',
        prefillIdentity: 'false',
      });

      await GET(request);

      expect(mockStripe.v2.core.accountLinks.create).toHaveBeenCalledWith({
        account: 'acct_test_123',
        use_case: {
          type: 'account_onboarding',
          account_onboarding: {
            configurations: ['recipient'],
            return_url: 'https://example.com/return',
            refresh_url: 'https://example.com/reauth',
          },
        },
      });
    });

    it('should return account URL and ID on success', async () => {
      const mockAccountResponse = {
        id: 'acct_test_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test_link_456',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      const request = createMockRequest({
        bankAccountLocal: 'true',
        bankAccountWire: 'false',
        cards: 'false',
        prefillIdentity: 'false',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({
        url: 'https://connect.stripe.com/setup/s/test_link_456',
        accountId: 'acct_test_123',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle account creation failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request: Invalid parameters',
      });

      const request = createMockRequest({
        bankAccountLocal: 'true',
        bankAccountWire: 'false',
        cards: 'false',
        prefillIdentity: 'false',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Account creation failed' });
    });

    it('should log error details when account creation fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const request = createMockRequest({
        bankAccountLocal: 'true',
        bankAccountWire: 'false',
        cards: 'false',
        prefillIdentity: 'false',
      });

      await GET(request);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Account creation error:',
        'Internal Server Error'
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle missing query parameters gracefully', async () => {
      const mockAccountResponse = {
        id: 'acct_123',
        contact_email: 'jenny.rosen@example.com',
      };

      const mockAccountLinkResponse = {
        url: 'https://connect.stripe.com/setup/s/test123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccountResponse,
      });

      mockStripe.v2.core.accountLinks.create.mockResolvedValueOnce(mockAccountLinkResponse);

      // Create request with no query parameters
      const url = new URL('http://localhost:3000/api/money');
      const request = new NextRequest(url);

      await GET(request);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      // Should default to all false
      expect(requestBody.configuration.recipient.capabilities).toEqual({});
    });
  });
});

