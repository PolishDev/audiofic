import React from 'react';
import { Tabs } from 'expo-router';
import { FloatingGlassTabBar } from '@/shared';

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}>
      <Tabs.Screen
        name="books"
        options={{
          title: 'Histórias',
        }}
      />
      <Tabs.Screen
        name="buscar"
        options={{
          title: 'Buscar',
        }}
      />
      <Tabs.Screen
        name="listas"
        options={{
          title: 'Listas',
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
        }}
      />
    </Tabs>
  );
}
