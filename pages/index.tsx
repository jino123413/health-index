import { createRoute } from '@granite-js/react-native';
import SalaryCalculator from '../src/components/SalaryCalculator';

export const Route = createRoute('/', {
  validateParams: (params) => params,
  component: HomePage,
});

export function HomePage() {
  return <SalaryCalculator />;
}
