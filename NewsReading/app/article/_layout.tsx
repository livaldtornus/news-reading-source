import { Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ArticleLayout() {
    return (
            <Stack screenOptions={{ headerShown: false, presentation: 'card' }} />  
      );
   
;
}