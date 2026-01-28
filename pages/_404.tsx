import { View, StyleSheet } from 'react-native';
import { Text } from '@toss/tds-react-native';

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text typography="h5" fontWeight="bold">페이지를 찾을 수 없습니다</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
