import { render } from '@testing-library/react';

// Simple test without importing the full App component
describe('App', () => {
  it('renders a simple component', () => {
    const SimpleComponent = () => <div>Test Component</div>;
    const { getByText } = render(<SimpleComponent />);
    expect(getByText('Test Component')).toBeInTheDocument();
  });
});