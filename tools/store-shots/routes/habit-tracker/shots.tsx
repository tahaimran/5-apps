// TEMPORARY (store screenshots via web, do not commit): seeds demo data, then opens ?go=
import { useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { sharedStore } from '@shared/storage';
import { restoreBackup } from '@/features/backup/files';
import { useProfile } from '@/store/profile';


const demo = (globalThis as any).__DEMO__ ?? require('../../../tools/store-shots/data/ht-demo.json');

export default function Shots() {
  const p = useLocalSearchParams<Record<string, string>>();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (!p.fresh) {
      restoreBackup(demo);
      sharedStore.set('onboarding.completedAt', Date.now());
      useProfile.getState().update({ onboardingDone: true, notifPermission: 'granted' });
    }
    if (p.theme) sharedStore.set('theme.mode', p.theme as never);
    setTimeout(() => router.replace((p.go ?? '/(tabs)') as never), 50);
  }, [p]);
  return <View />;
}
