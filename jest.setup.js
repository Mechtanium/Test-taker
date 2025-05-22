// jest.setup.js
import '@testing-library/jest-dom';

// If you're using a global fetch mock, you can set it up here.
// Example:
// import fetchMock from 'jest-fetch-mock';
// fetchMock.enableMocks();

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => null),
    };
  },
}));

// Mock next/font
jest.mock('next/font/google', () => ({
  Geist: () => ({
    style: {
      fontFamily: 'mocked-geist-sans',
    },
    variable: '--font-geist-sans',
  }),
  Geist_Mono: () => ({
    style: {
      fontFamily: 'mocked-geist-mono',
    },
    variable: '--font-geist-mono',
  }),
}));

// Mock for next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// Mock for lucide-react icons if they cause issues in tests
// jest.mock('lucide-react', () => ({
//   ...jest.requireActual('lucide-react'), // Import and retain default behavior
//   MapPin: () => <div data-testid="lucide-map-pin" />, // Example mock for a specific icon
//   Loader2: () => <div data-testid="lucide-loader-2" />,
//   UserCircle2: () => <div data-testid="lucide-user-circle-2" />,
//   LogIn: () => <div data-testid="lucide-log-in" />,
//   LogOut: () => <div data-testid="lucide-log-out" />,
// }));


// If you need to mock localStorage or sessionStorage:
// const localStorageMock = (function() {
//   let store = {};
//   return {
//     getItem: function(key) {
//       return store[key] || null;
//     },
//     setItem: function(key, value) {
//       store[key] = value.toString();
//     },
//     removeItem: function(key) {
//       delete store[key];
//     },
//     clear: function() {
//       store = {};
//     }
//   };
// })();
// Object.defineProperty(window, 'localStorage', { value: localStorageMock });
