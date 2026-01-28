import { createRoute } from '@granite-js/react-native';
import HealthCalculator from '../src/components/HealthCalculator';

export const Route = createRoute('/', {
  validateParams: (params) => params,
  component: HomePage,
});

export function HomePage() {
  return <HealthCalculator />;
}
